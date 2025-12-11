// backend/services/mail.js
const nodemailer = require('nodemailer');

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

if (!user || !pass) {
    console.warn('⚠️ EMAIL_USER or EMAIL_PASS is not set in .env');
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user,
        pass,
    },
});

async function sendMail({ to, subject, text, html }) {
    if (!to) {
        console.warn('sendMail called without "to"');
        return;
    }

    const fromName = process.env.EMAIL_FROM_NAME || 'EDU Hotel';
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || user;

    const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to,
        subject,
        text,
        html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent:', info.messageId, 'to', to);
}

module.exports = { sendMail };
