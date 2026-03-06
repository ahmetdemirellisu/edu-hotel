// backend/routes/rooms.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = express.Router();

/**
 * GET /rooms
 * List all rooms with basic info + status
 */
router.get("/", async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { id: "asc" },
    });
    return res.json(rooms);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * GET /rooms/availability?date=YYYY-MM-DD
 * Returns all rooms with their status for a specific date.
 * Cross-references reservations to determine if a room is occupied on that date.
 * 
 * Response: Array of { id, name, type, price, capacity, status, baseStatus, reservation? }
 *   - baseStatus: the room's permanent status (AVAILABLE, MAINTENANCE, RESERVED)
 *   - status: computed status for the given date (may become OCCUPIED if a reservation covers that date)
 *   - reservation: the reservation occupying this room on that date (if any)
 */
router.get("/availability", async (req, res) => {
  try {
    const { date } = req.query;

    // Default to today if no date provided
    const targetDate = date ? new Date(date + "T12:00:00Z") : new Date();

    // We need the start and end of the target date for overlap check
    const dayStart = new Date(targetDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    // Get all rooms
    const rooms = await prisma.room.findMany({
      orderBy: { id: "asc" },
    });

    // Get all APPROVED reservations that overlap with this date
    // A reservation overlaps if: checkIn <= targetDate AND checkOut > targetDate
    const reservations = await prisma.reservation.findMany({
      where: {
        status: "APPROVED",
        roomId: { not: null },
        checkIn: { lte: dayEnd },
        checkOut: { gt: dayStart },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    // Build a map of roomId -> reservation for this date
    const roomReservationMap = new Map();
    for (const r of reservations) {
      if (r.roomId) {
        roomReservationMap.set(r.roomId, {
          id: r.id,
          guestName: `${r.firstName || ""} ${r.lastName || ""}`.trim() || r.user?.name || "Guest",
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          guests: r.guests,
          paymentStatus: r.paymentStatus,
        });
      }
    }

    // Build response
    const result = rooms.map((room) => {
      const reservation = roomReservationMap.get(room.id) || null;
      let computedStatus = room.status; // base status

      // If room has a reservation on this date, it's OCCUPIED
      if (reservation && room.status !== "MAINTENANCE" && room.status !== "RESERVED") {
        computedStatus = "OCCUPIED";
      }

      // MAINTENANCE and RESERVED override everything
      if (room.status === "MAINTENANCE") computedStatus = "MAINTENANCE";
      if (room.status === "RESERVED") computedStatus = "RESERVED";

      return {
        id: room.id,
        name: room.name,
        type: room.type,
        price: room.price,
        capacity: room.capacity,
        amenities: room.amenities,
        baseStatus: room.status,
        status: computedStatus,
        reservation,
      };
    });

    // Counts
    const counts = {
      available: result.filter((r) => r.status === "AVAILABLE").length,
      occupied: result.filter((r) => r.status === "OCCUPIED").length,
      maintenance: result.filter((r) => r.status === "MAINTENANCE").length,
      reserved: result.filter((r) => r.status === "RESERVED").length,
      total: result.length,
    };

    return res.json({ rooms: result, counts, date: dayStart.toISOString().slice(0, 10) });
  } catch (err) {
    console.error("Error fetching room availability:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * PATCH /rooms/:id/status
 * Update room base status (admin action)
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    const validStatuses = ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "RESERVED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const room = await prisma.room.update({
      where: { id },
      data: { status },
    });

    return res.json(room);
  } catch (err) {
    console.error("Error updating room status:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;