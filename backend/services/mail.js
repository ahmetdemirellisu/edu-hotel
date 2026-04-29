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
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
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

    const start = Date.now();
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId} to ${to} (${Date.now() - start}ms)`);
}

/**
 * Fire-and-forget email — does not block the caller.
 * Errors are logged but never thrown.
 */
function sendMailAsync(opts) {
    sendMail(opts).catch(err => console.error('📧 Background email failed:', err.message));
}

module.exports = { sendMail, sendMailAsync };
