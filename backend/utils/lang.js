// backend/utils/lang.js
// Request-language helpers for user-facing API messages.
// The frontend sends `X-Lang: tr|en` on every request; missing/invalid → 'tr'.
const { normalizeLang, pick } = require("../services/mailTemplate");

/** Returns 'tr' | 'en' for the request (from the X-Lang header, default 'tr'). */
function reqLang(req) {
  return normalizeLang(req && req.headers ? req.headers["x-lang"] : undefined);
}

/** Returns the English or Turkish string depending on the request language. */
function msg(req, en, tr) {
  return pick(reqLang(req), en, tr);
}

/** Turkish/English labels for reservation statuses (used in user-facing messages). */
const STATUS_LABELS = {
  PENDING: { en: "PENDING", tr: "Beklemede" },
  APPROVED: { en: "APPROVED", tr: "Onaylandı" },
  REJECTED: { en: "REJECTED", tr: "Reddedildi" },
  CANCELLED: { en: "CANCELLED", tr: "İptal edildi" },
  REFUND_REQUESTED: { en: "REFUND_REQUESTED", tr: "İade talep edildi" },
  REFUNDED: { en: "REFUNDED", tr: "İade edildi" },
};

function statusLabel(req, status) {
  const entry = STATUS_LABELS[status];
  if (!entry) return status;
  return entry[reqLang(req)];
}

module.exports = { reqLang, msg, statusLabel, STATUS_LABELS };
