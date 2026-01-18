const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { PrismaClient } = require("@prisma/client");
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

    // Map MIME types to extensions
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
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

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

      await prisma.reservation.update({
        where: { id: parseInt(reservationId) },
        data: {
          paymentStatus: "PENDING_VERIFICATION",
        },
      });

      res.json({
        message: "File uploaded successfully and awaiting admin verification.",
        filename: req.file.filename,
      });
    } catch (err) {
      console.error("Receipt upload error:", err);
      res.status(400).json({
        error: err.message || "Upload failed",
      });
    }
  }
);

module.exports = router;
