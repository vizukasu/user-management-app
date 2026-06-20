const express = require("express");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");
const { hashPassword } = require("../hash");
const { sendVerificationEmail } = require("../mailer");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// important: registration. The DB's unique index — not this code — guarantees
// that two simultaneous registrations with the same email can't both succeed.
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    const passwordHash = hashPassword(password);
    const token = crypto.randomBytes(24).toString("hex");

    try {
      await pool.query(
        "INSERT INTO users (name, email, password_hash, status, previous_status, verification_token) VALUES (?, ?, ?, 'unverified', 'unverified', ?)",
        [name, email, passwordHash, token]
      );
    } catch (err) {
      // note: this is THE place that catches the DB-level uniqueness violation
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ code: "EMAIL_TAKEN", message: "This email is already registered." });
      }
      throw err;
    }

    sendVerificationEmail(email, token); // async, fire-and-forget

    res.status(201).json({ message: "Registration successful. Please check your email to confirm your account." });
  } catch (err) {
    next(err);
  }
});

// important: confirmation link target
router.get("/verify", async (req, res, next) => {
  try {
    const { token } = req.query;
    const [rows] = await pool.query("SELECT id, status FROM users WHERE verification_token = ?", [token]);
    const user = rows[0];

    if (!user) {
      return res.status(400).send("Invalid or expired confirmation link.");
    }

    // note: "blocked" stays "blocked" even if the link is clicked
    if (user.status === "unverified") {
      await pool.query(
        "UPDATE users SET status = 'active', previous_status = 'active', verification_token = NULL WHERE id = ?",
        [user.id]
      );
    }

    res.redirect(`${process.env.PUBLIC_FRONTEND_URL}/login?verified=1`);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const passwordHash = hashPassword(password || "");

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user || user.password_hash !== passwordHash) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (user.status === "blocked") {
      return res.status(403).json({ code: "USER_BLOCKED", message: "Your account has been blocked." });
    }

    // note: last_login is updated only on a real login, never on block/unblock
    await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, status: user.status } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
