// backend/routes/admin.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /admin/dashboard-stats
 *
 * Returns:
 *  - pendingReservations
 *  - approvedReservations
 *  - guestsStaying        (sum of guests currently staying)
 *  - availableRooms
 *  - occupiedRooms
 *  - maintenanceRooms
 *  - totalRooms
 *  - occupancyRate        (0–100)
 *  - expectedCheckinsToday (guests arriving today)
 */
router.get("/dashboard-stats", async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const startOfTomorrow = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        );

        // 1) Reservation counts
        const [pendingCount, approvedCount] = await Promise.all([
            prisma.reservation.count({ where: { status: "PENDING" } }),
            prisma.reservation.count({ where: { status: "APPROVED" } }),
        ]);

        // 2) Guests currently staying (approved & today between check-in / check-out)
        const currentStaysAgg = await prisma.reservation.aggregate({
            _sum: { guests: true },
            where: {
                status: "APPROVED",
                checkIn: { lte: startOfToday },
                checkOut: { gt: startOfToday },
            },
        });
        const guestsStaying = currentStaysAgg._sum.guests || 0;

        // 3) Expected check-ins today (approved & checkIn is today)
        const todayCheckinsAgg = await prisma.reservation.aggregate({
            _sum: { guests: true },
            where: {
                status: "APPROVED",
                checkIn: {
                    gte: startOfToday,
                    lt: startOfTomorrow,
                },
            },
        });
        const expectedCheckinsToday = todayCheckinsAgg._sum.guests || 0;

        // 4) Room status counts
        const roomGroups = await prisma.room.groupBy({
            by: ["status"],
            _count: { status: true },
        });

        const occupiedRooms =
            roomGroups.find((g) => g.status === "OCCUPIED")?._count.status || 0;
        const availableRooms =
            roomGroups.find((g) => g.status === "AVAILABLE")?._count.status || 0;
        const maintenanceRooms =
            roomGroups.find((g) => g.status === "MAINTENANCE")?._count.status || 0;

        const totalRooms = occupiedRooms + availableRooms + maintenanceRooms;
        const occupancyRate =
            totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        return res.json({
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
        return res.status(500).json({ error: "Failed to load dashboard stats." });
    }
});

module.exports = router;
