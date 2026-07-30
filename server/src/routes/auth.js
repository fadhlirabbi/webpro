const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');
const { sendPasswordResetCode, sendPasswordResetLink, sendAccountApproved, sendTelegramNotification } = require('../utils/email');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const MAX_SESSIONS = parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 2;
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 3;
const LOCK_DURATION = parseInt(process.env.LOCK_DURATION_MINUTES) || 15;

// Blocked email domains (test/fake domains)
const BLOCKED_EMAIL_DOMAINS = [
  'example.com', 'example.org', 'example.net',
  'test.com', 'test.org', 'test.net',
  'fake.com', 'fake.org', 'fake.net',
  'mailinator.com', 'tempmail.com', 'throwaway.com'
];

function isValidEmailDomain(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  if (BLOCKED_EMAIL_DOMAINS.includes(domain)) return false;
  if (domain.includes('test') && domain.length < 10) return false;
  return true;
}

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username harus 3-50 karakter' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email tidak valid' });
    }

    // Check email domain validity
    if (!isValidEmailDomain(email)) {
      return res.status(400).json({ error: 'Domain email tidak valid. Gunakan email asli.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    // Check if user exists
    const [existing] = await db.pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username atau email sudah terdaftar' });
    }

    // Send to admin approval queue (no auto-approval for security)
    const passwordHash = await bcrypt.hash(password, 10);
    const approvalId = uuidv4();

    await db.pool.query(
      'INSERT INTO admin_approvals (id, username, email, password_hash, status) VALUES (?, ?, ?, ?, ?)',
      [approvalId, username, email, passwordHash, 'pending']
    );

    // Send Telegram notification to admin
    const notifMessage = `
📋 <b>Permintaan Registrasi Baru</b>

👤 <b>Username:</b> ${username}
📧 <b>Email:</b> ${email}

⏰ <b>Waktu:</b> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

<i>Login ke admin panel untuk approve/reject.</i>
    `;
    await sendTelegramNotification(notifMessage);

    res.json({
      message: 'Pendaftaran berhasil! Menunggu persetujuan admin.',
      approvalId
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    // Get user
    const [users] = await db.pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Log failed attempt
      await db.pool.query(
        'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)',
        [email, req.ip, false]
      );
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const user = users[0];

    // Check if locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({
        error: `Akun terkunci. Coba lagi dalam ${remaining} menit.`,
        lockedUntil: user.locked_until
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      // Increment failed attempts
      const newAttempts = user.failed_attempts + 1;

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_DURATION * 60000);
        await db.pool.query(
          'UPDATE users SET failed_attempts = ?, locked_until = ?, status = ? WHERE id = ?',
          [newAttempts, lockedUntil, 'locked', user.id]
        );

        // Log failed attempt
        await db.pool.query(
          'INSERT INTO login_attempts (user_id, email, ip_address, success) VALUES (?, ?, ?, ?)',
          [user.id, email, req.ip, false]
        );

        return res.status(423).json({
          error: `Terlalu banyak percobaan gagal. Akun terkunci selama ${LOCK_DURATION} menit.`,
          lockedUntil
        });
      }

      await db.pool.query(
        'UPDATE users SET failed_attempts = ? WHERE id = ?',
        [newAttempts, user.id]
      );

      // Log failed attempt
      await db.pool.query(
        'INSERT INTO login_attempts (user_id, email, ip_address, success) VALUES (?, ?, ?, ?)',
        [user.id, email, req.ip, false]
      );

      return res.status(401).json({
        error: `Email atau password salah. Sisa percobaan: ${MAX_LOGIN_ATTEMPTS - newAttempts}`,
        remainingAttempts: MAX_LOGIN_ATTEMPTS - newAttempts
      });
    }

    // Check status
    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Akun belum disetujui admin' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Akun dibanned' });
    }

    // Reset failed attempts on successful login
    await db.pool.query(
      'UPDATE users SET failed_attempts = 0, locked_until = NULL, status = ? WHERE id = ?',
      ['active', user.id]
    );

    // Log successful attempt
    await db.pool.query(
      'INSERT INTO login_attempts (user_id, email, ip_address, success) VALUES (?, ?, ?, ?)',
      [user.id, email, req.ip, true]
    );

    // Check and manage concurrent sessions (max 2)
    const [sessions] = await db.pool.query(
      'SELECT * FROM sessions WHERE user_id = ? AND expires_at > NOW() ORDER BY created_at ASC',
      [user.id]
    );

    if (sessions.length >= MAX_SESSIONS) {
      // Remove oldest session
      await db.pool.query('DELETE FROM sessions WHERE id = ?', [sessions[0].id]);
    }

    // Create new session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';

    await db.pool.query(
      'INSERT INTO sessions (id, user_id, token, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionId, user.id, '', deviceInfo, req.ip, expiresAt]
    );

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, sessionId, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update session with token
    await db.pool.query('UPDATE sessions SET token = ? WHERE id = ?', [token, sessionId]);

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== LOGOUT ====================
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await db.pool.query('DELETE FROM sessions WHERE id = ?', [req.sessionId]);
    res.json({ message: 'Logout berhasil' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email wajib diisi' });
    }

    const [users] = await db.pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      // Don't reveal if email exists
      return res.json({ message: 'Jika email terdaftar, link reset akan dikirim' });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete old reset tokens
    await db.pool.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);

    // Create new reset token
    await db.pool.query(
      'INSERT INTO password_resets (id, user_id, reset_code, expires_at) VALUES (?, ?, ?, ?)',
      [resetToken, user.id, resetToken, expiresAt]
    );

    // Build reset link
    const resetLink = `${process.env.APP_URL || 'https://webpro.yttahomeserver.online'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email with reset link (non-blocking)
    sendPasswordResetLink(email, resetLink).catch(err => {
      console.error('Failed to send reset email:', err);
    });

    res.json({ message: 'Link reset password telah dikirim ke email Anda' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== RESET PASSWORD ====================
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    // Find valid reset token
    const [resets] = await db.pool.query(
      'SELECT * FROM password_resets WHERE user_id = (SELECT id FROM users WHERE email = ?) AND reset_code = ? AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, token]
    );

    if (resets.length === 0) {
      return res.status(400).json({ error: 'Link reset tidak valid atau sudah expired' });
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.pool.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE email = ?', [passwordHash, email]);

    // Mark reset token as used
    await db.pool.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [resets[0].id]);

    // Invalidate all sessions for this user
    const [users] = await db.pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      await db.pool.query('DELETE FROM sessions WHERE user_id = ?', [users[0].id]);
    }

    res.json({ message: 'Password berhasil direset. Silakan login dengan password baru.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== VERIFY RESET TOKEN ====================
router.get('/verify-reset', async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({ error: 'Token dan email wajib diisi' });
    }

    const [resets] = await db.pool.query(
      'SELECT * FROM password_resets WHERE user_id = (SELECT id FROM users WHERE email = ?) AND reset_code = ? AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, token]
    );

    if (resets.length === 0) {
      return res.status(400).json({ valid: false, error: 'Link reset tidak valid atau sudah expired' });
    }

    res.json({ valid: true });

  } catch (error) {
    console.error('Verify reset error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== GET CURRENT USER ====================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: req.user,
      sessionCount: MAX_SESSIONS
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== CHANGE PASSWORD ====================
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }

    const [users] = await db.pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);

    const validPassword = await bcrypt.compare(currentPassword, users[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Password saat ini salah' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.pool.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, req.user.id]);

    // Keep current session, invalidate others
    await db.pool.query('DELETE FROM sessions WHERE user_id = ? AND id != ?', [req.user.id, req.sessionId]);

    res.json({ message: 'Password berhasil diubah. Session lain telah diinvalidasi.' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
