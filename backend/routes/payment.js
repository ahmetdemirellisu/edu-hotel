const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { sendMail } = require("../services/mail");

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
          const checkInStr = reservation.checkIn.toISOString().slice(0, 10);
          const checkOutStr = reservation.checkOut.toISOString().slice(0, 10);
          const guestName = reservation.firstName || reservation.user.name || "Guest";

          const subject = "EDU Hotel – Payment receipt received / Ödeme dekontu alındı";

          const text = `
Dear ${guestName},

Your payment receipt for reservation #${reservation.id} has been uploaded successfully and is now awaiting verification by our administration team.

Reservation Details:
Check-in:  ${checkInStr}
Check-out: ${checkOutStr}

You will be notified once the payment is verified.

---

Sayın ${guestName},

#${reservation.id} numaralı rezervasyonunuz için ödeme dekontunuz başarıyla yüklenmiştir ve yönetim ekibimiz tarafından doğrulama beklemektedir.

Rezervasyon Bilgileri:
Giriş:  ${checkInStr}
Çıkış:  ${checkOutStr}

Ödeme doğrulandığında size bildirim gönderilecektir.

EDU Hotel
`;

          const html = `
<p>Dear <strong>${guestName}</strong>,</p>
<p>Your payment receipt for reservation <strong>#${reservation.id}</strong> has been uploaded successfully and is now <strong>awaiting verification</strong>.</p>
<p>
<strong>Check-in:</strong> ${checkInStr}<br/>
<strong>Check-out:</strong> ${checkOutStr}
</p>
<p>You will be notified once the payment is verified.</p>

<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;" />

<p>Sayın <strong>${guestName}</strong>,</p>
<p><strong>#${reservation.id}</strong> numaralı rezervasyonunuz için ödeme dekontunuz başarıyla yüklenmiştir ve <strong>doğrulama beklemektedir</strong>.</p>
<p>
<strong>Giriş:</strong> ${checkInStr}<br/>
<strong>Çıkış:</strong> ${checkOutStr}
</p>
<p>Ödeme doğrulandığında size bildirim gönderilecektir.</p>

<p style="color: #888; font-size: 12px; margin-top: 24px;">EDU Hotel – Sabancı Üniversitesi</p>
`;

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