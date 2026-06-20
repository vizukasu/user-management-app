// important: trivial password hashing using sha3-256, as suggested by the task hints
const crypto = require("node:crypto");

function hashPassword(password) {
  // note: no salt is used here for simplicity, matching the task's "trivial" expectations
  return crypto.createHash("sha3-256").update(password).digest("hex");
}

module.exports = { hashPassword };
