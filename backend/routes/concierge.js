// backend/routes/concierge.js
// Handles guest-submitted requests from the EduConcierge drawer.
// Currently supports two request types:
//   "issue"         — maintenance / facility report
//   "late-checkout" — late-checkout request
// Both result in an email to the reception team (EMAIL_USER).

const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const prisma = require("../prismaClient");
const { sendMailAsync } = require("../services/mail");
const { emailTemplate, badge, heading, detailTable, row } = require("../services/mailTemplate");

const ALLOWED_TYPES = new Set(["issue", "late-checkout"]);

router.post("/contact", requireAuth, async (req, res) => {
  try {
    const { type, subject, message, requestedTime } = req.body || {};

    if (!ALLOWED_TYPES.has(type)) {
      return res.status(400).json({ error: "Invalid request type." });
    }
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }
    const safeSubject = typeof subject === "string" && subject.trim() ? subject.trim() : null;
    const safeRequestedTime = typeof requestedTime === "string" && requestedTime.trim() ? requestedTime.trim() : null;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, firstName: true, lastName: true, phone: true },
    });
    if (!user) return res.status(404).json({ error: "User not found." });

    const guestName =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.name ||
      user.email;

    const isLateCheckout = type === "late-checkout";
    const headerEN = isLateCheckout ? "Late check-out request" : "Maintenance / issue report";
    const headerTR = isLateCheckout ? "Geç çıkış talebi" : "Bakım / sorun bildirimi";
    const badgeColor = isLateCheckout ? "orange" : "blue";

    const subjectLine = `EDU Hotel – ${headerEN}${safeSubject ? `: ${safeSubject}` : ""} (#${user.id})`;

    const bodyEN = `
<p style="margin:0 0 4px;">A new guest request has been submitted via the EduConcierge.</p>
${badge(headerEN, badgeColor)}
${heading("Guest")}
${detailTable([
  row("Name", guestName),
  row("Email", user.email),
  row("Phone", user.phone || null),
])}
${heading("Request")}
${detailTable([
  row("Type", headerEN),
  row("Subject", safeSubject),
  row("Requested time", safeRequestedTime),
])}
<p style="margin:14px 0 4px;font-size:12.5px;color:#475569;"><strong>Message:</strong></p>
<p style="margin:0;font-size:13px;color:#0f172a;white-space:pre-wrap;background:#f8fafc;padding:12px 14px;border-radius:8px;border-left:3px solid #c9a84c;">${
  message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")
}</p>`;

    const bodyTR = `
<p style="margin:0 0 4px;">EduConcierge üzerinden yeni bir misafir talebi gönderildi.</p>
${badge(headerTR, badgeColor)}
${heading("Misafir")}
${detailTable([
  row("Ad", guestName),
  row("E-posta", user.email),
  row("Telefon", user.phone || null),
])}
${heading("Talep")}
${detailTable([
  row("Tür", headerTR),
  row("Konu", safeSubject),
  row("Talep edilen saat", safeRequestedTime),
])}
<p style="margin:14px 0 4px;font-size:12.5px;color:#475569;"><strong>Mesaj:</strong></p>
<p style="margin:0;font-size:13px;color:#0f172a;white-space:pre-wrap;background:#f8fafc;padding:12px 14px;border-radius:8px;border-left:3px solid #c9a84c;">${
  message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")
}</p>`;

    const text = [
      `${headerEN} via EduConcierge`,
      ``,
      `Guest:  ${guestName}`,
      `Email:  ${user.email}`,
      user.phone ? `Phone:  ${user.phone}` : null,
      safeSubject ? `Subject: ${safeSubject}` : null,
      safeRequestedTime ? `Requested time: ${safeRequestedTime}` : null,
      ``,
      `Message:`,
      message.trim(),
    ]
      .filter((l) => l !== null)
      .join("\n");

    const html = emailTemplate(bodyEN, bodyTR);

    // Send to the reception inbox (same address used by all transactional emails).
    const receptionEmail = process.env.EMAIL_USER;
    if (receptionEmail) {
      sendMailAsync({ to: receptionEmail, subject: subjectLine, text, html });
    } else {
      console.warn("EMAIL_USER not set — concierge request not emailed:", subjectLine);
    }

    return res.json({ message: "Request received. Reception will follow up shortly." });
  } catch (err) {
    console.error("Concierge contact error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
