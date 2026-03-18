// backend/routes/reservations.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { sendMail } = require("../services/mail");
const { emailTemplate, badge, row, detailTable, heading, ACCOMM_LABELS, INVOICE_LABELS } = require("../services/mailTemplate");

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
            freeAccommodation, guestList, billingTitle, billingAddress,
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
        if (invoiceType === "CORPORATE" && !isNonEmptyString(billingTitle)) {
            return res.status(400).json({ error: "Billing title (fatura unvanı) is required for corporate billing." });
        }
        if (invoiceType === "CORPORATE" && !isNonEmptyString(billingAddress)) {
            return res.status(400).json({ error: "Billing address (fatura adresi) is required for corporate billing." });
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
                billingTitle: isNonEmptyString(billingTitle) ? billingTitle.trim() : null,
                billingAddress: isNonEmptyString(billingAddress) ? billingAddress.trim() : null,
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
                const checkInStr  = checkInDate.toISOString().slice(0, 10);
                const checkOutStr = checkOutDate.toISOString().slice(0, 10);
                const fullName    = `${firstName.trim()} ${lastName.trim()}`;
                const accommEN    = ACCOMM_LABELS[accommodationType]?.en || accommodationType;
                const accommTR    = ACCOMM_LABELS[accommodationType]?.tr || accommodationType;
                const invoiceEN   = INVOICE_LABELS[invoiceType]?.en || invoiceType;
                const invoiceTR   = INVOICE_LABELS[invoiceType]?.tr || invoiceType;

                const subject = `EDU Hotel – Reservation request received #${reservation.id} / Rezervasyon talebi alındı #${reservation.id}`;

                const bodyEN = `
<p style="margin:0 0 4px;">Dear <strong>${fullName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">Thank you for choosing EDU Hotel. We have received your reservation request and it is now pending review by our administration team.</p>
${badge('Request Received', 'blue')}
${heading('Reservation Details')}
${detailTable([
    row('Reservation ID', `#${reservation.id}`),
    row('Check-in',       `${checkInStr} at ${checkInTime}`),
    row('Check-out',      checkOutStr),
    row('Guests',         guestsInt),
    row('Accommodation',  accommEN),
    row('Invoice type',   invoiceEN),
    row('Event type',     eventType || null),
    row('Event code',     isNonEmptyString(eventCode) ? eventCode : null),
    row('Note',           isNonEmptyString(note) ? note : null),
])}
${heading('What happens next?')}
<p style="margin:0;font-size:13px;color:#475569;">Our team will review your request and notify you by email once it has been approved or rejected.</p>`;

                const bodyTR = `
<p style="margin:0 0 4px;">Sayın <strong>${fullName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">EDU Hotel'i tercih ettiğiniz için teşekkür ederiz. Rezervasyon talebiniz alınmış olup yönetim ekibimiz tarafından incelenmektedir.</p>
${badge('Talep Alındı', 'blue')}
${heading('Rezervasyon Bilgileri')}
${detailTable([
    row('Rezervasyon No',  `#${reservation.id}`),
    row('Giriş',           `${checkInStr}, ${checkInTime}`),
    row('Çıkış',           checkOutStr),
    row('Misafir sayısı',  guestsInt),
    row('Konaklama türü',  accommTR),
    row('Fatura türü',     invoiceTR),
    row('Etkinlik türü',   eventType || null),
    row('Etkinlik kodu',   isNonEmptyString(eventCode) ? eventCode : null),
    row('Not',             isNonEmptyString(note) ? note : null),
])}
${heading('Sırada ne var?')}
<p style="margin:0;font-size:13px;color:#475569;">Ekibimiz talebinizi inceleyecek ve onaylandığında ya da reddedildiğinde e-posta ile bilgilendirileceksiniz.</p>`;

                const text = `EDU Hotel – Reservation request #${reservation.id} received.\nCheck-in: ${checkInStr} at ${checkInTime}\nCheck-out: ${checkOutStr}\nGuests: ${guestsInt}\n\nYou will be notified by email once your request is reviewed.\n\n---\n\nEDU Hotel – #${reservation.id} numaralı rezervasyon talebiniz alındı.\nGiriş: ${checkInStr}, ${checkInTime}\nÇıkış: ${checkOutStr}\nMisafir: ${guestsInt}\n\nTalebiniz incelendikten sonra e-posta ile bilgilendirileceksiniz.`;

                const html = emailTemplate(bodyEN, bodyTR);
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
        const { price } = req.body;

        const parsedPrice = price !== undefined && price !== null && price !== "" ? parseFloat(price) : null;

        const data = { status: "APPROVED" };
        if (parsedPrice !== null && !isNaN(parsedPrice)) data.price = parsedPrice;

        const reservation = await prisma.reservation.update({
            where: { id },
            data,
            include: { user: true, room: true },
        });

        // ✉️ EMAIL — Reservation Approved (EN + TR)
        try {
            if (reservation.user?.email) {
                const guestName   = reservation.firstName || reservation.user.name || "Guest";
                const checkInStr  = reservation.checkIn.toISOString().slice(0, 10);
                const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);

                const subject = `EDU Hotel – Reservation approved #${reservation.id} / Rezervasyon onaylandı #${reservation.id}`;

                const bodyEN = `
<p style="margin:0 0 4px;">Dear <strong>${guestName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">Great news! Your reservation request has been reviewed and approved by our administration team.</p>
${badge('Reservation Approved ✓', 'green')}
${heading('Reservation Details')}
${detailTable([
    row('Reservation ID', `#${reservation.id}`),
    row('Check-in',       `${checkInStr}${reservation.checkInTime ? ' at ' + reservation.checkInTime : ''}`),
    row('Check-out',      checkOutStr),
    row('Guests',         reservation.guests),
    row('Price',          reservation.price != null ? `${reservation.price} TL` : null),
])}
${heading('Next Step')}
<p style="margin:0;font-size:13px;color:#475569;">Please log in to your EDU Hotel account and upload your payment receipt to complete the reservation. Your room will be assigned upon payment confirmation.</p>`;

                const bodyTR = `
<p style="margin:0 0 4px;">Sayın <strong>${guestName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">Harika haber! Rezervasyon talebiniz yönetim ekibimiz tarafından incelenmiş ve onaylanmıştır.</p>
${badge('Rezervasyon Onaylandı ✓', 'green')}
${heading('Rezervasyon Bilgileri')}
${detailTable([
    row('Rezervasyon No', `#${reservation.id}`),
    row('Giriş',          `${checkInStr}${reservation.checkInTime ? ', ' + reservation.checkInTime : ''}`),
    row('Çıkış',          checkOutStr),
    row('Misafir sayısı', reservation.guests),
    row('Ücret',          reservation.price != null ? `${reservation.price} TL` : null),
])}
${heading('Sıradaki Adım')}
<p style="margin:0;font-size:13px;color:#475569;">Lütfen EDU Hotel hesabınıza giriş yaparak ödeme dekontunuzu yükleyin. Oda ataması ödeme onayının ardından gerçekleştirilecektir.</p>`;

                const text = `EDU Hotel – Your reservation #${reservation.id} has been APPROVED.\nCheck-in: ${checkInStr}${reservation.checkInTime ? ' at ' + reservation.checkInTime : ''}\nCheck-out: ${checkOutStr}\nGuests: ${reservation.guests}${reservation.price != null ? '\nPrice: ' + reservation.price + ' TL' : ''}\n\nPlease log in and upload your payment receipt to complete the reservation.\n\n---\n\nEDU Hotel – #${reservation.id} numaralı rezervasyonunuz ONAYLANDI.\nLütfen ödeme dekontunuzu sisteme yükleyin.`;

                const html = emailTemplate(bodyEN, bodyTR);
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
                const guestName   = reservation.firstName || reservation.user.name || "Guest";
                const checkInStr  = reservation.checkIn.toISOString().slice(0, 10);
                const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);
                const reasonEN    = note || null;
                const reasonTR    = note || null;

                const subject = `EDU Hotel – Reservation not approved #${reservation.id} / Rezervasyon reddedildi #${reservation.id}`;

                const bodyEN = `
<p style="margin:0 0 4px;">Dear <strong>${guestName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">We regret to inform you that your reservation request could not be approved at this time.</p>
${badge('Reservation Not Approved', 'red')}
${heading('Reservation Details')}
${detailTable([
    row('Reservation ID', `#${reservation.id}`),
    row('Check-in',       checkInStr),
    row('Check-out',      checkOutStr),
    row('Reason',         reasonEN),
])}
<p style="margin:0;font-size:13px;color:#475569;">You are welcome to submit a new reservation request or contact us at <a href="mailto:hotel@sabanciuniv.edu" style="color:#003366;">hotel@sabanciuniv.edu</a> if you have any questions.</p>`;

                const bodyTR = `
<p style="margin:0 0 4px;">Sayın <strong>${guestName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">Üzülerek bildiririz ki rezervasyon talebiniz bu aşamada onaylanamamıştır.</p>
${badge('Rezervasyon Onaylanmadı', 'red')}
${heading('Rezervasyon Bilgileri')}
${detailTable([
    row('Rezervasyon No', `#${reservation.id}`),
    row('Giriş',          checkInStr),
    row('Çıkış',          checkOutStr),
    row('Neden',          reasonTR),
])}
<p style="margin:0;font-size:13px;color:#475569;">Yeni bir rezervasyon talebi oluşturabilir veya sorularınız için <a href="mailto:hotel@sabanciuniv.edu" style="color:#003366;">hotel@sabanciuniv.edu</a> adresinden bizimle iletişime geçebilirsiniz.</p>`;

                const text = `EDU Hotel – Your reservation request #${reservation.id} was not approved.${reasonEN ? '\nReason: ' + reasonEN : ''}\nCheck-in: ${checkInStr} | Check-out: ${checkOutStr}\n\nPlease contact hotel@sabanciuniv.edu for more information.\n\n---\n\nEDU Hotel – #${reservation.id} numaralı rezervasyon talebiniz reddedildi.${reasonTR ? '\nNeden: ' + reasonTR : ''}\nSorularınız için hotel@sabanciuniv.edu ile iletişime geçin.`;

                const html = emailTemplate(bodyEN, bodyTR);
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
                const guestName   = updated.firstName || updated.user.name || "Guest";
                const checkInStr  = reservation.checkIn.toISOString().slice(0, 10);
                const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);

                const subject = `EDU Hotel – Reservation cancelled #${id} / Rezervasyon iptal edildi #${id}`;

                const bodyEN = `
<p style="margin:0 0 4px;">Dear <strong>${guestName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">Your cancellation request has been processed. Your reservation has been successfully cancelled.</p>
${badge('Reservation Cancelled', 'orange')}
${heading('Cancelled Reservation Details')}
${detailTable([
    row('Reservation ID', `#${id}`),
    row('Check-in',       checkInStr),
    row('Check-out',      checkOutStr),
    row('Reason',         reason || null),
])}
<p style="margin:0;font-size:13px;color:#475569;">If this was unintentional, you are welcome to submit a new reservation request. For assistance, contact us at <a href="mailto:hotel@sabanciuniv.edu" style="color:#003366;">hotel@sabanciuniv.edu</a>.</p>`;

                const bodyTR = `
<p style="margin:0 0 4px;">Sayın <strong>${guestName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">İptal talebiniz işleme alındı. Rezervasyonunuz başarıyla iptal edilmiştir.</p>
${badge('Rezervasyon İptal Edildi', 'orange')}
${heading('İptal Edilen Rezervasyon Bilgileri')}
${detailTable([
    row('Rezervasyon No', `#${id}`),
    row('Giriş',          checkInStr),
    row('Çıkış',          checkOutStr),
    row('Neden',          reason || null),
])}
<p style="margin:0;font-size:13px;color:#475569;">Bu bir hata ise yeni bir rezervasyon talebi oluşturabilirsiniz. Yardım için <a href="mailto:hotel@sabanciuniv.edu" style="color:#003366;">hotel@sabanciuniv.edu</a> adresinden bize ulaşabilirsiniz.</p>`;

                const text = `EDU Hotel – Your reservation #${id} has been cancelled.${reason ? '\nReason: ' + reason : ''}\nCheck-in: ${checkInStr} | Check-out: ${checkOutStr}\n\nIf this was unintentional, please submit a new reservation request.\n\n---\n\nEDU Hotel – #${id} numaralı rezervasyonunuz iptal edildi.${reason ? '\nNeden: ' + reason : ''}`;

                const html = emailTemplate(bodyEN, bodyTR);
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