const prisma = require("../prismaClient");
const { msg } = require("../utils/lang");

async function checkBlacklist(req, res, next) {
    try {
        // G05 fix: ONLY use the JWT-verified userId — never trust body.userId
        const userId = req.user?.userId;

        if (!userId) return next();

        const entry = await prisma.blacklist.findUnique({
            where: { userId: Number(userId) }
        });

        if (entry) {
            return res.status(403).json({
                error: msg(req, "Your account is blacklisted. Please contact EDU Hotel administration.", "Hesabınız kara listeye alınmıştır. Lütfen EDU Hotel yönetimiyle iletişime geçin.")
            });
        }

        next();
    } catch (err) {
        // G05 fix: fail-closed — reject the request on infrastructure errors
        console.error("Blacklist check error:", err);
        return res.status(503).json({ error: msg(req, "Service temporarily unavailable. Please try again.", "Hizmet geçici olarak kullanılamıyor. Lütfen tekrar deneyin.") });
    }
}

module.exports = checkBlacklist;
