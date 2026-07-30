const jwt = require('jsonwebtoken');
const db = require('../utils/database');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if session exists and is valid
    const [sessions] = await db.pool.query(
      'SELECT * FROM sessions WHERE id = ? AND user_id = ? AND expires_at > NOW()',
      [decoded.sessionId, decoded.userId]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Sesi tidak valid atau sudah expired' });
    }

    // Get user info
    const [users] = await db.pool.query(
      'SELECT id, username, email, role, status FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User tidak ditemukan' });
    }

    const user = users[0];

    // Check if user is banned or locked
    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Akun Anda dibanned' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ error: 'Akun terkunci. Coba lagi nanti.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Akun belum disetujui admin' });
    }

    req.user = user;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token sudah expired' });
    }
    return res.status(401).json({ error: 'Token tidak valid' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang boleh.' });
  }
  next();
}

module.exports = { authMiddleware, adminMiddleware };
