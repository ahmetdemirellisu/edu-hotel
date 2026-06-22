// backend/services/settings.js
//
// Source of truth for all admin-configurable hotel settings.
// Backed by the single-row Settings table (id = 1).
//
// Design:
//   - getSettings() returns a cached snapshot (1-minute TTL).
//   - invalidate() clears the cache; called by the admin PUT route after save.
//   - refresh() forces a re-read.
// All backend code should call getSettings() instead of reading process.env or
// hardcoding hotel constants.

const prisma = require("../prismaClient");

let cache = null;
let cacheExpiresAt = 0;
const TTL_MS = 60_000; // 1 minute

const DEFAULTS = {
  hotelName: "EDU Hotel",
  contactEmail: "hotel@sabanciuniv.edu",
  contactPhone: "+90 (216) 483 9000",
  maxAdvanceDays: 30,
  maxStayNights: 5,
  autoApprove: false,
  emailNotifications: true,
  bankName: "Akbank T.A.Ş.",
  accountHolder: "Sabtek A.Ş.",
  iban: "TR85 0004 6007 1388 8000 1139 89",
  checkInTime: "14:00",
  checkOutTime: "12:00",
  wifiSsid: "EDU-Hotel-Guest",
  wifiPassword: "Welcome2026",
  breakfastHours: "07:30 – 10:00",
  receptionHours: "24/7",
};

// Editable keys — used by validation in the PUT route.
const EDITABLE_KEYS = Object.keys(DEFAULTS);

// Keys safe to expose on the public (non-admin) GET endpoint. Anything else
// (e.g. autoApprove, emailNotifications) stays admin-only.
const PUBLIC_KEYS = [
  "hotelName",
  "contactEmail",
  "contactPhone",
  "bankName",
  "accountHolder",
  "iban",
  "checkInTime",
  "checkOutTime",
  "wifiSsid",
  "wifiPassword",
  "breakfastHours",
  "receptionHours",
];

async function loadFromDb() {
  let row = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!row) {
    // Auto-seed the singleton row on first read.
    row = await prisma.settings.create({ data: { id: 1 } });
  }
  return row;
}

async function getSettings() {
  if (cache && Date.now() < cacheExpiresAt) return cache;
  try {
    const row = await loadFromDb();
    cache = row;
    cacheExpiresAt = Date.now() + TTL_MS;
    return row;
  } catch (err) {
    console.error("settings: failed to load, using defaults:", err.message);
    return { id: 1, ...DEFAULTS, updatedAt: new Date() };
  }
}

function invalidate() {
  cache = null;
  cacheExpiresAt = 0;
}

async function refresh() {
  invalidate();
  return getSettings();
}

// Public projection — only safe fields.
function toPublic(row) {
  const out = {};
  for (const k of PUBLIC_KEYS) out[k] = row[k];
  return out;
}

// Validates and saves a partial settings update. Only known keys are accepted.
// Returns the new full row. Caller is responsible for auth.
async function updateSettings(input) {
  const data = {};
  for (const k of EDITABLE_KEYS) {
    if (!(k in input)) continue;
    const v = input[k];
    if (typeof DEFAULTS[k] === "boolean") {
      if (typeof v !== "boolean") throw new Error(`${k} must be a boolean.`);
      data[k] = v;
    } else if (typeof DEFAULTS[k] === "number") {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > 100_000) {
        throw new Error(`${k} must be a non-negative number.`);
      }
      data[k] = Math.floor(n);
    } else {
      // string — coerce, trim, length-cap
      const s = String(v ?? "").trim();
      if (s.length > 500) throw new Error(`${k} is too long (max 500 chars).`);
      data[k] = s;
    }
  }

  if (Object.keys(data).length === 0) {
    throw new Error("No editable fields provided.");
  }

  const updated = await prisma.settings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  invalidate();
  return updated;
}

module.exports = {
  getSettings,
  invalidate,
  refresh,
  updateSettings,
  toPublic,
  DEFAULTS,
  EDITABLE_KEYS,
  PUBLIC_KEYS,
};
