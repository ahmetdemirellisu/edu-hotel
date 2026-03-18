
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

const router = express.Router();

// POST /auth/register
// POST /auth/register
router.post("/register", async (req, res) => {
    try {
        // 🆕 also read userType from body (optional)
        const { email, password, name, userType: rawUserType } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email and password are required." });
        }

        // check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res
                .status(409)
                .json({ error: "User with this email already exists." });
        }

        const hashed = await bcrypt.hash(password, 10);

        // 🆕 validate / normalize userType
        const allowedUserTypes = ["STUDENT", "STAFF", "SPECIAL_GUEST", "OTHER"];
        const finalUserType = allowedUserTypes.includes(rawUserType)
            ? rawUserType
            : "OTHER"; // default for now

        const user = await prisma.user.create({
            data: {
                email,
                password: hashed,
                name: name || null,
                userType: finalUserType, // 🆕 this matches your Prisma enum
                // role: "USER", // if you already added role
            },
        });

        // don't send password back
        res.status(201).json({
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            userType: user.userType, // 🆕 include in response
            // role: user.role,
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// POST /auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const blacklisted = await prisma.blacklist.findUnique({
            where: { userId: user.id }
        });

        if (blacklisted) {
            return res.status(401).json({
                error: "Your account is blacklisted. You cannot log in. Please contact EDU Hotel."
            });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                userType: user.userType,
                role: user.role
            },
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// POST /auth/admin-login
router.post("/admin-login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required." });
        }

        const adminUser = process.env.ADMIN_USER;
        const adminPass = process.env.ADMIN_PASS;

        if (!adminUser || !adminPass) {
            console.error("ADMIN_USER or ADMIN_PASS env vars are not set.");
            return res.status(500).json({ error: "Admin authentication is not configured." });
        }

        if (username !== adminUser || password !== adminPass) {
            return res.status(401).json({ error: "Invalid admin credentials." });
        }

        const token = jwt.sign(
            { role: "admin", username },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.json({ token });
    } catch (err) {
        console.error("Admin login error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;
