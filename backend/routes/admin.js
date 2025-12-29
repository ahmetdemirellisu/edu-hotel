const express = require("express");
const { PrismaClient } = require("@prisma/client");
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
// FIXED: Changed 'username' to 'name' based on your Prisma Schema error
router.get("/pending-payments", async (req, res) => {
    try {
        const pending = await prisma.reservation.findMany({
            where: { 
                paymentStatus: 'PENDING_VERIFICATION' 
            },
            include: { 
                user: {
                    select: {
                        id: true,
                        name: true,      // CHANGED THIS FROM username TO name
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(pending || []);
    } catch (err) {
        console.error("Error fetching pending payments:", err);
        res.status(500).json({ error: "Failed to fetch pending payments" });
    }
});

// --- Approve Payment & Move File ---
router.post('/approve-payment/:id', async (req, res) => {
    const { id } = req.params;
    
    const pendingDir = path.resolve(__dirname, '../../paymentRecieptsPending');
    const approvedDir = path.resolve(__dirname, '../../paymentRecieptsAprooved');
    const fileName = `${id}_payment.pdf`;

    const oldPath = path.join(pendingDir, fileName);
    const newPath = path.join(approvedDir, fileName);

    try {
        if (!fs.existsSync(approvedDir)) {
            fs.mkdirSync(approvedDir, { recursive: true });
        }

        if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
        }

        await prisma.reservation.update({
            where: { id: Number(id) },
            data: { 
                paymentStatus: 'APPROVED',
                status: 'APPROVED' 
            }
        });

        res.json({ message: "Payment verified successfully!" });
    } catch (err) {
        console.error("Approval error:", err);
        res.status(500).json({ error: "Server error during approval." });
    }
});

// --- Reject Payment ---
router.post('/reject-payment/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await prisma.reservation.update({
            where: { id: Number(id) },
            data: { 
                paymentStatus: 'REJECTED' 
            }
        });
        res.json({ message: "Payment rejected successfully!", data: updated });
    } catch (err) {
        console.error("Rejection error:", err);
        res.status(500).json({ error: "Server error during rejection." });
    }
});

module.exports = router;