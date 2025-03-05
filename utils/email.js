const ejs = require("ejs");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Setup mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async (to, subject, template, data) => {
  try {
    const templatePath = path.join(__dirname, `../templates/${template}.ejs`);

    // Render the EJS template
    const html = await ejs.renderFile(templatePath, data);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendEmail;
