const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, 
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, 
  },
  connectionTimeout: 10000,
});

function sendVerificationEmail(toEmail, token) {
  const link = `${process.env.PUBLIC_APP_URL}/api/auth/verify?token=${token}`;
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
