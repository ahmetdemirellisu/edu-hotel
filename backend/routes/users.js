// routes/users.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

// GET /users (unchanged, still useful)
router.get("/", async function (req, res) {
  try {
    const users = await prisma.user.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /users/search?query=...
 * Search by:
 *  - ID  (exact)
 *  - e-mail (contains, case-insensitive)
 *  - name (contains, case-insensitive)
 */
router.get("/search", async function (req, res) {
  try {
    const raw = req.query.query;
    const query = typeof raw === "string" ? raw.trim() : "";

    if (!query) return res.json([]);

    const asNumber = parseInt(query, 10);
    const isNumeric = !isNaN(asNumber);

    const orConditions = [
      {
        email: { contains: query, mode: "insensitive" },
      },
      {
        name: { contains: query, mode: "insensitive" },
      },
    ];

    if (isNumeric) {
      orConditions.push({ id: asNumber });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: orConditions,
      },
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        role: true,
      },
    });

    res.json(users);
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
