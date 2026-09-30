const prisma = require("../prismaClient");

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
                error: "Your account is blacklisted. Please contact EDU Hotel administration."
            });
        }

        next();
    } catch (err) {
        // G05 fix: fail-closed — reject the request on infrastructure errors
        console.error("Blacklist check error:", err);
        return res.status(503).json({ error: "Service temporarily unavailable. Please try again." });
    }
}

module.exports = checkBlacklist;
