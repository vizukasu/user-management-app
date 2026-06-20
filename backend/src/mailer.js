// important: trivial mail sending via Gmail account, explicitly allowed by the
// task description for testing purposes ("5-10 mails per day" is fine).
// note: sent asynchronously, never blocks the registration response.

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // note: must be a Gmail "app password", not the normal password
  },
});

function sendVerificationEmail(toEmail, token) {
  const link = `${process.env.PUBLIC_APP_URL}/api/auth/verify?token=${token}`;
  // nota bene: fire-and-forget, registration must not wait for this
  transporter
    .sendMail({
      from: process.env.GMAIL_USER,
      to: toEmail,
      subject: "Confirm your account",
      html: `<p>Click to confirm your account:</p><p><a href="${link}">${link}</a></p>`,
    })
    .catch((err) => console.error("Failed to send verification email:", err.message));
}

module.exports = { sendVerificationEmail };
