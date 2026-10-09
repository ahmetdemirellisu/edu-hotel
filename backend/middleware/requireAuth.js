const jwt = require("jsonwebtoken");
const { msg } = require("../utils/lang");

/**
 * Verifies the user's JWT and attaches req.user = { userId, email }.
 * Returns 401 if missing/invalid, 403 if the token belongs to a different user.
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: msg(req, "Authentication required.", "Oturum açmanız gerekiyor.") });
    }

    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, email, iat, exp }
        next();
    } catch {
        return res.status(401).json({ error: msg(req, "Invalid or expired token.", "Oturumunuz geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.") });
    }
}

module.exports = requireAuth;
