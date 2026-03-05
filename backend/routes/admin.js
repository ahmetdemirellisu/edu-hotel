const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { sendMail } = require("../services/mail");
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
                const guestName = reservation.firstName || reservation.user.name || "Guest";
                const checkInStr = reservation.checkIn.toISOString().slice(0, 10);
                const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);
                const roomInfo = reservation.room
                    ? `Room: ${reservation.room.name}`
                    : "Room will be communicated at check-in.";
                const roomInfoTR = reservation.room
                    ? `Oda: ${reservation.room.name}`
                    : "Oda bilgisi giriş sırasında iletilecektir.";

                const subject = "EDU Hotel – Payment confirmed / Ödeme onaylandı";

                const text = `
Dear ${guestName},

Your payment for reservation #${reservation.id} has been verified and confirmed.

Your reservation is now fully confirmed. Here are the details:

Check-in:  ${checkInStr} ${reservation.checkInTime || ""}
Check-out: ${checkOutStr}
Guests:    ${reservation.guests}
${roomInfo}

We look forward to welcoming you to EDU Hotel.

---

Sayın ${guestName},

#${reservation.id} numaralı rezervasyonunuz için ödemeniz doğrulanmış ve onaylanmıştır.

Rezervasyonunuz artık kesinleşmiştir. Detaylar:

Giriş:     ${checkInStr} ${reservation.checkInTime || ""}
Çıkış:     ${checkOutStr}
Misafir:   ${reservation.guests}
${roomInfoTR}

EDU Hotel'de sizi ağırlamayı dört gözle bekliyoruz.

EDU Hotel
`;

                const html = `
<p>Dear <strong>${guestName}</strong>,</p>
<p>Your payment for reservation <strong>#${reservation.id}</strong> has been <strong style="color: green;">verified and confirmed</strong>.</p>
<p>Your reservation is now <strong>fully confirmed</strong>.</p>
<p>
<strong>Check-in:</strong> ${checkInStr} ${reservation.checkInTime || ""}<br/>
<strong>Check-out:</strong> ${checkOutStr}<br/>
<strong>Guests:</strong> ${reservation.guests}<br/>
${roomInfo}
</p>
<p>We look forward to welcoming you to EDU Hotel.</p>

<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;" />

<p>Sayın <strong>${guestName}</strong>,</p>
<p><strong>#${reservation.id}</strong> numaralı rezervasyonunuz için ödemeniz <strong style="color: green;">doğrulanmış ve onaylanmıştır</strong>.</p>
<p>Rezervasyonunuz artık <strong>kesinleşmiştir</strong>.</p>
<p>
<strong>Giriş:</strong> ${checkInStr} ${reservation.checkInTime || ""}<br/>
<strong>Çıkış:</strong> ${checkOutStr}<br/>
<strong>Misafir:</strong> ${reservation.guests}<br/>
${roomInfoTR}
</p>
<p>EDU Hotel'de sizi ağırlamayı dört gözle bekliyoruz.</p>

<p style="color: #888; font-size: 12px; margin-top: 24px;">EDU Hotel – Sabancı Üniversitesi</p>
`;

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
                const guestName = reservation.firstName || reservation.user.name || "Guest";
                const checkInStr = reservation.checkIn.toISOString().slice(0, 10);
                const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);

                const reasonEN = reason
                    ? `Reason: ${reason}`
                    : "The uploaded receipt could not be verified.";
                const reasonTR = reason
                    ? `Neden: ${reason}`
                    : "Yüklenen dekont doğrulanamamıştır.";

                const subject = "EDU Hotel – Payment rejected / Ödeme reddedildi";

                const text = `
Dear ${guestName},

Unfortunately, your payment for reservation #${reservation.id} has been rejected.

${reasonEN}

Reservation Details:
Check-in:  ${checkInStr}
Check-out: ${checkOutStr}

Please upload a new payment receipt or contact the hotel administration for assistance.

---

Sayın ${guestName},

Maalesef, #${reservation.id} numaralı rezervasyonunuz için ödemeniz reddedilmiştir.

${reasonTR}

Rezervasyon Bilgileri:
Giriş:  ${checkInStr}
Çıkış:  ${checkOutStr}

Lütfen yeni bir ödeme dekontu yükleyin veya yardım için otel yönetimiyle iletişime geçin.

EDU Hotel
`;

                const html = `
<p>Dear <strong>${guestName}</strong>,</p>
<p>Your payment for reservation <strong>#${reservation.id}</strong> has been <strong style="color: red;">rejected</strong>.</p>
<p>${reasonEN}</p>
<p>
<strong>Check-in:</strong> ${checkInStr}<br/>
<strong>Check-out:</strong> ${checkOutStr}
</p>
<p>Please upload a new payment receipt or contact the hotel administration.</p>

<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;" />

<p>Sayın <strong>${guestName}</strong>,</p>
<p><strong>#${reservation.id}</strong> numaralı rezervasyonunuz için ödemeniz <strong style="color: red;">reddedilmiştir</strong>.</p>
<p>${reasonTR}</p>
<p>
<strong>Giriş:</strong> ${checkInStr}<br/>
<strong>Çıkış:</strong> ${checkOutStr}
</p>
<p>Lütfen yeni bir ödeme dekontu yükleyin veya otel yönetimiyle iletişime geçin.</p>

<p style="color: #888; font-size: 12px; margin-top: 24px;">EDU Hotel – Sabancı Üniversitesi</p>
`;

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