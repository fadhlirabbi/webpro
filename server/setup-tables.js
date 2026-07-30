const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '172.21.0.2',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'webpro2024',
  database: process.env.DB_NAME || 'webpro_admin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function setupAdminTables() {
  const adminUserId = 'eaf8fa13-b918-46a0-9103-d0f3bb099a08';
  const safeId = adminUserId.replace(/-/g, '_');

  const tables = ['suppliers', 'barang', 'pembeli', 'transactions', 'payments'];

  for (const table of tables) {
    const tableName = `user_${safeId}_${table}`;

    let createSQL = '';

    if (table === 'suppliers') {
      createSQL = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        contact VARCHAR(100),
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`;
    } else if (table === 'barang') {
      createSQL = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        supplier_id VARCHAR(50),
        price DECIMAL(15,2) DEFAULT 0,
        stock INT DEFAULT 0,
        category VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`;
    } else if (table === 'pembeli') {
      createSQL = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        total_orders INT DEFAULT 0,
        total_spent DECIMAL(15,2) DEFAULT 0,
        join_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`;
    } else if (table === 'transactions') {
      createSQL = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id VARCHAR(50) PRIMARY KEY,
        transaction_no VARCHAR(20) UNIQUE NOT NULL,
        pembeli_id VARCHAR(50),
        items JSON,
        total_amount DECIMAL(15,2) DEFAULT 0,
        status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`;
    } else if (table === 'payments') {
      createSQL = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id VARCHAR(50) PRIMARY KEY,
        payment_no VARCHAR(30) UNIQUE NOT NULL,
        transaction_id VARCHAR(50),
        amount DECIMAL(15,2) DEFAULT 0,
        method VARCHAR(50),
        status ENUM('pending', 'success', 'rejected') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`;
    }

    if (createSQL) {
      try {
        await pool.query(createSQL);
        console.log(`✅ Created table: ${tableName}`);
      } catch (err) {
        console.error(`❌ Error creating ${tableName}:`, err.message);
      }
    }
  }
}

setupAdminTables()
  .then(() => {
    console.log('✅ Setup complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  });
