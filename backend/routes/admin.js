const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { sendMail } = require("../services/mail");
const { emailTemplate, badge, row, detailTable, heading } = require("../services/mailTemplate");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const prisma = new PrismaClient();

// --- Dashboard Stats Route ---
router.get("/dashboard-stats", async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const [pendingCount, approvedCount] = await Promise.all([
            prisma.reservation.count({ where: { status: "PENDING" } }),
            prisma.reservation.count({ where: { status: "APPROVED" } }),
        ]);

        const currentStaysAgg = await prisma.reservation.aggregate({
            _sum: { guests: true },
            where: {
                status: "APPROVED",
                checkIn: { lte: startOfToday },
                checkOut: { gt: startOfToday },
            },
        });
        const guestsStaying = currentStaysAgg._sum.guests || 0;

        const todayCheckinsAgg = await prisma.reservation.aggregate({
            _sum: { guests: true },
            where: {
                status: "APPROVED",
                checkIn: { gte: startOfToday, lt: startOfTomorrow },
            },
        });
        const expectedCheckinsToday = todayCheckinsAgg._sum.guests || 0;

        const roomGroups = await prisma.room.groupBy({
            by: ["status"],
            _count: { status: true },
        });

        const occupiedRooms = roomGroups.find((g) => g.status === "OCCUPIED")?._count.status || 0;
        const availableRooms = roomGroups.find((g) => g.status === "AVAILABLE")?._count.status || 0;
        const maintenanceRooms = roomGroups.find((g) => g.status === "MAINTENANCE")?._count.status || 0;

        const totalRooms = occupiedRooms + availableRooms + maintenanceRooms;
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        res.json({
            pendingReservations: pendingCount,
            approvedReservations: approvedCount,
            guestsStaying,
            availableRooms,
            occupiedRooms,
            maintenanceRooms,
            totalRooms,
            occupancyRate,
            expectedCheckinsToday,
        });
    } catch (err) {
        console.error("Error in /admin/dashboard-stats:", err);
        res.status(500).json({ error: "Failed to load dashboard stats." });
    }
});

// --- Fetch Pending Payments ---
router.get("/pending-payments", async (req, res) => {
    try {
        const pending = await prisma.reservation.findMany({
            where: { paymentStatus: "PENDING_VERIFICATION" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(pending || []);
    } catch (err) {
        console.error("Error fetching pending payments:", err);
        res.status(500).json({ error: "Failed to fetch pending payments" });
    }
});

// --- Approve Payment & Move File ---
router.post("/approve-payment/:id", async (req, res) => {
    const { id } = req.params;

    const pendingDir = path.resolve(__dirname, "../../paymentRecieptsPending");
    const approvedDir = path.resolve(__dirname, "../../paymentRecieptsAprooved");

    const candidates = [
        `${id}_payment.pdf`,
        `${id}_payment.png`,
        `${id}_payment.jpg`,
        `${id}_payment.jpeg`,
    ];

    try {
        if (!fs.existsSync(approvedDir)) {
            fs.mkdirSync(approvedDir, { recursive: true });
        }

        let movedFilename = null;

        for (const fileName of candidates) {
            const oldPath = path.join(pendingDir, fileName);
            if (fs.existsSync(oldPath)) {
                const newPath = path.join(approvedDir, fileName);
                fs.renameSync(oldPath, newPath);
                movedFilename = fileName;
                break;
            }
        }

        if (!movedFilename) {
            return res.status(404).json({
                error: "Receipt file not found in pending folder.",
            });
        }

        const reservation = await prisma.reservation.update({
            where: { id: Number(id) },
            data: {
                paymentStatus: "APPROVED",
                status: "APPROVED",
            },
            include: { user: true, room: true },
        });

        // ✉️ EMAIL — Payment Approved
        try {
            if (reservation.user?.email) {
                const guestName   = reservation.firstName || reservation.user.name || "Guest";
                const checkInStr  = reservation.checkIn.toISOString().slice(0, 10);
                const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);
                const roomEN      = reservation.room ? reservation.room.name : null;
                const roomTR      = reservation.room ? reservation.room.name : null;

                const subject = `EDU Hotel – Booking confirmed ✓ #${reservation.id} / Rezervasyonunuz kesinleşti ✓ #${reservation.id}`;

                const bodyEN = `
<p style="margin:0 0 4px;">Dear <strong>${guestName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">Your payment has been verified. Your stay at EDU Hotel is now fully confirmed — we look forward to welcoming you!</p>
${badge('Booking Confirmed ✓', 'green')}
${heading('Your Stay')}
${detailTable([
    row('Reservation ID', `#${reservation.id}`),
    row('Check-in',       `${checkInStr}${reservation.checkInTime ? ' at ' + reservation.checkInTime : ''}`),
    row('Check-out',      checkOutStr),
    row('Guests',         reservation.guests),
    row('Room',           roomEN || 'To be communicated at check-in'),
])}
<p style="margin:0;font-size:13px;color:#475569;">Please present a valid ID upon arrival. If you have any questions before your stay, don't hesitate to reach us at <a href="mailto:hotel@sabanciuniv.edu" style="color:#003366;">hotel@sabanciuniv.edu</a>.</p>`;

                const bodyTR = `
<p style="margin:0 0 4px;">Sayın <strong>${guestName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">Ödemeniz doğrulandı. EDU Hotel'deki konaklamanız kesinleşmiştir — sizi ağırlamaktan mutluluk duyacağız!</p>
${badge('Rezervasyon Kesinleşti ✓', 'green')}
${heading('Konaklamanız')}
${detailTable([
    row('Rezervasyon No', `#${reservation.id}`),
    row('Giriş',          `${checkInStr}${reservation.checkInTime ? ', ' + reservation.checkInTime : ''}`),
    row('Çıkış',          checkOutStr),
    row('Misafir sayısı', reservation.guests),
    row('Oda',            roomTR || 'Giriş sırasında bildirilecektir'),
])}
<p style="margin:0;font-size:13px;color:#475569;">Lütfen giriş sırasında geçerli bir kimlik belgesi ibraz ediniz. Konaklamanız öncesinde herhangi bir sorunuz için <a href="mailto:hotel@sabanciuniv.edu" style="color:#003366;">hotel@sabanciuniv.edu</a> adresinden bize ulaşabilirsiniz.</p>`;

                const text = `EDU Hotel – Your booking #${reservation.id} is CONFIRMED.\nCheck-in: ${checkInStr}${reservation.checkInTime ? ' at ' + reservation.checkInTime : ''}\nCheck-out: ${checkOutStr}\nGuests: ${reservation.guests}\n${reservation.room ? 'Room: ' + reservation.room.name : 'Room: To be communicated at check-in'}\n\nWe look forward to welcoming you!\n\n---\n\nEDU Hotel – #${reservation.id} numaralı rezervasyonunuz KESİNLEŞTİ.\nSizi ağırlamaktan mutluluk duyacağız!`;

                const html = emailTemplate(bodyEN, bodyTR);
                await sendMail({ to: reservation.user.email, subject, text, html });
            }
        } catch (mailErr) {
            console.error("Failed to send payment approval email:", mailErr);
        }

        res.json({
            message: "Payment verified successfully!",
            filename: movedFilename,
        });
    } catch (err) {
        console.error("Approval error:", err);
        res.status(500).json({ error: "Server error during approval." });
    }
});

// --- Reject Payment ---
router.post("/reject-payment/:id", async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        const reservation = await prisma.reservation.update({
            where: { id: Number(id) },
            data: { paymentStatus: "REJECTED" },
            include: { user: true },
        });

        // ✉️ EMAIL — Payment Rejected
        try {
            if (reservation.user?.email) {
                const guestName   = reservation.firstName || reservation.user.name || "Guest";
                const checkInStr  = reservation.checkIn.toISOString().slice(0, 10);
                const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);

                const subject = `EDU Hotel – Payment receipt not accepted #${reservation.id} / Ödeme dekontu kabul edilmedi #${reservation.id}`;

                const bodyEN = `
<p style="margin:0 0 4px;">Dear <strong>${guestName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">Unfortunately, we were unable to verify your payment receipt for the reservation below. Please re-upload a clear, valid receipt to keep your reservation active.</p>
${badge('Receipt Not Accepted', 'red')}
${heading('Reservation Details')}
${detailTable([
    row('Reservation ID', `#${reservation.id}`),
    row('Check-in',       checkInStr),
    row('Check-out',      checkOutStr),
    row('Reason',         reason || 'The uploaded receipt could not be verified.'),
])}
${heading('What to do next')}
<p style="margin:0;font-size:13px;color:#475569;">Please log in to your EDU Hotel account and upload a new, clear payment receipt (PDF, JPG or PNG, max 5 MB). If you need assistance, contact us at <a href="mailto:hotel@sabanciuniv.edu" style="color:#003366;">hotel@sabanciuniv.edu</a>.</p>`;

                const bodyTR = `
<p style="margin:0 0 4px;">Sayın <strong>${guestName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">Maalesef aşağıdaki rezervasyon için yüklenen ödeme dekontunu doğrulayamadık. Rezervasyonunuzu aktif tutmak için lütfen net ve geçerli bir dekont yükleyin.</p>
${badge('Dekont Kabul Edilmedi', 'red')}
${heading('Rezervasyon Bilgileri')}
${detailTable([
    row('Rezervasyon No', `#${reservation.id}`),
    row('Giriş',          checkInStr),
    row('Çıkış',          checkOutStr),
    row('Neden',          reason || 'Yüklenen dekont doğrulanamamıştır.'),
])}
${heading('Yapmanız Gerekenler')}
<p style="margin:0;font-size:13px;color:#475569;">EDU Hotel hesabınıza giriş yaparak yeni, net bir ödeme dekontu yükleyin (PDF, JPG veya PNG, maks. 5 MB). Yardım için <a href="mailto:hotel@sabanciuniv.edu" style="color:#003366;">hotel@sabanciuniv.edu</a> adresinden bize ulaşabilirsiniz.</p>`;

                const text = `EDU Hotel – Your payment receipt for reservation #${reservation.id} was not accepted.\nReason: ${reason || 'The uploaded receipt could not be verified.'}\nCheck-in: ${checkInStr} | Check-out: ${checkOutStr}\n\nPlease log in and upload a new receipt.\n\n---\n\nEDU Hotel – #${reservation.id} numaralı rezervasyonunuz için ödeme dekontu kabul edilmedi.\nLütfen yeni bir dekont yükleyin.`;

                const html = emailTemplate(bodyEN, bodyTR);
                await sendMail({ to: reservation.user.email, subject, text, html });
            }
        } catch (mailErr) {
            console.error("Failed to send payment rejection email:", mailErr);
        }

        res.json({ message: "Payment rejected successfully!", data: reservation });
    } catch (err) {
        console.error("Rejection error:", err);
        res.status(500).json({ error: "Server error during rejection." });
    }
});

module.exports = router;