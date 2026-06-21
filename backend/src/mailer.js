function sendVerificationEmail(toEmail, token) {
  const link = `${process.env.PUBLIC_APP_URL}/api/auth/verify?token=${token}`;

  fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: toEmail,
      subject: "Confirm your account",
      html: `<p>Click to confirm your account:</p><p><a href="${link}">${link}</a></p>`,
    }),
  })
    .then(async (res) => {
      if (!res.ok) {
        console.error("Failed to send verification email:", await res.text());
      }
    })
    .catch((err) => console.error("Failed to send verification email:", err.message));
}

module.exports = { sendVerificationEmail };
