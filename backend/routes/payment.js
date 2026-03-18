const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { sendMail } = require("../services/mail");
const { emailTemplate, badge, row, detailTable, heading } = require("../services/mailTemplate");

const prisma = new PrismaClient();

// Path to pending receipts folder
const pendingDir = path.join(__dirname, "../../paymentRecieptsPending");

// Ensure folder exists
if (!fs.existsSync(pendingDir)) {
  fs.mkdirSync(pendingDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pendingDir);
  },
  filename: (req, file, cb) => {
    const { reservationId } = req.params;
    const extMap = {
      "application/pdf": ".pdf",
      "image/jpeg": ".jpg",
      "image/png": ".png",
    };
    const ext = extMap[file.mimetype];
    cb(null, `${reservationId}_payment${ext}`);
  },
});

// Multer upload middleware
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF, JPG/JPEG, PNG files are allowed"));
    }
    cb(null, true);
  },
});

// Upload receipt endpoint
router.post(
  "/upload-dekont/:reservationId",
  upload.single("dekont"),
  async (req, res) => {
    const { reservationId } = req.params;
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const reservation = await prisma.reservation.update({
        where: { id: parseInt(reservationId) },
        data: { paymentStatus: "PENDING_VERIFICATION" },
        include: { user: true },
      });

      // ✉️ EMAIL — Payment Receipt Uploaded
      try {
        if (reservation.user?.email) {
          const checkInStr  = reservation.checkIn.toISOString().slice(0, 10);
          const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);
          const guestName   = reservation.firstName || reservation.user.name || "Guest";

          const subject = `EDU Hotel – Payment receipt received #${reservation.id} / Ödeme dekontu alındı #${reservation.id}`;

          const bodyEN = `
<p style="margin:0 0 4px;">Dear <strong>${guestName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">We have received your payment receipt and it is now awaiting verification by our administration team. You will be notified by email once it is reviewed.</p>
${badge('Awaiting Verification', 'orange')}
${heading('Reservation Details')}
${detailTable([
    row('Reservation ID', `#${reservation.id}`),
    row('Check-in',       checkInStr),
    row('Check-out',      checkOutStr),
])}
<p style="margin:0;font-size:13px;color:#475569;">Verification is typically completed within 1 business day. If you have any questions, contact us at <a href="mailto:hotel@sabanciuniv.edu" style="color:#003366;">hotel@sabanciuniv.edu</a>.</p>`;

          const bodyTR = `
<p style="margin:0 0 4px;">Sayın <strong>${guestName}</strong>,</p>
<p style="margin:0 0 20px;color:#475569;">Ödeme dekontunuz alınmış olup yönetim ekibimiz tarafından incelenmektedir. İnceleme tamamlandığında e-posta ile bilgilendirileceksiniz.</p>
${badge('Doğrulama Bekleniyor', 'orange')}
${heading('Rezervasyon Bilgileri')}
${detailTable([
    row('Rezervasyon No', `#${reservation.id}`),
    row('Giriş',          checkInStr),
    row('Çıkış',          checkOutStr),
])}
<p style="margin:0;font-size:13px;color:#475569;">Doğrulama genellikle 1 iş günü içinde tamamlanır. Sorularınız için <a href="mailto:hotel@sabanciuniv.edu" style="color:#003366;">hotel@sabanciuniv.edu</a> adresinden bize ulaşabilirsiniz.</p>`;

          const text = `EDU Hotel – Payment receipt for reservation #${reservation.id} received and awaiting verification.\nCheck-in: ${checkInStr} | Check-out: ${checkOutStr}\n\nYou will be notified once it is verified.\n\n---\n\nEDU Hotel – #${reservation.id} numaralı rezervasyonunuz için ödeme dekontunuz alındı ve doğrulama bekleniyor.`;

          const html = emailTemplate(bodyEN, bodyTR);
          await sendMail({ to: reservation.user.email, subject, text, html });
        }
      } catch (mailErr) {
        console.error("Failed to send receipt upload email:", mailErr);
      }

      res.json({
        message: "File uploaded successfully and awaiting admin verification.",
        filename: req.file.filename,
      });
    } catch (err) {
      console.error("Receipt upload error:", err);
      res.status(400).json({ error: err.message || "Upload failed" });
    }
  }
);

module.exports = router;