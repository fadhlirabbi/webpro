const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Helper to get user's table name (with safe characters for MySQL)
function getTableName(userId, table) {
  // Replace hyphens with underscores and quote with backticks
  const safeUserId = userId.replace(/-/g, '_');
  return `\`user_${safeUserId}_${table}\``;
}

// ==================== SUPPLIERS ====================
router.get('/suppliers', async (req, res) => {
  try {
    const tableName = getTableName(req.user.id, 'suppliers');
    const [rows] = await db.pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
    res.json({ suppliers: rows });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const { name, contact, address } = req.body;
    const tableName = getTableName(req.user.id, 'suppliers');
    const id = `sup-${uuidv4()}`;

    await db.pool.query(
      `INSERT INTO ${tableName} (id, name, contact, address) VALUES (?, ?, ?, ?)`,
      [id, name, contact, address]
    );

    const [newRow] = await db.pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
    res.json({ supplier: newRow[0] });
  } catch (error) {
    console.error('Add supplier error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.put('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, address } = req.body;
    const tableName = getTableName(req.user.id, 'suppliers');

    await db.pool.query(
      `UPDATE ${tableName} SET name = ?, contact = ?, address = ? WHERE id = ?`,
      [name, contact, address, id]
    );

    res.json({ message: 'Supplier berhasil diperbarui' });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.delete('/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tableName = getTableName(req.user.id, 'suppliers');
    await db.pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    res.json({ message: 'Supplier berhasil dihapus' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== BARANG ====================
router.get('/barang', async (req, res) => {
  try {
    const tableName = getTableName(req.user.id, 'barang');
    const [rows] = await db.pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
    res.json({ barang: rows });
  } catch (error) {
    console.error('Get barang error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post('/barang', async (req, res) => {
  try {
    const { name, supplier_id, price, stock, category } = req.body;
    const tableName = getTableName(req.user.id, 'barang');
    const id = `itm-${uuidv4()}`;

    await db.pool.query(
      `INSERT INTO ${tableName} (id, name, supplier_id, price, stock, category) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, supplier_id, price, stock, category]
    );

    const [newRow] = await db.pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
    res.json({ barang: newRow[0] });
  } catch (error) {
    console.error('Add barang error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.put('/barang/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, supplier_id, price, stock, category } = req.body;
    const tableName = getTableName(req.user.id, 'barang');

    await db.pool.query(
      `UPDATE ${tableName} SET name = ?, supplier_id = ?, price = ?, stock = ?, category = ? WHERE id = ?`,
      [name, supplier_id, price, stock, category, id]
    );

    res.json({ message: 'Barang berhasil diperbarui' });
  } catch (error) {
    console.error('Update barang error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.delete('/barang/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tableName = getTableName(req.user.id, 'barang');
    await db.pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    res.json({ message: 'Barang berhasil dihapus' });
  } catch (error) {
    console.error('Delete barang error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== PEMBELI ====================
router.get('/pembeli', async (req, res) => {
  try {
    const tableName = getTableName(req.user.id, 'pembeli');
    const [rows] = await db.pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
    res.json({ pembeli: rows });
  } catch (error) {
    console.error('Get pembeli error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post('/pembeli', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const tableName = getTableName(req.user.id, 'pembeli');
    const id = `pem-${uuidv4()}`;

    await db.pool.query(
      `INSERT INTO ${tableName} (id, name, email, phone, address, total_orders, total_spent, join_date) VALUES (?, ?, ?, ?, ?, 0, 0, CURDATE())`,
      [id, name, email, phone, address]
    );

    const [newRow] = await db.pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
    res.json({ pembeli: newRow[0] });
  } catch (error) {
    console.error('Add pembeli error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.put('/pembeli/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;
    const tableName = getTableName(req.user.id, 'pembeli');

    await db.pool.query(
      `UPDATE ${tableName} SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?`,
      [name, email, phone, address, id]
    );

    res.json({ message: 'Pembeli berhasil diperbarui' });
  } catch (error) {
    console.error('Update pembeli error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.delete('/pembeli/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tableName = getTableName(req.user.id, 'pembeli');
    await db.pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    res.json({ message: 'Pembeli berhasil dihapus' });
  } catch (error) {
    console.error('Delete pembeli error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== TRANSACTIONS ====================
router.get('/transactions', async (req, res) => {
  try {
    const tableName = getTableName(req.user.id, 'transactions');
    const [rows] = await db.pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
    res.json({ transactions: rows });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post('/transactions', async (req, res) => {
  try {
    const { pembeli_id, items, total_amount, status } = req.body;
    const tableName = getTableName(req.user.id, 'transactions');
    const id = `trx-${uuidv4()}`;

    // Get next transaction number
    const [count] = await db.pool.query(`SELECT COUNT(*) as cnt FROM ${tableName}`);
    const transactionNo = `#TRX-${String(count[0].cnt + 1).padStart(3, '0')}`;

    await db.pool.query(
      `INSERT INTO ${tableName} (id, transaction_no, pembeli_id, items, total_amount, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, transactionNo, pembeli_id, JSON.stringify(items), total_amount, status || 'pending']
    );

    const [newRow] = await db.pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
    res.json({ transaction: newRow[0] });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.put('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tableName = getTableName(req.user.id, 'transactions');

    await db.pool.query(`UPDATE ${tableName} SET status = ? WHERE id = ?`, [status, id]);
    res.json({ message: 'Status transaksi berhasil diperbarui' });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.delete('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tableName = getTableName(req.user.id, 'transactions');
    await db.pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    res.json({ message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// ==================== PAYMENTS ====================
router.get('/payments', async (req, res) => {
  try {
    const tableName = getTableName(req.user.id, 'payments');
    const [rows] = await db.pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
    res.json({ payments: rows });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.post('/payments', async (req, res) => {
  try {
    const { transaction_id, amount, method, status } = req.body;
    const tableName = getTableName(req.user.id, 'payments');
    const id = `pay-${uuidv4()}`;

    // Get next payment number
    const [count] = await db.pool.query(`SELECT COUNT(*) as cnt FROM ${tableName}`);
    const paymentNo = `PAY-${new Date().getFullYear()}-${String(count[0].cnt + 1).padStart(3, '0')}`;

    await db.pool.query(
      `INSERT INTO ${tableName} (id, payment_no, transaction_id, amount, method, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, paymentNo, transaction_id, amount, method, status || 'pending']
    );

    const [newRow] = await db.pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
    res.json({ payment: newRow[0] });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.put('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tableName = getTableName(req.user.id, 'payments');

    await db.pool.query(`UPDATE ${tableName} SET status = ? WHERE id = ?`, [status, id]);
    res.json({ message: 'Status pembayaran berhasil diperbarui' });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

router.delete('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tableName = getTableName(req.user.id, 'payments');
    await db.pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    res.json({ message: 'Pembayaran berhasil dihapus' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
