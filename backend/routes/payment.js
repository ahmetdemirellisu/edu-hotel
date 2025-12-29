const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Import Prisma Client
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Corrected path: goes up two levels from "backend/routes" to reach the root folders
const pendingDir = path.join(__dirname, '../../paymentRecieptsPending');

// Ensure folder exists
if (!fs.existsSync(pendingDir)) {
    fs.mkdirSync(pendingDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pendingDir);
    },
    filename: (req, file, cb) => {
        const { reservationId } = req.params;
        // Forces naming convention: <id>_payment.pdf
        cb(null, `${reservationId}_payment.pdf`);
    }
});

const upload = multer({ storage: storage });

// POST route for uploading the receipt
router.post('/upload-dekont/:reservationId', upload.single('dekont'), async (req, res) => {
    const { reservationId } = req.params;

    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // 2. Update DB using Prisma
        // We update 'paymentStatus' to 'PENDING_VERIFICATION' as defined in your new schema
        await prisma.reservation.update({
            where: { 
                id: parseInt(reservationId) 
            },
            data: { 
                paymentStatus: 'PENDING_VERIFICATION' 
            }
        });

        res.json({ 
            message: "File uploaded successfully and awaiting admin verification.",
            file: req.file.filename 
        });
    } catch (err) {
        console.error("Prisma Upload Error:", err);
        res.status(500).json({ error: "Database update failed during upload" });
    }
});

module.exports = router;