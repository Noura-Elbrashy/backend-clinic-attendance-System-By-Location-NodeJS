const { sendAlert } = require('./config/nodemailer');

async function testEmail() {
  try {
    await sendAlert('noura.elbrashy@gmail.com', 'Test Email', 'This is a test email from RAN Clinic');
    console.log('Test email sent successfully');
  } catch (err) {
    console.error('Test email error:', err);
  }
}

testEmail();