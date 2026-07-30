const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"WebPro Admin" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html
    });
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return false;
  }
}

async function sendPasswordResetCode(email, code) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0891b2, #2563eb); padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">WebPro Admin</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e293b; margin-top: 0;">Reset Password</h2>
        <p style="color: #64748b;">Anda meminta reset password. Gunakan kode berikut:</p>
        <div style="background: #1e293b; color: #22d3ee; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #94a3b8; font-size: 12px;">Kode ini akan expire dalam 15 menit.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </div>
    </div>
  `;

  return await sendEmail(email, '🔐 WebPro Admin - Kode Reset Password', html);
}

async function sendPasswordResetLink(email, resetLink) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0891b2, #2563eb); padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">WebPro Admin</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e293b; margin-top: 0;">Reset Password</h2>
        <p style="color: #64748b;">Anda meminta reset password. Klik tombol di bawah untuk membuat password baru:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #0891b2, #2563eb); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">⚠️ Link ini akan expire dalam 1 jam.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </div>
    </div>
  `;

  return await sendEmail(email, '🔐 WebPro Admin - Reset Password', html);
}

async function sendAccountApproved(email, username, password) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0891b2, #2563eb); padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">WebPro Admin</h1>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
        <h2 style="color: #16a34a;">🎉 Akun Anda Disetujui!</h2>
        <p style="color: #1e293b;">Selamat! Akun Anda telah disetujui oleh admin.</p>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0; color: #64748b;"><strong>Username:</strong> ${username}</p>
          <p style="margin: 5px 0; color: #64748b;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0; color: #64748b;"><strong>Password:</strong> ${password}</p>
        </div>
        <p style="color: #dc2626; font-weight: bold;">⚠️ Segera login dan ubah password Anda!</p>
        <a href="${process.env.APP_URL || 'https://webpro.yttahomeserver.online'}" style="display: inline-block; background: linear-gradient(135deg, #0891b2, #2563eb); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Login Sekarang</a>
      </div>
    </div>
  `;

  return await sendEmail(email, '🎉 WebPro Admin - Akun Disetujui!', html);
}

async function sendTelegramNotification(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('📱 Telegram notification (not configured):', message);
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    return response.ok;
  } catch (error) {
    console.error('Telegram error:', error.message);
    return false;
  }
}

module.exports = {
  sendEmail,
  sendPasswordResetCode,
  sendPasswordResetLink,
  sendAccountApproved,
  sendTelegramNotification
};
