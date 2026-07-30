const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'webpro_admin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeDatabase() {
  const connection = await pool.getConnection();

  try {
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'webpro_admin'}`);
    await connection.query(`USE ${process.env.DB_NAME || 'webpro_admin'}`);

    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        status ENUM('active', 'pending', 'banned', 'locked') DEFAULT 'pending',
        failed_attempts INT DEFAULT 0,
        locked_until DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Sessions table (max 2 per user)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token VARCHAR(500) NOT NULL,
        device_info VARCHAR(255),
        ip_address VARCHAR(45),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Login attempts tracking
    await connection.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        email VARCHAR(100),
        ip_address VARCHAR(45),
        success BOOLEAN DEFAULT FALSE,
        attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Password reset codes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        reset_code VARCHAR(100) NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Admin approval queue
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_approvals (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        processed_by VARCHAR(36),
        rejection_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME,
        FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create admin user if not exists (default: admin@webpro.co.id / admin123)
    const [admins] = await connection.query("SELECT * FROM users WHERE role = 'admin'");
    if (admins.length === 0) {
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');
      const passwordHash = await bcrypt.hash('admin123', 10);
      await connection.query(
        "INSERT INTO users (id, username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)",
        [uuidv4(), 'admin', 'admin@webpro.co.id', passwordHash, 'admin', 'active']
      );
      console.log('✅ Default admin user created: admin@webpro.co.id / admin123');
    }

    console.log('✅ All tables created successfully');
  } finally {
    connection.release();
  }
}

// User-specific data tables functions
async function createUserTables(userId) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`USE ${process.env.DB_NAME || 'webpro_admin'}`);

    const tables = ['suppliers', 'barang', 'pembeli', 'transactions', 'payments'];

    for (const table of tables) {
      // Replace hyphens with underscores to avoid MySQL syntax errors
      const safeUserId = userId.replace(/-/g, '_');
      const tableName = `user_${safeUserId}_${table}`;

      if (table === 'suppliers') {
        await conn.query(`
          CREATE TABLE IF NOT EXISTS \`${tableName}\` (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            contact VARCHAR(100),
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else if (table === 'barang') {
        await conn.query(`
          CREATE TABLE IF NOT EXISTS \`${tableName}\` (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            supplier_id VARCHAR(50),
            price DECIMAL(15,2) DEFAULT 0,
            stock INT DEFAULT 0,
            category VARCHAR(50),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else if (table === 'pembeli') {
        await conn.query(`
          CREATE TABLE IF NOT EXISTS \`${tableName}\` (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100),
            phone VARCHAR(20),
            address TEXT,
            total_orders INT DEFAULT 0,
            total_spent DECIMAL(15,2) DEFAULT 0,
            join_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else if (table === 'transactions') {
        await conn.query(`
          CREATE TABLE IF NOT EXISTS \`${tableName}\` (
            id VARCHAR(50) PRIMARY KEY,
            transaction_no VARCHAR(20) UNIQUE NOT NULL,
            pembeli_id VARCHAR(50),
            items JSON,
            total_amount DECIMAL(15,2) DEFAULT 0,
            status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else if (table === 'payments') {
        await conn.query(`
          CREATE TABLE IF NOT EXISTS \`${tableName}\` (
            id VARCHAR(50) PRIMARY KEY,
            payment_no VARCHAR(30) UNIQUE NOT NULL,
            transaction_id VARCHAR(50),
            amount DECIMAL(15,2) DEFAULT 0,
            method VARCHAR(50),
            status ENUM('pending', 'success', 'rejected') DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
    }
    console.log(`✅ User tables created for user: ${userId}`);
  } finally {
    conn.release();
  }
}

async function dropUserTables(userId) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`USE ${process.env.DB_NAME || 'webpro_admin'}`);

    const tables = ['suppliers', 'barang', 'pembeli', 'transactions', 'payments'];

    for (const table of tables) {
      // Replace hyphens with underscores to avoid MySQL syntax errors
      const safeUserId = userId.replace(/-/g, '_');
      const tableName = `user_${safeUserId}_${table}`;
      await conn.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }
    console.log(`✅ User tables dropped for user: ${userId}`);
  } finally {
    conn.release();
  }
}

async function eraseAllUserData(userId) {
  await dropUserTables(userId);
  await createUserTables(userId);
  console.log(`✅ All data erased for user: ${userId}`);
}

module.exports = {
  pool,
  initializeDatabase,
  createUserTables,
  dropUserTables,
  eraseAllUserData
};
