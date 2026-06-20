-- important: schema for the user management task
-- nota bene: email uniqueness is guaranteed by the DATABASE (unique index),
-- not by application code. The app only catches the resulting DB error.

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash CHAR(64) NOT NULL,        -- sha3-256 hex digest
  status ENUM('unverified','active','blocked') NOT NULL DEFAULT 'unverified',
  previous_status ENUM('unverified','active') NOT NULL DEFAULT 'unverified', -- note: used to restore status on unblock
  verification_token VARCHAR(255) NULL,
  last_login DATETIME NULL,
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- THE FIRST REQUIREMENT: a UNIQUE INDEX (separate from the primary key)
-- important: this is what actually guarantees consistency under concurrent inserts
CREATE UNIQUE INDEX ux_users_email ON users (email);
