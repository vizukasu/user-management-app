// important: THIS is the single place in the whole codebase that checks
// "does the user exist and is not blocked" before any protected request.
// nota bene: per task requirements, this check must not be duplicated
// in every controller/route — every protected route just uses this middleware.

const jwt = require("jsonwebtoken");
const pool = require("../db/pool");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ code: "NOT_AUTHENTICATED", message: "Please log in." });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ code: "INVALID_TOKEN", message: "Your session is invalid. Please log in again." });
    }

    // note: always re-read fresh status from DB — the token itself can be stale
    const [rows] = await pool.query("SELECT id, name, email, status FROM users WHERE id = ?", [payload.id]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ code: "USER_DELETED", message: "Your account no longer exists. Please log in again." });
    }
    if (user.status === "blocked") {
      return res.status(401).json({ code: "USER_BLOCKED", message: "Your account has been blocked. Please log in again." });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, JWT_SECRET };
