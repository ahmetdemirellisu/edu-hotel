// backend/routes/users.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const requireAdmin = require("../middleware/requireAdmin");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * --------------------------------------------------------------------------
 * GET /users/search
 * Search users by ID, email, or name. Supports filtering by role.
 *
 * Used by:
 *   - BlacklistPage modal autocomplete (requires query)
 *   - AdminUsersPage (browses by role with empty query)
 *
 * Examples:
 *   /users/search?query=john
 *   /users/search?role=ADMIN,HOTEL_STAFF                — no query, role filter only
 *   /users/search?query=jane&role=USER
 *
 * Empty queries with a role filter return all users matching the roles
 * (capped at 200 rows for safety). Empty queries with no role filter
 * still return [] to avoid accidentally returning all users.
 *
 * Includes createdAt so AdminUsersPage can show "Member since".
 * --------------------------------------------------------------------------
 */
router.get("/search", requireAdmin, async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();
    const roleParam = String(req.query.role || "").trim();
    const validRoles = ["USER", "ADMIN", "HOTEL_STAFF"];
    const roles = roleParam
      ? roleParam.split(",").map((r) => r.trim().toUpperCase()).filter((r) => validRoles.includes(r))
      : [];

    // Empty query AND no role filter → return [] (don't dump the whole user table).
    if ((!query || query.length < 2) && roles.length === 0) {
      return res.json([]);
    }

    const where = {};
    if (roles.length > 0) {
      where.role = { in: roles };
    }
    if (query && query.length >= 2) {
      const orConditions = [];
      const asNumber = Number(query);
      if (!isNaN(asNumber)) orConditions.push({ id: asNumber });
      orConditions.push(
        { email: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } }
      );
      where.OR = orConditions;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        role: true,
        createdAt: true,
      },
      orderBy: { id: "asc" },
      take: 200,
    });

    res.json(users);
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * --------------------------------------------------------------------------
 * GET /users/admin
 * Full Guest Management List for Admin Panel
 * Supports filters:
 *   /users/admin?type=STUDENT
 *   /users/admin?search=john
 *   /users/admin?blacklisted=true
 *
 * Returns:
 *   - user info
 *   - blacklist (if exists) as merged field
 *   - reservations[] for history
 * --------------------------------------------------------------------------
 */
router.get("/admin", requireAdmin, async (req, res) => {
  try {
    const { type, search, blacklisted } = req.query;

    const where = {};

    // Filter: userType (STUDENT / STAFF / SPECIAL_GUEST / OTHER)
    if (type) {
      where.userType = type;
    }

    // Filter: search by name or email
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ];
    }

    // 1) Fetch users with reservations
    let users = await prisma.user.findMany({
      where,
      include: {
        reservations: {
          orderBy: { checkIn: "desc" },
        },
      },
      orderBy: { id: "asc" },
    });

    // 2) Fetch blacklist entries for these users
    const userIds = users.map((u) => u.id);
    const blacklistEntries =
        userIds.length === 0
            ? []
            : await prisma.blacklist.findMany({
              where: { userId: { in: userIds } },
            });

    const blacklistByUserId = new Map();
    for (const entry of blacklistEntries) {
      blacklistByUserId.set(entry.userId, entry);
    }

    // 3) Merge blacklist info into user objects
    let mergedUsers = users.map((u) => ({
      ...u,
      blacklist: blacklistByUserId.get(u.id) || null,
    }));

    // 4) Apply blacklisted=true/false filter (in memory)
    if (blacklisted === "true") {
      mergedUsers = mergedUsers.filter((u) => u.blacklist !== null);
    } else if (blacklisted === "false") {
      mergedUsers = mergedUsers.filter((u) => u.blacklist === null);
    }

    res.json(mergedUsers);
  } catch (err) {
    console.error("Admin guest list error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * --------------------------------------------------------------------------
 * GET /users/:id
 * Fetch one user with reservations + blacklist info
 * --------------------------------------------------------------------------
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: "Access denied." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        reservations: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Fetch blacklist entry (if any)
    const blacklist = await prisma.blacklist.findUnique({
      where: { userId },
    });

    res.json({ ...user, blacklist: blacklist || null });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * --------------------------------------------------------------------------
 * PATCH /users/admin/:id/max-stay
 * Admin sets maxStayOverride for a user (null to reset to default 30 days)
 * --------------------------------------------------------------------------
 */
router.patch("/admin/:id/max-stay", requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID." });

    const { maxStayOverride } = req.body;
    if (maxStayOverride !== null && (typeof maxStayOverride !== "number" || maxStayOverride < 1)) {
      return res.status(400).json({ error: "maxStayOverride must be a positive number or null." });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { maxStayOverride: maxStayOverride || null },
      select: { id: true, maxStayOverride: true },
    });

    res.json(user);
  } catch (err) {
    console.error("Set max stay override error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
