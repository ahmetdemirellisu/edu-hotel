const express = require("express");
const prisma = require("../prismaClient");
const router = express.Router();

/**
 * GET /blacklist
 * Returns all blacklisted users
 */
router.get("/", async (req, res) => {
    try {
        const list = await prisma.blacklist.findMany({
            include: { user: true },
            orderBy: { addedAt: "desc" },
        });

        return res.json(list);
    } catch (err) {
        console.error("Error fetching blacklist:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * POST /blacklist/add
 * Body: { userId, reason, expiresAt }
 */
router.post("/add", async (req, res) => {
    try {
        const { userId, reason, expiresAt } = req.body;

        if (!userId || !reason)
            return res.status(400).json({ error: "userId and reason are required." });

        // Prevent multiple entries
        const existing = await prisma.blacklist.findUnique({
            where: { userId },
        });

        if (existing) {
            return res.status(400).json({ error: "User is already blacklisted." });
        }

        const entry = await prisma.blacklist.create({
            data: {
                userId,
                reason,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
            include: { user: true },
        });

        return res.status(201).json(entry);
    } catch (err) {
        console.error("Error adding to blacklist:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * DELETE /blacklist/remove/:userId
 */
router.delete("/remove/:userId", async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        await prisma.blacklist.delete({
            where: { userId },
        });

        return res.json({ message: "User removed from blacklist." });
    } catch (err) {
        console.error("Error removing from blacklist:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;