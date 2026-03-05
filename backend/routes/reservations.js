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

function normalizeGuestList(guestList) {
    if (!guestList) return null;
    if (Array.isArray(guestList)) {
        const cleaned = guestList
            .map((g) => ({
                firstName: typeof g?.firstName === "string" ? g.firstName.trim() : "",
                lastName: typeof g?.lastName === "string" ? g.lastName.trim() : "",
            }))
            .filter((g) => g.firstName || g.lastName);
        return cleaned.length ? cleaned : null;
    }
    if (typeof guestList === "string") {
        try { return normalizeGuestList(JSON.parse(guestList)); }
        catch { return null; }
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
            userId: rawUserId, checkIn, checkOut, checkInTime,
            guests, accommodationType, invoiceType, eventCode, note,
            firstName, lastName, phone, contactEmail,
            nationalId, taxNumber, eventType, priceType,
            freeAccommodation, guestList,
        } = req.body;

        const userId = parseInt(rawUserId, 10);

        if (!userId || !checkIn || !checkOut || !guests || !accommodationType || !invoiceType) {
            return res.status(400).json({ error: "Missing required fields." });
        }
        if (!isNonEmptyString(firstName) || !isNonEmptyString(lastName) || !isNonEmptyString(phone) || !isNonEmptyString(contactEmail)) {
            return res.status(400).json({ error: "Missing guest contact information." });
        }
        if (!isNonEmptyString(checkInTime)) {
            return res.status(400).json({ error: "Check-in time is required." });
        }
        if ((accommodationType === "CORPORATE" || accommodationType === "EDUCATION") && !isNonEmptyString(eventCode)) {
            return res.status(400).json({ error: "Event / Education code is required." });
        }
        if (invoiceType === "INDIVIDUAL" && !isNonEmptyString(nationalId)) {
            return res.status(400).json({ error: "National ID is required for individual billing." });
        }
        if (invoiceType === "CORPORATE" && !isNonEmptyString(taxNumber)) {
            return res.status(400).json({ error: "Tax Number is required for corporate billing." });
        }
        if (!isNonEmptyString(eventType)) {
            return res.status(400).json({ error: "Event type is required." });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(400).json({ error: `User not found for id ${userId}. Please log in again.` });
        }

        const checkInDate = parseDate(checkIn);
        const checkOutDate = parseDate(checkOut);

        if (!checkInDate || !checkOutDate) return res.status(400).json({ error: "Invalid date format." });
        if (checkOutDate <= checkInDate) return res.status(400).json({ error: "Check-out must be after check-in." });

        const guestsInt = parseInt(guests, 10);
        if (!guestsInt || guestsInt <= 0) return res.status(400).json({ error: "Guests must be at least 1." });

        const stayLength = diffInDays(checkInDate, checkOutDate);

        if (accommodationType === "PERSONAL" && stayLength > 5) {
            return res.status(400).json({ error: "Personal bookings cannot exceed 5 consecutive nights." });
        }

        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        if (checkInDate > maxDate) {
            return res.status(400).json({ error: "Reservations can only be made up to 30 days in advance." });
        }

        if (checkInDate.getDay() === 0) return res.status(400).json({ error: "Sunday check-in is not allowed." });
        if (checkInDate.getDay() === 6 && checkOutDate.getDay() === 0) {
            return res.status(400).json({ error: "Saturday check-in & Sunday check-out combination is not allowed." });
        }

        const normalizedGuestList = normalizeGuestList(guestList);

        const reservation = await prisma.reservation.create({
            data: {
                userId, checkIn: checkInDate, checkOut: checkOutDate,
                checkInTime: checkInTime.trim(), guests: guestsInt,
                accommodationType, invoiceType,
                eventCode: isNonEmptyString(eventCode) ? eventCode.trim() : null,
                firstName: firstName.trim(), lastName: lastName.trim(),
                phone: phone.trim(), contactEmail: contactEmail.trim(),
                nationalId: isNonEmptyString(nationalId) ? nationalId.trim() : null,
                taxNumber: isNonEmptyString(taxNumber) ? taxNumber.trim() : null,
                eventType: isNonEmptyString(eventType) ? eventType.trim() : null,
                priceType: isNonEmptyString(priceType) ? priceType.trim() : null,
                freeAccommodation: !!freeAccommodation,
                guestList: normalizedGuestList ? normalizedGuestList : null,
                note: isNonEmptyString(note) ? note.trim() : null,
                guestType: user.userType || "OTHER",
            },
        });

        // ✉️ EMAIL — Reservation Request Received (EN + TR)
        try {
            if (user.email) {
                const checkInStr = checkInDate.toISOString().slice(0, 10);
                const checkOutStr = checkOutDate.toISOString().slice(0, 10);
                const guestName = firstName.trim();

                const subject = "EDU Hotel – Reservation request received / Rezervasyon talebi alındı";

                const text = `
Dear ${guestName} ${lastName.trim()},

We have received your reservation request for EDU Hotel.

Check-in:  ${checkInStr} ${checkInTime}
Check-out: ${checkOutStr}
Guests:    ${guestsInt}
Accommodation: ${accommodationType}
Invoice: ${invoiceType}
Event type: ${eventType || "-"}
Event code: ${eventCode || "-"}

Our administration team will review your request. You will be notified by email once it is approved or rejected.

---

Sayın ${guestName} ${lastName.trim()},

EDU Hotel için rezervasyon talebiniz alınmıştır.

Giriş:     ${checkInStr} ${checkInTime}
Çıkış:     ${checkOutStr}
Misafir:   ${guestsInt}
Konaklama: ${accommodationType}
Fatura:    ${invoiceType}
Etkinlik:  ${eventType || "-"}
Kod:       ${eventCode || "-"}

Yönetim ekibimiz talebinizi inceleyecektir. Onaylandığında veya reddedildiğinde e-posta ile bilgilendirileceksiniz.

EDU Hotel
`;

                const html = `
<p>Dear <strong>${guestName} ${lastName.trim()}</strong>,</p>
<p>We have received your reservation request for EDU Hotel.</p>
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

<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;" />

<p>Sayın <strong>${guestName} ${lastName.trim()}</strong>,</p>
<p>EDU Hotel için rezervasyon talebiniz alınmıştır.</p>
<p>
<strong>Giriş:</strong> ${checkInStr} ${checkInTime}<br/>
<strong>Çıkış:</strong> ${checkOutStr}<br/>
<strong>Misafir:</strong> ${guestsInt}<br/>
<strong>Konaklama:</strong> ${accommodationType}<br/>
<strong>Fatura:</strong> ${invoiceType}<br/>
<strong>Etkinlik:</strong> ${eventType || "-"}<br/>
<strong>Kod:</strong> ${eventCode || "-"}
</p>
<p>Yönetim ekibimiz talebinizi inceleyecektir.</p>

<p style="color: #888; font-size: 12px; margin-top: 24px;">EDU Hotel – Sabancı Üniversitesi</p>
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
            return res.status(400).json({ error: "Reservation cannot be created because the user does not exist." });
        }
        return res.status(500).json({ error: "Internal server error." });
    }
});

/**
 * GET /reservations/my/latest
 */
router.get("/my/latest", async (req, res) => {
    try {
        const userId = parseInt(req.query.userId, 10);
        if (!userId || isNaN(userId)) return res.status(400).json({ error: "userId query parameter is required." });

        const reservation = await prisma.reservation.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: { room: true },
        });

        if (!reservation) return res.status(404).json({ error: "No reservations found." });
        return res.json(reservation);
    } catch (err) {
        console.error("Error fetching latest reservation:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

/**
 * GET /reservations/user/:userId
 */
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

        // ── Double-booking prevention ──────────────────────
        if (roomId) {
            const reservation = await prisma.reservation.findUnique({ where: { id } });
            if (!reservation) return res.status(404).json({ error: "Reservation not found." });

            const overlapping = await prisma.reservation.findFirst({
                where: {
                    roomId: roomId,
                    id: { not: id },
                    status: { in: ["APPROVED"] },
                    // Overlap: existing checkIn < this checkOut AND existing checkOut > this checkIn
                    checkIn: { lt: reservation.checkOut },
                    checkOut: { gt: reservation.checkIn },
                },
            });

            if (overlapping) {
                const room = await prisma.room.findUnique({ where: { id: roomId } });
                return res.status(409).json({
                    error: `Room ${room?.name || roomId} is already booked from ${overlapping.checkIn.toISOString().slice(0, 10)} to ${overlapping.checkOut.toISOString().slice(0, 10)} (Reservation #${overlapping.id}). Please choose a different room.`,
                });
            }
        }
        // ── End double-booking check ──────────────────────

        const data = { status: "APPROVED" };
        if (roomId) data.roomId = roomId;

        const reservation = await prisma.reservation.update({
            where: { id },
            data,
            include: { user: true, room: true },
        });

        // ✉️ EMAIL — Reservation Approved (EN + TR)
        try {
            if (reservation.user?.email) {
                const guestName = reservation.firstName || reservation.user.name || "Guest";
                const checkInStr = reservation.checkIn.toISOString().slice(0, 10);
                const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);
                const roomInfo = reservation.room ? `Room: ${reservation.room.name}` : "Room will be assigned at check-in.";
                const roomInfoTR = reservation.room ? `Oda: ${reservation.room.name}` : "Oda bilgisi giriş sırasında iletilecektir.";

                const subject = "EDU Hotel – Reservation approved / Rezervasyon onaylandı";

                const text = `
Dear ${guestName},

Your reservation request #${reservation.id} has been APPROVED.

Check-in:  ${checkInStr} ${reservation.checkInTime || ""}
Check-out: ${checkOutStr}
Guests:    ${reservation.guests}
${roomInfo}

Please proceed with payment if applicable. We look forward to welcoming you.

---

Sayın ${guestName},

#${reservation.id} numaralı rezervasyon talebiniz ONAYLANDI.

Giriş:     ${checkInStr} ${reservation.checkInTime || ""}
Çıkış:     ${checkOutStr}
Misafir:   ${reservation.guests}
${roomInfoTR}

Gerekli ise lütfen ödeme işlemini gerçekleştirin. Sizi ağırlamayı dört gözle bekliyoruz.

EDU Hotel
`;

                const html = `
<p>Dear <strong>${guestName}</strong>,</p>
<p>Your reservation <strong>#${reservation.id}</strong> has been <strong style="color: green;">APPROVED</strong>.</p>
<p>
<strong>Check-in:</strong> ${checkInStr} ${reservation.checkInTime || ""}<br/>
<strong>Check-out:</strong> ${checkOutStr}<br/>
<strong>Guests:</strong> ${reservation.guests}<br/>
${roomInfo}
</p>
<p>Please proceed with payment if applicable.</p>

<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;" />

<p>Sayın <strong>${guestName}</strong>,</p>
<p><strong>#${reservation.id}</strong> numaralı rezervasyonunuz <strong style="color: green;">ONAYLANDI</strong>.</p>
<p>
<strong>Giriş:</strong> ${checkInStr} ${reservation.checkInTime || ""}<br/>
<strong>Çıkış:</strong> ${checkOutStr}<br/>
<strong>Misafir:</strong> ${reservation.guests}<br/>
${roomInfoTR}
</p>
<p>Gerekli ise lütfen ödeme işlemini gerçekleştirin.</p>

<p style="color: #888; font-size: 12px; margin-top: 24px;">EDU Hotel – Sabancı Üniversitesi</p>
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

        // ✉️ EMAIL — Reservation Rejected (EN + TR)
        try {
            if (reservation.user?.email) {
                const guestName = reservation.firstName || reservation.user.name || "Guest";
                const checkInStr = reservation.checkIn.toISOString().slice(0, 10);
                const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);
                const reasonEN = note ? `Reason: ${note}` : "Your reservation request could not be approved at this time.";
                const reasonTR = note ? `Neden: ${note}` : "Rezervasyon talebiniz şu anda onaylanamamıştır.";

                const subject = "EDU Hotel – Reservation rejected / Rezervasyon reddedildi";

                const text = `
Dear ${guestName},

Unfortunately, your reservation request #${reservation.id} has been rejected.

${reasonEN}

Check-in:  ${checkInStr}
Check-out: ${checkOutStr}

If you have questions, please contact the hotel administration.

---

Sayın ${guestName},

Maalesef, #${reservation.id} numaralı rezervasyon talebiniz reddedilmiştir.

${reasonTR}

Giriş:  ${checkInStr}
Çıkış:  ${checkOutStr}

Sorularınız için lütfen otel yönetimiyle iletişime geçin.

EDU Hotel
`;

                const html = `
<p>Dear <strong>${guestName}</strong>,</p>
<p>Your reservation <strong>#${reservation.id}</strong> has been <strong style="color: red;">rejected</strong>.</p>
<p>${reasonEN}</p>
<p>
<strong>Check-in:</strong> ${checkInStr}<br/>
<strong>Check-out:</strong> ${checkOutStr}
</p>
<p>If you have questions, please contact the hotel administration.</p>

<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;" />

<p>Sayın <strong>${guestName}</strong>,</p>
<p><strong>#${reservation.id}</strong> numaralı rezervasyonunuz <strong style="color: red;">reddedilmiştir</strong>.</p>
<p>${reasonTR}</p>
<p>
<strong>Giriş:</strong> ${checkInStr}<br/>
<strong>Çıkış:</strong> ${checkOutStr}
</p>
<p>Sorularınız için lütfen otel yönetimiyle iletişime geçin.</p>

<p style="color: #888; font-size: 12px; margin-top: 24px;">EDU Hotel – Sabancı Üniversitesi</p>
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

/**
 * PATCH /reservations/:id/cancel
 * User cancels their own reservation.
 */
router.patch("/:id/cancel", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { userId: rawUserId, reason } = req.body;

        const userId = parseInt(rawUserId, 10);
        if (!userId || isNaN(userId)) return res.status(400).json({ error: "userId is required." });

        const reservation = await prisma.reservation.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!reservation) return res.status(404).json({ error: "Reservation not found." });
        if (reservation.userId !== userId) return res.status(403).json({ error: "You can only cancel your own reservations." });
        if (!["PENDING", "APPROVED"].includes(reservation.status)) {
            return res.status(400).json({ error: `Cannot cancel a reservation with status "${reservation.status}".` });
        }
        if (reservation.paymentStatus === "APPROVED") {
            return res.status(400).json({ error: "Cannot cancel a reservation with confirmed payment. Please request a refund instead." });
        }

        const now = new Date();
        const checkInDate = new Date(reservation.checkIn);
        const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilCheckIn < 24) {
            return res.status(400).json({ error: "Cancellations must be made at least 24 hours before check-in." });
        }

        const updated = await prisma.reservation.update({
            where: { id },
            data: {
                status: "CANCELLED",
                note: reason
                    ? `[Cancelled by user] ${reason}`
                    : reservation.note
                    ? `${reservation.note}\n[Cancelled by user]`
                    : "[Cancelled by user]",
            },
            include: { user: true, room: true },
        });

        if (reservation.roomId) {
            await prisma.room.update({
                where: { id: reservation.roomId },
                data: { status: "AVAILABLE" },
            });
        }

        // ✉️ EMAIL — Reservation Cancelled (EN + TR)
        try {
            if (updated.user?.email) {
                const guestName = updated.firstName || updated.user.name || "Guest";
                const checkInStr = reservation.checkIn.toISOString().slice(0, 10);
                const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);
                const reasonEN = reason ? `Reason: ${reason}` : "";
                const reasonTR = reason ? `Neden: ${reason}` : "";

                const subject = "EDU Hotel – Reservation cancelled / Rezervasyon iptal edildi";

                const text = `
Dear ${guestName},

Your reservation #${id} has been cancelled as requested.

Check-in:  ${checkInStr}
Check-out: ${checkOutStr}
${reasonEN}

If this was a mistake, please create a new reservation or contact the hotel administration.

---

Sayın ${guestName},

#${id} numaralı rezervasyonunuz talebiniz üzerine iptal edilmiştir.

Giriş:  ${checkInStr}
Çıkış:  ${checkOutStr}
${reasonTR}

Bu bir hata ise lütfen yeni bir rezervasyon oluşturun veya otel yönetimiyle iletişime geçin.

EDU Hotel
`;

                const html = `
<p>Dear <strong>${guestName}</strong>,</p>
<p>Your reservation <strong>#${id}</strong> has been <strong style="color: red;">cancelled</strong> as requested.</p>
<p>
<strong>Check-in:</strong> ${checkInStr}<br/>
<strong>Check-out:</strong> ${checkOutStr}<br/>
${reasonEN ? `<strong>${reasonEN}</strong>` : ""}
</p>
<p>If this was a mistake, please create a new reservation.</p>

<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;" />

<p>Sayın <strong>${guestName}</strong>,</p>
<p><strong>#${id}</strong> numaralı rezervasyonunuz talebiniz üzerine <strong style="color: red;">iptal edilmiştir</strong>.</p>
<p>
<strong>Giriş:</strong> ${checkInStr}<br/>
<strong>Çıkış:</strong> ${checkOutStr}<br/>
${reasonTR ? `<strong>${reasonTR}</strong>` : ""}
</p>
<p>Bu bir hata ise lütfen yeni bir rezervasyon oluşturun.</p>

<p style="color: #888; font-size: 12px; margin-top: 24px;">EDU Hotel – Sabancı Üniversitesi</p>
`;

                await sendMail({ to: updated.user.email, subject, text, html });
            }
        } catch (mailErr) {
            console.error("Failed to send cancellation email:", mailErr);
        }

        return res.json(updated);
    } catch (err) {
        console.error("Error cancelling reservation:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;