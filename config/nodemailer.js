// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// exports.sendAlert = async (to, subject, text) => {
//   try {
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to,
//       subject,
//       text,
//     });
//     console.log('Alert sent');
//   } catch (err) {
//     console.error('Error sending alert:', err);
//   }
// };
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendAlert = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"RAN Clinic" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Error sending email:', err);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendAlert };