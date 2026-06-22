const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { sendMailAsync } = require("../services/mail");
const { emailTemplate, badge, row, detailTable, heading } = require("../services/mailTemplate");
const settingsService = require("../services/settings");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const prisma = new PrismaClient();
const requireAdmin = require("../middleware/requireAdmin");

// Apply admin auth to every route in this file
router.use(requireAdmin);

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

// --- Pending Room Assignment (payment approved, no room yet) ---
router.get("/pending-assignments", async (req, res) => {
    try {
        const pending = await prisma.reservation.findMany({
            where: {
                paymentStatus: "APPROVED",
                roomId: null,
                status: "APPROVED",
            },
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
        console.error("Error fetching pending assignments:", err);
        res.status(500).json({ error: "Failed to fetch pending assignments" });
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
                // copy + delete instead of rename — works across mounted volumes
                fs.copyFileSync(oldPath, newPath);
                fs.unlinkSync(oldPath);
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

                const hasGuestNote = typeof reservation.note === "string" && reservation.note.trim().length > 0;
                const hasAdminNote = typeof reservation.adminNote === "string" && reservation.adminNote.trim().length > 0;

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
    row('Your note',      hasGuestNote ? reservation.note : null),
    row('Admin note',     hasAdminNote ? reservation.adminNote : null),
])}
${heading('Key Pickup Instructions')}
<p style="margin:0 0 16px;font-size:13px;color:#475569;">For check-ins before 16:30, you may collect your room key card from the reception area against signature. For check-ins after 16:30, the room key card will be left in a sealed envelope at the main security gate.</p>
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
    row('Notunuz',        hasGuestNote ? reservation.note : null),
    row('Yönetici notu',  hasAdminNote ? reservation.adminNote : null),
])}
${heading('Oda Kartı Teslim Bilgileri')}
<p style="margin:0 0 16px;font-size:13px;color:#475569;">16:30'a kadar olan girişlerinizde oda giriş kartınızı imza karşılığı resepsiyon alanından alabilirsiniz. 16:30 sonrası girişlerinizde oda kartı kapalı bir zarfla ana güvenlik kapısına bırakılacaktır.</p>
<p style="margin:0;font-size:13px;color:#475569;">Lütfen giriş sırasında geçerli bir kimlik belgesi ibraz ediniz. Konaklamanız öncesinde herhangi bir sorunuz için <a href="mailto:hotel@sabanciuniv.edu" style="color:#003366;">hotel@sabanciuniv.edu</a> adresinden bize ulaşabilirsiniz.</p>`;

                const text = [
                    `Dear ${guestName},`,
                    ``,
                    `Your payment has been verified. Your stay at EDU Hotel is now fully confirmed!`,
                    ``,
                    `Reservation #${reservation.id}`,
                    `Check-in:  ${checkInStr}${reservation.checkInTime ? ' at ' + reservation.checkInTime : ''}`,
                    `Check-out: ${checkOutStr}`,
                    `Guests:    ${reservation.guests}`,
                    `Room:      ${reservation.room ? reservation.room.name : 'To be communicated at check-in'}`,
                    hasGuestNote ? `Your note:  ${reservation.note}`      : null,
                    hasAdminNote ? `Admin note: ${reservation.adminNote}` : null,
                    ``,
                    `Key pickup: For check-ins before 16:30, you may collect your room key card from the reception area against signature. For check-ins after 16:30, the room key card will be left in a sealed envelope at the main security gate.`,
                    ``,
                    `Please present a valid ID upon arrival. We look forward to welcoming you!`,
                    ``,
                    `---`,
                    ``,
                    `Sayın ${guestName},`,
                    ``,
                    `Ödemeniz doğrulandı. EDU Hotel'deki konaklamanız kesinleşmiştir!`,
                    ``,
                    `Rezervasyon No: #${reservation.id}`,
                    `Giriş:          ${checkInStr}${reservation.checkInTime ? ', ' + reservation.checkInTime : ''}`,
                    `Çıkış:          ${checkOutStr}`,
                    `Misafir sayısı: ${reservation.guests}`,
                    `Oda:            ${reservation.room ? reservation.room.name : 'Giriş sırasında bildirilecektir'}`,
                    hasGuestNote ? `Notunuz:        ${reservation.note}`      : null,
                    hasAdminNote ? `Yönetici notu:  ${reservation.adminNote}` : null,
                    ``,
                    `Oda kartı teslimi: 16:30'a kadar olan girişlerinizde oda giriş kartınızı imza karşılığı resepsiyon alanından alabilirsiniz. 16:30 sonrası girişlerinizde oda kartı kapalı bir zarfla ana güvenlik kapısına bırakılacaktır.`,
                    ``,
                    `Lütfen giriş sırasında geçerli bir kimlik belgesi ibraz ediniz. Sizi ağırlamaktan mutluluk duyacağız!`,
                ].filter(l => l !== null).join('\n');

                const html = emailTemplate(bodyEN, bodyTR);
                sendMailAsync({ to: reservation.user.email, subject, text, html });
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

                const text = [
                    `Dear ${guestName},`,
                    ``,
                    `Unfortunately, your payment receipt for reservation #${reservation.id} could not be verified.`,
                    ``,
                    `Check-in:  ${checkInStr}`,
                    `Check-out: ${checkOutStr}`,
                    `Reason:    ${reason || 'The uploaded receipt could not be verified.'}`,
                    ``,
                    `Please log in to your EDU Hotel account and upload a new, clear receipt (PDF, JPG or PNG, max 5 MB).`,
                    `For assistance: hotel@sabanciuniv.edu`,
                    ``,
                    `---`,
                    ``,
                    `Sayın ${guestName},`,
                    ``,
                    `Maalesef #${reservation.id} numaralı rezervasyonunuz için ödeme dekontunuz doğrulanamadı.`,
                    ``,
                    `Giriş:  ${checkInStr}`,
                    `Çıkış:  ${checkOutStr}`,
                    `Neden:  ${reason || 'Yüklenen dekont doğrulanamamıştır.'}`,
                    ``,
                    `EDU Hotel hesabınıza giriş yaparak yeni, net bir dekont yükleyin (PDF, JPG veya PNG, maks. 5 MB).`,
                    `Yardım için: hotel@sabanciuniv.edu`,
                ].join('\n');

                const html = emailTemplate(bodyEN, bodyTR);
                sendMailAsync({ to: reservation.user.email, subject, text, html });
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

// ─────────────────────────────────────────────────────────────────────────
// Settings: GET returns the full settings row (all fields incl. internal
// toggles). PUT accepts a partial body of editable fields and persists.
// After a successful PUT, the settings cache is invalidated so the new
// values take effect immediately across the running process.
// ─────────────────────────────────────────────────────────────────────────

router.get("/settings", async (req, res) => {
    try {
        const s = await settingsService.getSettings();
        // Strip Prisma's internal fields; return everything admin can edit.
        const { id, updatedAt, ...editable } = s;
        return res.json({ ...editable, updatedAt });
    } catch (err) {
        console.error("admin/settings GET error:", err);
        return res.status(500).json({ error: "Failed to load settings." });
    }
});

router.put("/settings", async (req, res) => {
    try {
        const updated = await settingsService.updateSettings(req.body || {});
        const { id, updatedAt, ...editable } = updated;
        return res.json({ ...editable, updatedAt });
    } catch (err) {
        // Validation errors thrown by the service surface as 400.
        const isClient = /must be|too long|No editable/.test(err.message || "");
        if (isClient) return res.status(400).json({ error: err.message });
        console.error("admin/settings PUT error:", err);
        return res.status(500).json({ error: "Failed to save settings." });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// Reports: CSV exports of reservation / occupancy / revenue data
// GET /admin/reports/:type?from=YYYY-MM-DD&to=YYYY-MM-DD
//   :type — one of "daily" | "monthly" | "occupancy" | "revenue"
//   from/to default to today (daily), this month (monthly), and last 30 days
//   (occupancy/revenue) when omitted.
// Returns a downloadable CSV stream. Excel-friendly UTF-8 BOM prepended.
// ─────────────────────────────────────────────────────────────────────────

const REPORT_TYPES = new Set(["daily", "monthly", "occupancy", "revenue"]);

// Escape one CSV cell — handles commas, quotes, newlines per RFC 4180.
function csvCell(value) {
    if (value === null || value === undefined) return "";
    const s = String(value);
    if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

function csvRow(cells) {
    return cells.map(csvCell).join(",") + "\r\n";
}

function parseDateOr(value, fallback) {
    if (!value) return fallback;
    const d = new Date(String(value));
    return isNaN(d.getTime()) ? fallback : d;
}

function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function isoDate(d) {
    if (!d) return "";
    const dd = d instanceof Date ? d : new Date(d);
    if (isNaN(dd.getTime())) return "";
    return dd.toISOString().slice(0, 10);
}

function nightsBetween(checkIn, checkOut, rangeStart, rangeEnd) {
    // Count nights of the reservation that fall within [rangeStart, rangeEnd].
    const start = checkIn > rangeStart ? checkIn : rangeStart;
    const end = checkOut < rangeEnd ? checkOut : rangeEnd;
    const ms = end.getTime() - start.getTime();
    if (ms <= 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

router.get("/reports/:type", async (req, res) => {
    try {
        const type = req.params.type;
        if (!REPORT_TYPES.has(type)) {
            return res.status(400).json({ error: "Unknown report type." });
        }

        const today = new Date();
        const defaultFrom = type === "daily"
            ? startOfDay(today)
            : type === "monthly"
                ? new Date(today.getFullYear(), today.getMonth(), 1)
                : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const defaultTo = type === "monthly"
            ? new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
            : endOfDay(today);

        const from = startOfDay(parseDateOr(req.query.from, defaultFrom));
        const to = endOfDay(parseDateOr(req.query.to, defaultTo));
        if (from > to) {
            return res.status(400).json({ error: "Invalid date range: 'from' is after 'to'." });
        }

        // Excel-friendly UTF-8 BOM so Turkish characters display correctly.
        const BOM = "﻿";
        let csv = BOM;
        let filename;

        if (type === "daily") {
            filename = `daily-report-${isoDate(from)}.csv`;
            csv += csvRow(["Daily Reservation Report"]);
            csv += csvRow(["Date", isoDate(from)]);
            csv += csvRow([]);

            const [checkIns, checkOuts, stayingNow] = await Promise.all([
                prisma.reservation.findMany({
                    where: { status: "APPROVED", checkIn: { gte: from, lte: to } },
                    include: { user: { select: { name: true, email: true } }, room: { select: { name: true } } },
                    orderBy: { checkIn: "asc" },
                }),
                prisma.reservation.findMany({
                    where: { status: "APPROVED", checkOut: { gte: from, lte: to } },
                    include: { user: { select: { name: true, email: true } }, room: { select: { name: true } } },
                    orderBy: { checkOut: "asc" },
                }),
                prisma.reservation.findMany({
                    where: {
                        status: "APPROVED",
                        checkIn: { lte: from },
                        checkOut: { gt: from },
                    },
                    include: { user: { select: { name: true, email: true } }, room: { select: { name: true } } },
                }),
            ]);

            csv += csvRow(["Section: Check-ins today"]);
            csv += csvRow(["Reservation ID", "Guest", "Email", "Room", "Guests", "Check-in", "Check-out", "Status"]);
            for (const r of checkIns) {
                csv += csvRow([r.id, r.user?.name || "", r.user?.email || "", r.room?.name || "—", r.guests, isoDate(r.checkIn), isoDate(r.checkOut), r.status]);
            }
            csv += csvRow([]);

            csv += csvRow(["Section: Check-outs today"]);
            csv += csvRow(["Reservation ID", "Guest", "Email", "Room", "Guests", "Check-in", "Check-out", "Status"]);
            for (const r of checkOuts) {
                csv += csvRow([r.id, r.user?.name || "", r.user?.email || "", r.room?.name || "—", r.guests, isoDate(r.checkIn), isoDate(r.checkOut), r.status]);
            }
            csv += csvRow([]);

            csv += csvRow(["Section: Currently staying"]);
            csv += csvRow(["Reservation ID", "Guest", "Email", "Room", "Guests", "Check-in", "Check-out"]);
            for (const r of stayingNow) {
                csv += csvRow([r.id, r.user?.name || "", r.user?.email || "", r.room?.name || "—", r.guests, isoDate(r.checkIn), isoDate(r.checkOut)]);
            }
            csv += csvRow([]);

            const totalGuests = stayingNow.reduce((sum, r) => sum + (r.guests || 0), 0);
            csv += csvRow(["Summary"]);
            csv += csvRow(["Check-ins today", checkIns.length]);
            csv += csvRow(["Check-outs today", checkOuts.length]);
            csv += csvRow(["Guests staying", totalGuests]);
        }

        else if (type === "monthly") {
            filename = `monthly-report-${isoDate(from)}_${isoDate(to)}.csv`;
            csv += csvRow(["Monthly Reservation Report"]);
            csv += csvRow(["From", isoDate(from), "To", isoDate(to)]);
            csv += csvRow([]);

            const reservations = await prisma.reservation.findMany({
                where: { checkIn: { gte: from, lte: to } },
                include: { user: { select: { name: true, email: true, userType: true } }, room: { select: { name: true } } },
                orderBy: { checkIn: "asc" },
            });

            csv += csvRow([
                "Reservation ID", "Guest", "Email", "Guest Type", "Room",
                "Guests", "Check-in", "Check-out", "Nights",
                "Status", "Payment Status", "Price (TL)", "Free Accommodation", "Created",
            ]);
            for (const r of reservations) {
                const nights = nightsBetween(new Date(r.checkIn), new Date(r.checkOut), new Date(r.checkIn), new Date(r.checkOut));
                csv += csvRow([
                    r.id, r.user?.name || "", r.user?.email || "", r.user?.userType || "", r.room?.name || "—",
                    r.guests, isoDate(r.checkIn), isoDate(r.checkOut), nights,
                    r.status, r.paymentStatus, r.price ?? "", r.freeAccommodation ? "yes" : "no", isoDate(r.createdAt),
                ]);
            }
            csv += csvRow([]);

            const byStatus = {};
            for (const r of reservations) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
            csv += csvRow(["Summary by Status"]);
            csv += csvRow(["Status", "Count"]);
            for (const s of Object.keys(byStatus).sort()) csv += csvRow([s, byStatus[s]]);
            csv += csvRow([]);
            csv += csvRow(["Total reservations", reservations.length]);
        }

        else if (type === "occupancy") {
            filename = `occupancy-report-${isoDate(from)}_${isoDate(to)}.csv`;
            csv += csvRow(["Room Occupancy Report"]);
            csv += csvRow(["From", isoDate(from), "To", isoDate(to)]);
            csv += csvRow([]);

            const totalNights = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
            const [rooms, reservations] = await Promise.all([
                prisma.room.findMany({ orderBy: { id: "asc" } }),
                prisma.reservation.findMany({
                    where: {
                        status: "APPROVED",
                        OR: [
                            { AND: [{ checkIn: { gte: from } }, { checkIn: { lte: to } }] },
                            { AND: [{ checkOut: { gte: from } }, { checkOut: { lte: to } }] },
                            { AND: [{ checkIn: { lte: from } }, { checkOut: { gte: to } }] },
                        ],
                    },
                    include: { room: { select: { id: true, name: true } } },
                }),
            ]);

            // Aggregate nights per primary room and per room in roomIds[].
            const nightsByRoom = new Map();
            for (const r of reservations) {
                const n = nightsBetween(new Date(r.checkIn), new Date(r.checkOut), from, to);
                if (r.roomId) nightsByRoom.set(r.roomId, (nightsByRoom.get(r.roomId) || 0) + n);
                if (Array.isArray(r.roomIds)) {
                    for (const rid of r.roomIds) {
                        const idNum = Number(rid);
                        if (!isNaN(idNum)) nightsByRoom.set(idNum, (nightsByRoom.get(idNum) || 0) + n);
                    }
                }
            }

            csv += csvRow(["Room ID", "Room Name", "Type", "Capacity", "Status", "Nights Occupied", "Total Nights in Range", "Occupancy %"]);
            let occupiedSum = 0;
            for (const room of rooms) {
                const occupied = nightsByRoom.get(room.id) || 0;
                occupiedSum += occupied;
                const pct = totalNights > 0 ? ((occupied / totalNights) * 100).toFixed(1) : "0.0";
                csv += csvRow([room.id, room.name, room.type, room.capacity, room.status, occupied, totalNights, pct]);
            }
            csv += csvRow([]);
            const overallPct = rooms.length > 0
                ? ((occupiedSum / (rooms.length * totalNights)) * 100).toFixed(1)
                : "0.0";
            csv += csvRow(["Summary"]);
            csv += csvRow(["Total rooms", rooms.length]);
            csv += csvRow(["Nights in range", totalNights]);
            csv += csvRow(["Total room-nights occupied", occupiedSum]);
            csv += csvRow(["Overall occupancy %", overallPct]);
        }

        else if (type === "revenue") {
            filename = `revenue-report-${isoDate(from)}_${isoDate(to)}.csv`;
            csv += csvRow(["Revenue Report"]);
            csv += csvRow(["From", isoDate(from), "To", isoDate(to)]);
            csv += csvRow([]);

            // Only count reservations created in window OR with check-in in window.
            const reservations = await prisma.reservation.findMany({
                where: {
                    OR: [
                        { createdAt: { gte: from, lte: to } },
                        { checkIn: { gte: from, lte: to } },
                    ],
                },
                include: { user: { select: { name: true, email: true } } },
                orderBy: { createdAt: "asc" },
            });

            csv += csvRow(["Reservation ID", "Guest", "Email", "Check-in", "Check-out", "Status", "Payment Status", "Price (TL)", "Free Accommodation"]);
            let grossRevenue = 0;
            let confirmedRevenue = 0;
            let pendingRevenue = 0;
            const byPaymentStatus = {};
            for (const r of reservations) {
                const price = Number(r.price || 0);
                grossRevenue += price;
                byPaymentStatus[r.paymentStatus] = (byPaymentStatus[r.paymentStatus] || 0) + price;
                if (r.paymentStatus === "APPROVED") confirmedRevenue += price;
                if (r.paymentStatus === "PENDING_VERIFICATION") pendingRevenue += price;
                csv += csvRow([
                    r.id, r.user?.name || "", r.user?.email || "",
                    isoDate(r.checkIn), isoDate(r.checkOut),
                    r.status, r.paymentStatus, price.toFixed(2),
                    r.freeAccommodation ? "yes" : "no",
                ]);
            }
            csv += csvRow([]);
            csv += csvRow(["Summary by Payment Status"]);
            csv += csvRow(["Payment Status", "Revenue (TL)"]);
            for (const k of Object.keys(byPaymentStatus).sort()) {
                csv += csvRow([k, byPaymentStatus[k].toFixed(2)]);
            }
            csv += csvRow([]);
            csv += csvRow(["Total reservations", reservations.length]);
            csv += csvRow(["Gross revenue (TL)", grossRevenue.toFixed(2)]);
            csv += csvRow(["Confirmed revenue (TL)", confirmedRevenue.toFixed(2)]);
            csv += csvRow(["Pending verification (TL)", pendingRevenue.toFixed(2)]);
        }

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (err) {
        console.error("Report generation error:", err);
        res.status(500).json({ error: "Failed to generate report." });
    }
});

module.exports = router;