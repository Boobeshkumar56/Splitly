const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
   host: 'sandbox.smtp.mailtrap.io',
  port: 587,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

exports.sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: `"Splitly" <${process.env.MAIL_USER}>`,
    to,
    subject,
    text
  };

  return transporter.sendMail(mailOptions);
};
