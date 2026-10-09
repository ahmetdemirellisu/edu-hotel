
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const prisma = require("../prismaClient");
const { sendMailAsync } = require("../services/mail");
const { emailTemplate, pick, badge, heading } = require("../services/mailTemplate");
const { validateEmail, validatePassword } = require("../utils/sanitize");
const { msg, reqLang } = require("../utils/lang");

const router = express.Router();

// Resolve the frontend base URL used in transactional links.
// CLIENT_URL = origin (e.g. https://student-projects.sabanciuniv.edu)
// CLIENT_BASE_PATH = subpath prefix (e.g. /ehp) — empty for root deployments.
function clientUrl() {
    const base = (process.env.CLIENT_URL || "http://localhost:8004").replace(/\/$/, "");
    const path = (process.env.CLIENT_BASE_PATH || "").replace(/\/$/, "");
    return base + path;
}

function sha256(str) {
    return crypto.createHash("sha256").update(str).digest("hex");
}

// 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: (req) => ({ error: msg(req, "Too many attempts. Please try again in 15 minutes.", "Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.") }),
});

// Stricter limiter for forgot-password: 5 requests / 15 min / IP.
// Prevents email-enumeration spam without blocking legitimate users.
const forgotLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: (req) => ({ error: msg(req, "Too many password reset requests. Please try again in 15 minutes.", "Çok fazla şifre sıfırlama talebi gönderildi. Lütfen 15 dakika sonra tekrar deneyin.") }),
});

// POST /auth/register
// POST /auth/register
router.post("/register", authLimiter, async (req, res) => {
    try {
        // 🆕 also read userType from body (optional)
        const { email, password, name, userType: rawUserType } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ error: msg(req, "Email and password are required.", "E-posta ve şifre gereklidir.") });
        }
        
        const emailResult = validateEmail(email);
        if (!emailResult.valid) {
            return res.status(400).json({ error: msg(req, "Invalid email format.", "Geçersiz e-posta biçimi.") });
        }
        const passResult = validatePassword(password, reqLang(req));
        if (!passResult.valid) {
            return res.status(400).json({ error: passResult.message });
        }

        // check if user already exists
        const existing = await prisma.user.findUnique({ where: { email: emailResult.email } });
        if (existing) {
            return res
                .status(409)
                .json({ error: msg(req, "User with this email already exists.", "Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var.") });
        }

        const hashed = await bcrypt.hash(password, 10);

        // 🆕 validate / normalize userType
        const allowedUserTypes = ["STUDENT", "STAFF", "SPECIAL_GUEST", "PARENT", "OTHER"];
        const finalUserType = allowedUserTypes.includes(rawUserType)
            ? rawUserType
            : "OTHER"; // default for now

        const user = await prisma.user.create({
            data: {
                email,
                password: hashed,
                name: name || null,
                userType: finalUserType, // 🆕 this matches your Prisma enum
                language: req.body?.language === "en" ? "en" : "tr",
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
        res.status(500).json({ error: msg(req, "Internal server error.", "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.") });
    }
});

// POST /auth/login
router.post("/login", authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: msg(req, "Email and password are required.", "E-posta ve şifre gereklidir.") });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: msg(req, "Invalid email or password.", "E-posta veya şifre hatalı.") });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: msg(req, "Invalid email or password.", "E-posta veya şifre hatalı.") });
        }

        const blacklisted = await prisma.blacklist.findUnique({
            where: { userId: user.id }
        });

        if (blacklisted) {
            return res.status(401).json({
                error: msg(req, "Your account is blacklisted. You cannot log in. Please contact EDU Hotel.", "Hesabınız kara listeye alınmıştır, giriş yapamazsınız. Lütfen EDU Hotel ile iletişime geçin.")
            });
        }

        const { language } = req.body;
        if ((language === "tr" || language === "en") && language !== user.language) {
            await prisma.user.update({ where: { id: user.id }, data: { language } });
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
        res.status(500).json({ error: msg(req, "Internal server error.", "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.") });
    }
});

// POST /auth/admin-login
router.post("/admin-login", authLimiter, async (req, res) => {
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

// POST /auth/forgot-password
// Always returns 200 to avoid leaking whether an email exists in the system.
// Generates a 32-byte random token, stores its SHA-256 hash, expires in 1 hour,
// invalidates any prior unused tokens for that user, and emails a reset link.
router.post("/forgot-password", forgotLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({ error: msg(req, "Email is required.", "E-posta adresi gereklidir.") });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        // Surface unknown emails to the user (per UX request). Trade-off: this allows
        // email enumeration. The dedicated forgotLimiter (5 req / 15 min / IP) still
        // caps probing.
        if (!user) {
            return res.status(404).json({ error: msg(req, "This email is not registered.", "Bu e-posta adresi kayıtlı değil."), code: "EMAIL_NOT_REGISTERED" });
        }

        // Invalidate any prior unused tokens for this user so only the newest works
        await prisma.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
            data: { usedAt: new Date() },
        });

        const rawToken = crypto.randomBytes(32).toString("hex"); // 64 chars
        const tokenHash = sha256(rawToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.passwordResetToken.create({
            data: { userId: user.id, tokenHash, expiresAt },
        });

        const resetLink = `${clientUrl()}/reset-password?token=${rawToken}`;
        const guestName = user.firstName || user.name || (user.email.split("@")[0]);

        try {
            const lang = req.body?.language || user.language;
            const subject = pick(lang, "EDU Hotel – Reset your password", "EDU Hotel – Şifrenizi sıfırlayın");

            const bodyEN = `
<p style="margin:0 0 4px;">Dear <strong>${guestName}</strong>,</p>
<p style="margin:0 0 18px;color:#475569;">We received a request to reset the password for your EDU Hotel account.</p>
${badge('Password Reset', 'blue')}
${heading('Set a new password')}
<p style="margin:0 0 18px;font-size:13px;color:#475569;">Click the button below to choose a new password. This link will expire in <strong>1 hour</strong>.</p>
<p style="margin:0 0 22px;">
  <a href="${resetLink}" style="display:inline-block;background:#003366;color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:600;font-size:13px;letter-spacing:0.04em;">Reset password</a>
</p>
<p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">If the button doesn't work, copy and paste this URL into your browser:</p>
<p style="margin:0 0 18px;font-size:12px;color:#475569;word-break:break-all;">${resetLink}</p>
<p style="margin:0;font-size:12.5px;color:#64748b;">If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</p>`;

            const bodyTR = `
<p style="margin:0 0 4px;">Sayın <strong>${guestName}</strong>,</p>
<p style="margin:0 0 18px;color:#475569;">EDU Hotel hesabınızın şifresini sıfırlama talebi aldık.</p>
${badge('Şifre Sıfırlama', 'blue')}
${heading('Yeni bir şifre belirleyin')}
<p style="margin:0 0 18px;font-size:13px;color:#475569;">Yeni bir şifre belirlemek için aşağıdaki düğmeye tıklayın. Bu bağlantının süresi <strong>1 saat</strong> içinde dolacaktır.</p>
<p style="margin:0 0 22px;">
  <a href="${resetLink}" style="display:inline-block;background:#003366;color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:600;font-size:13px;letter-spacing:0.04em;">Şifreyi sıfırla</a>
</p>
<p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">Düğme çalışmıyorsa bu adresi tarayıcınıza kopyalayıp yapıştırabilirsiniz:</p>
<p style="margin:0 0 18px;font-size:12px;color:#475569;word-break:break-all;">${resetLink}</p>
<p style="margin:0;font-size:12.5px;color:#64748b;">Bu işlemi siz yapmadıysanız bu e-postayı yok sayabilirsiniz — mevcut şifreniz değişmeyecektir.</p>`;

            const text = pick(lang, [
                `Dear ${guestName},`,
                ``,
                `We received a request to reset the password for your EDU Hotel account.`,
                `Open this link to choose a new password (expires in 1 hour):`,
                resetLink,
                ``,
                `If you didn't request this, you can safely ignore this email.`,
                ], [
                `Sayın ${guestName},`,
                ``,
                `EDU Hotel hesabınız için şifre sıfırlama talebi aldık.`,
                `Yeni bir şifre belirlemek için bu bağlantıyı açın (1 saat içinde sona erer):`,
                resetLink,
                ``,
                `Bu işlemi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`,
            ]).join('\n');

            const html = emailTemplate(bodyEN, bodyTR, lang);
            // Password reset is a security flow — always send, ignore the
            // admin "Email Notifications" toggle.
            sendMailAsync({ to: user.email, subject, text, html, transactional: false });
        } catch (mailErr) {
            console.error("Failed to send reset email:", mailErr);
            // Don't surface this to the caller — the token is still valid.
        }

        return res.status(200).json({ message: msg(req, "If an account exists for this email, a reset link has been sent.", "Bu e-posta adresine ait bir hesap varsa şifre sıfırlama bağlantısı gönderildi.") });
    } catch (err) {
        console.error("Forgot password error:", err);
        return res.status(500).json({ error: msg(req, "Internal server error.", "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.") });
    }
});

// POST /auth/reset-password
// Validates the token, checks expiry/use, updates the user's password,
// and marks the token consumed.
router.post("/reset-password", authLimiter, async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (typeof token !== "string" || token.length !== 64) {
            return res.status(400).json({ error: msg(req, "Invalid or missing reset token.", "Şifre sıfırlama bağlantısı geçersiz veya eksik.") });
        }
        if (typeof newPassword !== "string") {
            return res.status(400).json({ error: msg(req, "Password is required.", "Şifre gereklidir.") });
        }
        const passResult = validatePassword(newPassword, reqLang(req));
        if (!passResult.valid) {
            return res.status(400).json({ error: passResult.message });
        }

        const tokenHash = sha256(token);
        const record = await prisma.passwordResetToken.findUnique({
            where: { tokenHash },
            include: { user: { select: { id: true, email: true } } },
        });

        if (!record || record.usedAt || record.expiresAt < new Date()) {
            return res.status(400).json({ error: msg(req, "This reset link is invalid or has expired.", "Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.") });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        // Atomic: mark token used AND update the user's password together.
        await prisma.$transaction([
            prisma.user.update({
                where: { id: record.userId },
                data: { password: hashed },
            }),
            prisma.passwordResetToken.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            }),
            // Belt-and-suspenders: invalidate any other outstanding tokens for this user
            prisma.passwordResetToken.updateMany({
                where: { userId: record.userId, usedAt: null, id: { not: record.id } },
                data: { usedAt: new Date() },
            }),
        ]);

        return res.json({ message: msg(req, "Password updated successfully.", "Şifreniz başarıyla güncellendi.") });
    } catch (err) {
        console.error("Reset password error:", err);
        return res.status(500).json({ error: msg(req, "Internal server error.", "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.") });
    }
});

module.exports = router;
