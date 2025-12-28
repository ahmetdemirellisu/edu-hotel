// backend/routes/reservations.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { sendMail } = require("../services/mail");

const router = express.Router();
const prisma = new PrismaClient();

const checkBlacklist = require("../middleware/checkBlacklist");

/**
 * Helpers
 */
function parseDate(value) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

function diffInDays(start, end) {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((end - start) / msPerDay);
}

function isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
}

/**
 * Accept guestList either as:
 *  - Array<{ firstName, lastName }>
 *  - JSON string
 *  - null/undefined
 */
function normalizeGuestList(guestList) {
    if (!guestList) return null;

    if (Array.isArray(guestList)) {
        // Clean + keep only meaningful entries
        const cleaned = guestList
            .map((g) => ({
                firstName: typeof g?.firstName === "string" ? g.firstName.trim() : "",
                lastName: typeof g?.lastName === "string" ? g.lastName.trim() : "",
            }))
            .filter((g) => g.firstName || g.lastName);

        return cleaned.length ? cleaned : null;
    }

    if (typeof guestList === "string") {
        try {
            const parsed = JSON.parse(guestList);
            return normalizeGuestList(parsed);
        } catch {
            return null;
        }
    }

    return null;
}

/**
 * POST /reservations
 * Create a pre-reservation request (PENDING).
 */
router.post("/", checkBlacklist, async (req, res) => {
    try {
        const {
            userId: rawUserId,
            checkIn,
            checkOut,
            checkInTime, // "HH:MM" string
            guests,
            accommodationType, // PERSONAL | CORPORATE | EDUCATION
            invoiceType, // INDIVIDUAL | CORPORATE
            eventCode,
            note,

            // NEW fields (stored as real columns)
            firstName,
            lastName,
            phone,
            contactEmail,
            nationalId, // T.C. Kimlik No
            taxNumber,
            eventType,
            priceType,
            freeAccommodation,
            guestList,
        } = req.body;

        const userId = parseInt(rawUserId, 10);

        // Basic required fields
        if (
            !userId ||
            !checkIn ||
            !checkOut ||
            !guests ||
            !accommodationType ||
            !invoiceType
        ) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        // Contact info required for admin review + compliance
        if (
            !isNonEmptyString(firstName) ||
            !isNonEmptyString(lastName) ||
            !isNonEmptyString(phone) ||
            !isNonEmptyString(contactEmail)
        ) {
            return res
                .status(400)
                .json({ error: "Missing guest contact information." });
        }

        // Your UI shows this as required — enforce it
        if (!isNonEmptyString(checkInTime)) {
            return res.status(400).json({ error: "Check-in time is required." });
        }

        // For Corporate / Education, code required
        if (
            (accommodationType === "CORPORATE" || accommodationType === "EDUCATION") &&
            !isNonEmptyString(eventCode)
        ) {
            return res
                .status(400)
                .json({ error: "Event / Education code is required." });
        }

        // Billing ID fields depending on invoice type
        if (invoiceType === "INDIVIDUAL" && !isNonEmptyString(nationalId)) {
            return res
                .status(400)
                .json({ error: "National ID is required for individual billing." });
        }
        if (invoiceType === "CORPORATE" && !isNonEmptyString(taxNumber)) {
            return res
                .status(400)
                .json({ error: "Tax Number is required for corporate billing." });
        }

        // EventType is required in your UI
        if (!isNonEmptyString(eventType)) {
            return res.status(400).json({ error: "Event type is required." });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res
                .status(400)
                .json({ error: `User not found for id ${userId}. Please log in again.` });
        }

        const checkInDate = parseDate(checkIn);
        const checkOutDate = parseDate(checkOut);

        if (!checkInDate || !checkOutDate) {
            return res.status(400).json({ error: "Invalid date format." });
        }
        if (checkOutDate <= checkInDate) {
            return res
                .status(400)
                .json({ error: "Check-out must be after check-in." });
        }

        const guestsInt = parseInt(guests, 10);
        if (!guestsInt || guestsInt <= 0) {
            return res.status(400).json({ error: "Guests must be at least 1." });
        }

        const stayLength = diffInDays(checkInDate, checkOutDate);

        // Requirement: personal max 5 consecutive days (unless admin override, not implemented here)
        if (accommodationType === "PERSONAL" && stayLength > 5) {
            return res.status(400).json({
                error: "Personal bookings cannot exceed 5 consecutive nights.",
            });
        }

        // Rule: 30 days in advance (you currently apply to all users)
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        if (checkInDate > maxDate) {
            return res.status(400).json({
                error: "Reservations can only be made up to 30 days in advance.",
            });
        }

        // Rule: Sunday check-in not allowed
        if (checkInDate.getDay() === 0) {
            return res.status(400).json({ error: "Sunday check-in is not allowed." });
        }

        // Rule: Saturday check-in + Sunday check-out combination not allowed
        if (checkInDate.getDay() === 6 && checkOutDate.getDay() === 0) {
            return res.status(400).json({
                error:
                    "Saturday check-in & Sunday check-out combination is not allowed.",
            });
        }

        const normalizedGuestList = normalizeGuestList(guestList);

        const reservation = await prisma.reservation.create({
            data: {
                userId,
                checkIn: checkInDate,
                checkOut: checkOutDate,
                checkInTime: checkInTime.trim(),
                guests: guestsInt,

                accommodationType,
                invoiceType,
                eventCode: isNonEmptyString(eventCode) ? eventCode.trim() : null,

                // NEW: structured form fields
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim(),
                contactEmail: contactEmail.trim(),

                nationalId: isNonEmptyString(nationalId) ? nationalId.trim() : null,
                taxNumber: isNonEmptyString(taxNumber) ? taxNumber.trim() : null,

                eventType: isNonEmptyString(eventType) ? eventType.trim() : null,
                priceType: isNonEmptyString(priceType) ? priceType.trim() : null,

                freeAccommodation: !!freeAccommodation,

                guestList: normalizedGuestList ? normalizedGuestList : null,

                note: isNonEmptyString(note) ? note.trim() : null,

                // Snapshot
                guestType: user.userType || "OTHER",
            },
        });

        // ✉️ EMAIL — Reservation Request Received
        try {
            if (user.email) {
                const subject = "EDU Hotel – Reservation request received";
                const checkInStr = checkInDate.toISOString().slice(0, 10);
                const checkOutStr = checkOutDate.toISOString().slice(0, 10);

                const text = `
Dear ${firstName} ${lastName},

We have received your reservation request for EDU Hotel.

Check-in:  ${checkInStr} ${checkInTime}
Check-out: ${checkOutStr}
Guests:    ${guestsInt}
Accommodation: ${accommodationType}
Invoice: ${invoiceType}
Event type: ${eventType || "-"}
Event code: ${eventCode || "-"}

Our administration will review your request. You will be notified by email once it is approved or rejected.

Best regards,
EDU Hotel Team
`;

                const html = `
<p>Dear <strong>${firstName} ${lastName}</strong>,</p>
<p>Your reservation request has been received.</p>
<p>
<strong>Check-in:</strong> ${checkInStr} ${checkInTime}<br/>
<strong>Check-out:</strong> ${checkOutStr}<br/>
<strong>Guests:</strong> ${guestsInt}<br/>
<strong>Accommodation:</strong> ${accommodationType}<br/>
<strong>Invoice:</strong> ${invoiceType}<br/>
<strong>Event type:</strong> ${eventType || "-"}<br/>
<strong>Event code:</strong> ${eventCode || "-"}
</p>
<p>You will be notified once it is reviewed by the administration.</p>
`;

                await sendMail({ to: user.email, subject, text, html });
            }
        } catch (mailErr) {
            console.error("Failed to send request email:", mailErr);
        }

        return res.status(201).json(reservation);
    } catch (err) {
        console.error("Error creating reservation:", err);
        if (err.code === "P2003") {
            return res.status(400).json({
                error: "Reservation cannot be created because the user does not exist.",
            });
        }
        return res.status(500).json({ error: "Internal server error." });
    }
});

/**
 * GET /reservations/user/:userId
 */
router.get("/my/latest", async (req, res) => {
    try {
        const userId = parseInt(req.query.userId, 10);

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                error: "userId query parameter is required.",
            });
        }

        const reservation = await prisma.reservation.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: { room: true },
        });

        if (!reservation) {
            return res.status(404).json({
                error: "No reservations found.",
            });
        }

        return res.json(reservation);
    } catch (err) {
        console.error("Error fetching latest reservation:", err);
        return res.status(500).json({
            error: "Internal server error.",
        });
    }
});
router.get("/user/:userId", async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) return res.status(400).json({ error: "Invalid userId." });

        const reservations = await prisma.reservation.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: { room: true },
        });

        return res.json(reservations);
    } catch (err) {
        console.error("Error fetching user reservations:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

/**
 * GET /reservations/admin
 */
router.get("/admin", async (req, res) => {
    try {
        const { status, guestType } = req.query;

        const where = {};

        if (status) where.status = status;
        if (guestType) where.guestType = guestType;

        const reservations = await prisma.reservation.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: { user: true, room: true },
        });

        return res.json(reservations);
    } catch (err) {
        console.error("Error fetching admin reservations:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

/**
 * PATCH /reservations/admin/:id/approve
 */
router.patch("/admin/:id/approve", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { roomId } = req.body;

        const data = { status: "APPROVED" };
        if (roomId) data.roomId = roomId;

        const reservation = await prisma.reservation.update({
            where: { id },
            data,
            include: { user: true, room: true },
        });

        // ✉️ EMAIL — Reservation Approved
        try {
            if (reservation.user.email) {
                const subject = "EDU Hotel – Reservation approved";

                const checkInStr = reservation.checkIn.toISOString().slice(0, 10);
                const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);

                const roomInfo = reservation.room
                    ? `Room: ${reservation.room.name || reservation.room.id}`
                    : "Room will be assigned later.";

                const text = `
Dear ${reservation.firstName || reservation.user.name || "Guest"},

Your reservation request has been APPROVED.

Check-in:  ${checkInStr} ${reservation.checkInTime || ""}
Check-out: ${checkOutStr}
Guests:    ${reservation.guests}
${roomInfo}

We look forward to welcoming you to EDU Hotel.
`;

                const html = `
<p>Dear <strong>${reservation.firstName || reservation.user.name || "Guest"}</strong>,</p>
<p>Your reservation request has been <strong style="color:green">APPROVED</strong>.</p>

<p>
<strong>Check-in:</strong> ${checkInStr} ${reservation.checkInTime || ""}<br/>
<strong>Check-out:</strong> ${checkOutStr}<br/>
<strong>Guests:</strong> ${reservation.guests}<br/>
${roomInfo}
</p>

<p>We look forward to welcoming you.</p>
`;

                await sendMail({ to: reservation.user.email, subject, text, html });
            }
        } catch (mailErr) {
            console.error("Failed to send approval email:", mailErr);
        }

        return res.json(reservation);
    } catch (err) {
        console.error("Error approving reservation:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

/**
 * PATCH /reservations/admin/:id/reject
 */
router.patch("/admin/:id/reject", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { note } = req.body;

        const reservation = await prisma.reservation.update({
            where: { id },
            data: { status: "REJECTED", note: note || null },
            include: { user: true, room: true },
        });

        // ✉️ EMAIL — Reservation Rejected
        try {
            if (reservation.user.email) {
                const subject = "EDU Hotel – Reservation request rejected";

                const reasonEN = note
                    ? `Reason: ${note}`
                    : "Your reservation request could not be approved.";

                const text = `
Dear ${reservation.firstName || reservation.user.name || "Guest"},

Unfortunately, your reservation request could not be approved.
${reasonEN}

If you have any questions, please contact the hotel administration.
`;

                const html = `
<p>Dear <strong>${reservation.firstName || reservation.user.name || "Guest"}</strong>,</p>
<p>Your reservation request has been <strong style="color:red">rejected</strong>.</p>
<p>${reasonEN}</p>
`;

                await sendMail({ to: reservation.user.email, subject, text, html });
            }
        } catch (mailErr) {
            console.error("Failed to send rejection email:", mailErr);
        }

        return res.json(reservation);
    } catch (err) {
        console.error("Error rejecting reservation:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;
