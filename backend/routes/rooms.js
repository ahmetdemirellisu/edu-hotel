// backend/routes/rooms.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

/**
 * GET /rooms
 * List all rooms with basic info + status
 */
router.get('/', async (req, res) => {
    try {
        const rooms = await prisma.room.findMany({
            orderBy: { id: 'asc' },
        });
        return res.json(rooms);
    } catch (err) {
        console.error('Error fetching rooms:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
