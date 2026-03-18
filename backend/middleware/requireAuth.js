const jwt = require("jsonwebtoken");

/**
 * Verifies the user's JWT and attaches req.user = { userId, email }.
 * Returns 401 if missing/invalid, 403 if the token belongs to a different user.
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required." });
    }

    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, email, iat, exp }
        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
}

module.exports = requireAuth;
