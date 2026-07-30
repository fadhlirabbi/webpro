require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const db = require('./utils/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const dataRoutes = require('./routes/data');

const app = express();
const PORT = process.env.PORT || 8082;

// Security headers
app.use(helmet());

// Trust proxy (for rate limiting behind Cloudflare/nginx)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting - General
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Terlalu banyak request. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Strict rate limit for auth endpoints (login, register, forgot-password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 attempts per 15 minutes
  message: { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/data', dataRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan server' });
});

// Initialize database and start server
async function startServer() {
  try {
    await db.initializeDatabase();
    console.log('✅ Database initialized');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
