const ejs = require("ejs");
const fs = require("fs");
const path = require("path");

const sendEmail = async (to, subject, template, data) => {
  const templatePath = path.join(__dirname, `../templates/${template}.ejs`);
  const html = await ejs.renderFile(templatePath, data);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendEmail;
