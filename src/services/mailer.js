const { createTransport } = require("nodemailer");
const getTransport = () =>
  createTransport({
    service: "Gmail",
    auth: {
      user: "phamnanghung.25@gmail.com",
      pass: "fmrimnfwujlmqgma",
    },
  });

async function sendEmail({ from = "Hưng", to, subject, html, text }) {
  const transporter = getTransport();

  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
  };
  await transporter.sendMail(mailOptions);
}

module.exports.sendEmail = sendEmail;
