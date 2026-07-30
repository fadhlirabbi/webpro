const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendAccountApproved, sendTelegramNotification } = require('../utils/email');

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// ==================== GET ALL USERS ====================
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.pool.query(
      'SELECT id, username, email, role, status, failed_attempts, locked_until, created_at FROM users ORDER BY created_at DESC'
    );

    // Get session counts for each user
    const usersWithSessions = await Promise.all(users.map(async (user) => {
      const [sessions] = await db.pool.query(
        'SELECT COUNT(*) as count FROM sessions WHERE user_id = ? AND expires_at > NOW()',
        [user.id]
      );
      return {
        ...user,
        activeSessions: sessions[0].count
      };
    }));

    res.json({ users: usersWithSessions });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== GET PENDING APPROVALS ====================
router.get('/pending-approvals', async (req, res) => {
  try {
    const [approvals] = await db.pool.query(
      "SELECT * FROM admin_approvals WHERE status = 'pending' ORDER BY created_at DESC"
    );
    res.json({ approvals });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== APPROVE USER ====================
router.post('/approve-user', async (req, res) => {
  try {
    const { approvalId, password } = req.body;

    if (!approvalId) {
      return res.status(400).json({ error: 'Approval ID wajib diisi' });
    }

    // Get approval request
    const [approvals] = await db.pool.query(
      'SELECT * FROM admin_approvals WHERE id = ? AND status = ?',
      [approvalId, 'pending']
    );

    if (approvals.length === 0) {
      return res.status(404).json({ error: 'Permintaan tidak ditemukan' });
    }

    const approval = approvals[0];

    // Generate password if not provided
    const finalPassword = password || generateRandomPassword();

    // Create user
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    await db.pool.query(
      'INSERT INTO users (id, username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, approval.username, approval.email, passwordHash, 'user', 'active']
    );

    // Create user's data tables
    await db.createUserTables(userId);

    // Update approval status
    await db.pool.query(
      "UPDATE admin_approvals SET status = 'approved', processed_by = ?, processed_at = NOW() WHERE id = ?",
      [req.user.id, approvalId]
    );

    // Send notification to user (non-blocking)
    sendAccountApproved(approval.email, approval.username, finalPassword).catch(err => {
      console.error('Failed to send approval email:', err);
    });

    // Send Telegram notification (non-blocking)
    const notifMessage = `
✅ <b>User Approved</b>

👤 <b>Username:</b> ${approval.username}
📧 <b>Email:</b> ${approval.email}
🔑 <b>Password:</b> ${finalPassword}
    `;
    sendTelegramNotification(notifMessage).catch(err => {
      console.error('Failed to send Telegram notification:', err);
    });

    res.json({ message: 'User berhasil diapprove dan email notifikasi telah dikirim' });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== REJECT USER ====================
router.post('/reject-user', async (req, res) => {
  try {
    const { approvalId, reason } = req.body;

    if (!approvalId) {
      return res.status(400).json({ error: 'Approval ID wajib diisi' });
    }

    // Get approval details first
    const [approvals] = await db.pool.query('SELECT * FROM admin_approvals WHERE id = ?', [approvalId]);

    // Update status
    await db.pool.query(
      "UPDATE admin_approvals SET status = 'rejected', processed_by = ?, rejection_reason = ?, processed_at = NOW() WHERE id = ?",
      [req.user.id, reason || 'No reason provided', approvalId]
    );

    // Send Telegram notification (non-blocking)
    if (approvals.length > 0) {
      const notifMessage = `
❌ <b>User Rejected</b>

👤 <b>Username:</b> ${approvals[0].username}
📧 <b>Email:</b> ${approvals[0].email}
📝 <b>Alasan:</b> ${reason || 'Tidak disebutkan'}
      `;
      sendTelegramNotification(notifMessage).catch(err => {
        console.error('Failed to send Telegram notification:', err);
      });
    }

    res.json({ message: 'User berhasil ditolak' });

  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== EDIT USER ====================
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, role, status } = req.body;

    // Prevent editing self
    if (userId === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'Tidak dapat menurunkan role sendiri' });
    }

    // Check if user exists
    const [users] = await db.pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Update user
    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
      // If unbanning, reset failed attempts
      if (status === 'active') {
        updates.push('failed_attempts = 0');
        updates.push('locked_until = NULL');
      }
    }

    if (updates.length > 0) {
      values.push(userId);
      await db.pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    res.json({ message: 'User berhasil diperbarui' });

  } catch (error) {
    console.error('Edit user error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== DELETE USER ====================
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting self
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri' });
    }

    // Delete user's data tables
    await db.dropUserTables(userId);

    // Delete sessions
    await db.pool.query('DELETE FROM sessions WHERE user_id = ?', [userId]);

    // Delete user
    await db.pool.query('DELETE FROM users WHERE id = ?', [userId]);

    // Send Telegram notification
    const notifMessage = `
🗑️ <b>User Deleted</b>

👤 <b>Deleted User ID:</b> ${userId}
👮 <b>By Admin:</b> ${req.user.username}

<i>Semua data user telah dihapus.</i>
    `;
    await sendTelegramNotification(notifMessage);

    res.json({ message: 'User dan semua datanya berhasil dihapus' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== ERASE USER DATA ====================
router.post('/erase-user-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Erase all user data
    await db.eraseAllUserData(userId);

    // Send Telegram notification
    const notifMessage = `
🧹 <b>User Data Erased</b>

👤 <b>User ID:</b> ${userId}
👮 <b>By Admin:</b> ${req.user.username}

<i>Semua data user telah dihapus.</i>
    `;
    await sendTelegramNotification(notifMessage);

    res.json({ message: 'Semua data user berhasil dihapus' });

  } catch (error) {
    console.error('Erase user data error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== UNLOCK USER ====================
router.post('/unlock-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    await db.pool.query(
      "UPDATE users SET status = 'active', failed_attempts = 0, locked_until = NULL WHERE id = ?",
      [userId]
    );

    res.json({ message: 'User berhasil diunlock' });

  } catch (error) {
    console.error('Unlock user error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== RESET USER PASSWORD ====================
router.post('/reset-user-password/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [users] = await db.pool.query('SELECT * FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const newPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.pool.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, userId]);

    // Invalidate all sessions
    await db.pool.query('DELETE FROM sessions WHERE user_id = ?', [userId]);

    // Send email with new password
    const user = users[0];
    await sendAccountApproved(user.email, user.username, newPassword);

    res.json({ message: 'Password berhasil direset dan dikirim ke email user', tempPassword: newPassword });

  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== GET LOGIN HISTORY ====================
router.get('/login-history/:userId?', async (req, res) => {
  try {
    const { userId } = req.params;

    let query = `
      SELECT la.*, u.username
      FROM login_attempts la
      LEFT JOIN users u ON la.user_id = u.id
      ORDER BY la.attempted_at DESC
      LIMIT 100
    `;

    let params = [];

    if (userId) {
      query = `
        SELECT la.*, u.username
        FROM login_attempts la
        LEFT JOIN users u ON la.user_id = u.id
        WHERE la.user_id = ?
        ORDER BY la.attempted_at DESC
        LIMIT 100
      `;
      params = [userId];
    }

    const [history] = await db.pool.query(query, params);
    res.json({ history });

  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== GET STATS ====================
router.get('/stats', async (req, res) => {
  try {
    const [[userStats]] = await db.pool.query(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_users,
        SUM(CASE WHEN status = 'locked' THEN 1 ELSE 0 END) as locked_users,
        SUM(CASE WHEN status = 'banned' THEN 1 ELSE 0 END) as banned_users
      FROM users WHERE role = 'user'
    `);

    const [[approvalStats]] = await db.pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM admin_approvals
    `);

    const [[sessionStats]] = await db.pool.query(`
      SELECT COUNT(*) as active_sessions FROM sessions WHERE expires_at > NOW()
    `);

    res.json({
      users: userStats,
      approvals: approvalStats,
      sessions: sessionStats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// Helper function
function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

module.exports = router;
