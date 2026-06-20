const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// note: every route below goes through requireAuth, which is the single
// place that re-validates "exists and not blocked" before the action runs.
router.use(requireAuth);

// important: list users, sorted by last_login (newest first), as required
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, status, last_login, registered_at FROM users ORDER BY last_login IS NULL, last_login DESC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/block", async (req, res, next) => {
  try {
    const { ids } = req.body; // array of user ids
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No users selected." });
    }

    // important: save current status into previous_status before blocking,
    // so unblock can restore it (unverified stays unverified, active stays active)
    await pool.query(
      `UPDATE users
       SET previous_status = IF(status = 'blocked', previous_status, status),
           status = 'blocked'
       WHERE id IN (?)`,
      [ids]
    );

    const selfBlocked = ids.includes(req.user.id);
    res.json({ message: "Selected users have been blocked.", selfBlocked });
  } catch (err) {
    next(err);
  }
});

router.post("/unblock", async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No users selected." });
    }

    // important: restore the status that was active before blocking
    await pool.query(
      "UPDATE users SET status = previous_status WHERE id IN (?) AND status = 'blocked'",
      [ids]
    );

    res.json({ message: "Selected users have been unblocked." });
  } catch (err) {
    next(err);
  }
});

router.post("/delete", async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No users selected." });
    }

    // note: deleted users are actually removed from the table, not "marked"
    await pool.query("DELETE FROM users WHERE id IN (?)", [ids]);

    const selfDeleted = ids.includes(req.user.id);
    res.json({ message: "Selected users have been deleted.", selfDeleted });
  } catch (err) {
    next(err);
  }
});

router.post("/delete-unverified", async (req, res, next) => {
  try {
    await pool.query("DELETE FROM users WHERE status = 'unverified'");
    res.json({ message: "All unverified users have been deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
