const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { sendMail } = require('../services/mail');

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

/**
 * POST /reservations
 */
router.post('/', checkBlacklist, async (req, res) => {
    try {
        const {
            userId: rawUserId,
            checkIn,
            checkOut,
            guests,
            accommodationType,
            invoiceType,
            eventCode,
            note,
        } = req.body;

        const userId = parseInt(rawUserId, 10);

        if (!userId || !checkIn || !checkOut || !guests || !accommodationType || !invoiceType) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(400).json({ error: `User not found for id ${userId}. Please log in again.` });
        }

        const checkInDate = parseDate(checkIn);
        const checkOutDate = parseDate(checkOut);

        if (!checkInDate || !checkOutDate) return res.status(400).json({ error: 'Invalid date format.' });
        if (checkOutDate <= checkInDate) return res.status(400).json({ error: 'Check-out must be after check-in.' });
        if (guests <= 0) return res.status(400).json({ error: 'Guests must be at least 1.' });

        const stayLength = diffInDays(checkInDate, checkOutDate);
        if (stayLength > 5) {
            return res.status(400).json({ error: 'Maximum stay is 5 nights for a single reservation.' });
        }

        // Rule: 30 days in advance
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        if (checkInDate > maxDate) {
            return res.status(400).json({ error: 'Reservations can only be made up to 30 days in advance.' });
        }

        if (checkInDate.getDay() === 0) {
            return res.status(400).json({ error: 'Sunday check-in is not allowed.' });
        }

        if (checkInDate.getDay() === 6 && checkOutDate.getDay() === 0) {
            return res.status(400).json({ error: 'Saturday check-in & Sunday check-out combination is not allowed.' });
        }

        const reservation = await prisma.reservation.create({
            data: {
                userId,
                checkIn: checkInDate,
                checkOut: checkOutDate,
                guests,
                accommodationType,
                invoiceType,
                eventCode: eventCode || null,
                note: note || null,

                guestType: user.userType || 'OTHER',
            },
        });

        // ✉️ EMAIL — Reservation Request Received
        try {
            if (user.email) {
                const subject = 'EDU Hotel – Reservation request received';
                const checkInStr = checkInDate.toISOString().slice(0, 10);
                const checkOutStr = checkOutDate.toISOString().slice(0, 10);

                const text = `
Dear ${user.name || 'Guest'},

We have received your reservation request for EDU Hotel.

Check-in:  ${checkInStr}
Check-out: ${checkOutStr}
Guests:    ${guests}

Our administration will review your request. You will be notified by email once it is approved or rejected.

Best regards,
EDU Hotel Team

------------------------------------------
TÜRKÇE METİN
------------------------------------------

Sayın ${user.name || 'Misafir'},

EDU Hotel için rezervasyon talebiniz alınmıştır.

Giriş Tarihi: ${checkInStr}
Çıkış Tarihi: ${checkOutStr}
Kişi Sayısı:  ${guests}

Talebiniz kısa süre içinde yönetim tarafından değerlendirilecektir. Onay veya red durumunda size e-posta ile bilgilendirme yapılacaktır.

Saygılarımızla,
EDU Hotel Ekibi
`;

                const html = `
<p>Dear <strong>${user.name || 'Guest'}</strong>,</p>
<p>Your reservation request has been received.</p>
<p>
<strong>Check-in:</strong> ${checkInStr}<br/>
<strong>Check-out:</strong> ${checkOutStr}<br/>
<strong>Guests:</strong> ${guests}
</p>
<p>You will be notified once it is reviewed by the administration.</p>

<hr/>

<p><strong>Sayın ${user.name || 'Misafir'},</strong></p>
<p>Rezervasyon talebiniz alınmıştır.</p>
<p>
<strong>Giriş Tarihi:</strong> ${checkInStr}<br/>
<strong>Çıkış Tarihi:</strong> ${checkOutStr}<br/>
<strong>Kişi Sayısı:</strong> ${guests}
</p>
<p>Talebiniz yönetim tarafından değerlendirildikten sonra bilgilendirileceksiniz.</p>
`;

                await sendMail({ to: user.email, subject, text, html });
            }
        } catch (mailErr) {
            console.error('Failed to send request email:', mailErr);
        }

        return res.status(201).json(reservation);

    } catch (err) {
        console.error('Error creating reservation:', err);
        if (err.code === 'P2003') {
            return res.status(400).json({
                error: 'Reservation cannot be created because the user does not exist.',
            });
        }
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * GET /reservations/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) return res.status(400).json({ error: 'Invalid userId.' });

        const reservations = await prisma.reservation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { room: true },
        });

        return res.json(reservations);
    } catch (err) {
        console.error('Error fetching user reservations:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * GET /reservations/admin
 */
router.get('/admin', async (req, res) => {
    try {
        const { status, guestType } = req.query;

        const where = {};

        if (status) {
            where.status = status;
        }
        if (guestType) {
            where.guestType = guestType; // must be one of STUDENT/STAFF/SPECIAL_GUEST/OTHER
        }

        const reservations = await prisma.reservation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { user: true, room: true },
        });

        return res.json(reservations);
    } catch (err) {
        console.error('Error fetching admin reservations:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * PATCH /reservations/admin/:id/approve
 */
router.patch('/admin/:id/approve', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { roomId } = req.body;

        const data = { status: 'APPROVED' };
        if (roomId) data.roomId = roomId;

        const reservation = await prisma.reservation.update({
            where: { id },
            data,
            include: { user: true, room: true },
        });

        // ✉️ EMAIL — Reservation Approved (English + Turkish)
        try {
            if (reservation.user.email) {
                const subject = 'EDU Hotel – Reservation approved';

                const checkInStr = reservation.checkIn.toISOString().slice(0, 10);
                const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);

                const roomInfo =
                    reservation.room
                        ? `Room: ${reservation.room.name || reservation.room.id}`
                        : 'Room will be assigned later.';

                const text = `
Dear ${reservation.user.name || 'Guest'},

Your reservation request has been APPROVED.

Check-in:  ${checkInStr}
Check-out: ${checkOutStr}
Guests:    ${reservation.guests}
${roomInfo}

We look forward to welcoming you to EDU Hotel.

------------------------------------------
TÜRKÇE METİN
------------------------------------------

Sayın ${reservation.user.name || 'Misafir'},

Rezervasyon talebiniz ONAYLANMIŞTIR.

Giriş Tarihi: ${checkInStr}
Çıkış Tarihi: ${checkOutStr}
Kişi Sayısı:  ${reservation.guests}
${roomInfo}

EDU Hotel olarak sizi ağırlamaktan memnuniyet duyarız.
`;

                const html = `
<p>Dear <strong>${reservation.user.name || 'Guest'}</strong>,</p>
<p>Your reservation request has been <strong style="color:green">APPROVED</strong>.</p>

<p>
<strong>Check-in:</strong> ${checkInStr}<br/>
<strong>Check-out:</strong> ${checkOutStr}<br/>
<strong>Guests:</strong> ${reservation.guests}<br/>
${roomInfo}
</p>

<p>We look forward to welcoming you.</p>

<hr/>

<p><strong>Sayın ${reservation.user.name || 'Misafir'},</strong></p>
<p>Rezervasyon talebiniz <strong style="color:green">ONAYLANMIŞTIR</strong>.</p>

<p>
<strong>Giriş Tarihi:</strong> ${checkInStr}<br/>
<strong>Çıkış Tarihi:</strong> ${checkOutStr}<br/>
<strong>Kişi Sayısı:</strong> ${reservation.guests}<br/>
${roomInfo}
</p>

<p>EDU Hotel olarak sizi ağırlamaktan memnuniyet duyarız.</p>
`;

                await sendMail({ to: reservation.user.email, subject, text, html });
            }
        } catch (mailErr) {
            console.error('Failed to send approval email:', mailErr);
        }

        return res.json(reservation);

    } catch (err) {
        console.error('Error approving reservation:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * PATCH /reservations/admin/:id/reject
 */
router.patch('/admin/:id/reject', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { note } = req.body;

        const reservation = await prisma.reservation.update({
            where: { id },
            data: { status: 'REJECTED', note: note || null },
            include: { user: true, room: true },
        });

        // ✉️ EMAIL — Reservation Rejected (EN + TR)
        try {
            if (reservation.user.email) {
                const subject = 'EDU Hotel – Reservation request rejected';

                const reasonEN = note ? `Reason: ${note}` : 'Your reservation request could not be approved.';
                const reasonTR = note ? `Sebep: ${note}` : 'Rezervasyon talebiniz onaylanamamıştır.';

                const text = `
Dear ${reservation.user.name || 'Guest'},

Unfortunately, your reservation request could not be approved.
${reasonEN}

If you have any questions, please contact the hotel administration.

------------------------------------------
TÜRKÇE METİN
------------------------------------------

Sayın ${reservation.user.name || 'Misafir'},

Ne yazık ki rezervasyon talebiniz onaylanmamıştır.
${reasonTR}

Herhangi bir sorunuz varsa lütfen otel yönetimi ile iletişime geçiniz.
`;

                const html = `
<p>Dear <strong>${reservation.user.name || 'Guest'}</strong>,</p>
<p>Your reservation request has been <strong style="color:red">rejected</strong>.</p>
<p>${reasonEN}</p>

<hr/>

<p><strong>Sayın ${reservation.user.name || 'Misafir'},</strong></p>
<p>Rezervasyon talebiniz <strong style="color:red">reddedilmiştir</strong>.</p>
<p>${reasonTR}</p>
`;

                await sendMail({ to: reservation.user.email, subject, text, html });
            }
        } catch (mailErr) {
            console.error('Failed to send rejection email:', mailErr);
        }

        return res.json(reservation);

    } catch (err) {
        console.error('Error rejecting reservation:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
