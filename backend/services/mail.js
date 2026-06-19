// backend/services/mail.js
const nodemailer = require('nodemailer');
const settingsService = require('./settings');

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

/**
 * Send an email.
 *
 * @param {object} opts
 *   - to/subject/text/html: standard fields
 *   - transactional (default true): if true, the send is suppressed when the
 *     admin has turned off "Email Notifications" in Settings. Pass false for
 *     critical security flows (password reset) that must always send.
 */
async function sendMail({ to, subject, text, html, transactional = true }) {
    if (!to) {
        console.warn('sendMail called without "to"');
        return;
    }

    // Honour the admin "Email Notifications" toggle for transactional sends.
    if (transactional) {
        try {
            const s = await settingsService.getSettings();
            if (s && s.emailNotifications === false) {
                console.log(`📭 Email suppressed by admin setting: "${subject}" → ${to}`);
                return;
            }
        } catch (err) {
            // If settings can't be read, default to sending — don't lose mail.
            console.warn('mail: could not read settings, sending anyway:', err.message);
        }
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
