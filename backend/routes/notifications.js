const express = require("express");
const { PrismaClient } = require("@prisma/client");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /notifications/user/:userId
 * Generate notifications from reservation activity.
 * Since we don't have a dedicated Notifications table,
 * we derive notifications from reservation data.
 */
router.get("/user/:userId", requireAuth, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) return res.status(400).json({ error: "Invalid userId." });
        if (req.user.userId !== userId) return res.status(403).json({ error: "Access denied." });

        const reservations = await prisma.reservation.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: { room: true },
            take: 20,
        });

        const notifications = [];
        const now = new Date();

        for (const r of reservations) {
            const checkInDate = new Date(r.checkIn);
            const checkOutDate = new Date(r.checkOut);
            const checkInStr = checkInDate.toISOString().slice(0, 10);
            const checkOutStr = checkOutDate.toISOString().slice(0, 10);

            // Reservation submitted
            notifications.push({
                id: `res-${r.id}-created`,
                type: "info",
                title: "Reservation Submitted",
                titleTR: "Rezervasyon Gönderildi",
                message: `Your reservation #${r.id} for ${checkInStr} → ${checkOutStr} has been submitted and is awaiting review.`,
                messageTR: `#${r.id} numaralı rezervasyonunuz (${checkInStr} → ${checkOutStr}) gönderildi ve inceleme bekliyor.`,
                timestamp: r.createdAt,
                reservationId: r.id,
                read: true,
            });

            // Approved
            if (r.status === "APPROVED") {
                notifications.push({
                    id: `res-${r.id}-approved`,
                    type: "success",
                    title: "Reservation Approved",
                    titleTR: "Rezervasyon Onaylandı",
                    message: `Your reservation #${r.id} has been approved.${r.room ? ` Room: ${r.room.name}` : ""} Please proceed with payment if applicable.`,
                    messageTR: `#${r.id} numaralı rezervasyonunuz onaylandı.${r.room ? ` Oda: ${r.room.name}` : ""} Gerekli ise ödeme işlemini gerçekleştirin.`,
                    timestamp: r.createdAt,
                    reservationId: r.id,
                    read: false,
                });
            }

            // Rejected
            if (r.status === "REJECTED") {
                notifications.push({
                    id: `res-${r.id}-rejected`,
                    type: "error",
                    title: "Reservation Rejected",
                    titleTR: "Rezervasyon Reddedildi",
                    message: `Your reservation #${r.id} has been rejected.${r.note ? ` Reason: ${r.note}` : ""}`,
                    messageTR: `#${r.id} numaralı rezervasyonunuz reddedildi.${r.note ? ` Neden: ${r.note}` : ""}`,
                    timestamp: r.createdAt,
                    reservationId: r.id,
                    read: false,
                });
            }

            // Cancelled
            if (r.status === "CANCELLED") {
                notifications.push({
                    id: `res-${r.id}-cancelled`,
                    type: "warning",
                    title: "Reservation Cancelled",
                    titleTR: "Rezervasyon İptal Edildi",
                    message: `Your reservation #${r.id} for ${checkInStr} → ${checkOutStr} has been cancelled.`,
                    messageTR: `#${r.id} numaralı rezervasyonunuz (${checkInStr} → ${checkOutStr}) iptal edildi.`,
                    timestamp: r.createdAt,
                    reservationId: r.id,
                    read: true,
                });
            }

            // Payment: receipt uploaded
            if (r.paymentStatus === "PENDING_VERIFICATION") {
                notifications.push({
                    id: `res-${r.id}-payment-pending`,
                    type: "info",
                    title: "Payment Receipt Uploaded",
                    titleTR: "Ödeme Dekontu Yüklendi",
                    message: `Your payment receipt for reservation #${r.id} has been uploaded and is awaiting verification.`,
                    messageTR: `#${r.id} numaralı rezervasyon için ödeme dekontunuz yüklendi ve doğrulama bekliyor.`,
                    timestamp: r.createdAt,
                    reservationId: r.id,
                    read: false,
                });
            }

            // Payment confirmed
            if (r.paymentStatus === "APPROVED") {
                notifications.push({
                    id: `res-${r.id}-payment-approved`,
                    type: "success",
                    title: "Payment Confirmed",
                    titleTR: "Ödeme Onaylandı",
                    message: `Your payment for reservation #${r.id} has been verified and confirmed. Your stay is fully confirmed.`,
                    messageTR: `#${r.id} numaralı rezervasyon için ödemeniz doğrulandı ve onaylandı. Konaklamanız kesinleşti.`,
                    timestamp: r.createdAt,
                    reservationId: r.id,
                    read: false,
                });
            }

            // Payment rejected
            if (r.paymentStatus === "REJECTED") {
                notifications.push({
                    id: `res-${r.id}-payment-rejected`,
                    type: "error",
                    title: "Payment Rejected",
                    titleTR: "Ödeme Reddedildi",
                    message: `Your payment for reservation #${r.id} has been rejected. Please upload a new receipt.`,
                    messageTR: `#${r.id} numaralı rezervasyon için ödemeniz reddedildi. Lütfen yeni bir dekont yükleyin.`,
                    timestamp: r.createdAt,
                    reservationId: r.id,
                    read: false,
                });
            }

            // Check-in reminder (within 48 hours)
            const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursUntilCheckIn > 0 && hoursUntilCheckIn <= 48 && r.status === "APPROVED") {
                notifications.push({
                    id: `res-${r.id}-checkin-reminder`,
                    type: "reminder",
                    title: "Check-in Reminder",
                    titleTR: "Giriş Hatırlatması",
                    message: `Your check-in for reservation #${r.id} is scheduled for ${checkInStr}${r.checkInTime ? ` at ${r.checkInTime}` : ""}.${r.room ? ` Room: ${r.room.name}` : ""}`,
                    messageTR: `#${r.id} numaralı rezervasyonunuz için giriş tarihi ${checkInStr}${r.checkInTime ? ` saat ${r.checkInTime}` : ""}.${r.room ? ` Oda: ${r.room.name}` : ""}`,
                    timestamp: now.toISOString(),
                    reservationId: r.id,
                    read: false,
                });
            }
        }

        // Sort by timestamp descending
        notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const unreadCount = notifications.filter(n => !n.read).length;

        return res.json({ notifications, unreadCount });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;
