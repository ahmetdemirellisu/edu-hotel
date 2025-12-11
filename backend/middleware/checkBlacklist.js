const prisma = require("../prismaClient");

async function checkBlacklist(req, res, next) {
    try {
        const userId = req.body.userId || req.user?.userId;

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
        console.error("Blacklist check error:", err);
        next();
    }
}

module.exports = checkBlacklist;
