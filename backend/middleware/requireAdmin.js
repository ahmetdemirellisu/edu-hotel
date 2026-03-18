const jwt = require("jsonwebtoken");

/**
 * Middleware: verifies the request carries a valid admin JWT.
 * The token must have been issued by POST /auth/admin-login.
 * Attach this to every admin-only route.
 */
function requireAdmin(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Admin authentication required." });
    }

    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "admin") {
            return res.status(403).json({ error: "Admin access only." });
        }
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired admin token." });
    }
}

module.exports = requireAdmin;
