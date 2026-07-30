# WebPro Admin Dashboard

Sistem manajemen admin untuk aplikasi WebPro - aplikasi POS (Point of Sale) untuk mengelola barang, supplier, pembeli, transaksi, dan pembayaran.

## Fitur Utama

- **Dashboard** - Overview statistik dan metrik bisnis
- **Manajemen Barang** - CRUD barang dengan stok tracking
- **Manajemen Supplier** - Kelola data supplier
- **Manajemen Pembeli** - Kelola data pelanggan
- **Transaksi** - Pencatatan transaksi penjualan
- **Pembayaran** - Tracking status pembayaran
- **Report** - Export PDF dan Excel
- **User Management** - Sistem approval untuk user baru
- **Notifikasi** - Telegram notification untuk admin

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19 + TypeScript + TailwindCSS |
| Backend | Express.js + Node.js |
| Database | MySQL 8.0 |
| Build | Vite |
| Container | Docker + Docker Compose |

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0 (atau gunakan container)

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/fadhlirabbi/webpro.git
cd webpro/webpro-admin-dashboard
```

### 2. Setup Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env dengan konfigurasi database Anda
nano server/.env
```

### 3. Configure Database

Edit `server/.env`:

```env
# Server Configuration
PORT=8082
NODE_ENV=production

# Database
DB_HOST=crud_mysql        # Hostname MySQL container
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=your_password
DB_NAME=webpro_admin

# JWT Secret (ubah di production!)
JWT_SECRET=your-secret-key

# App URL
APP_URL=https://webpro.yttahomeserver.online

# Session Settings
MAX_CONCURRENT_SESSIONS=2
MAX_LOGIN_ATTEMPTS=3
LOCK_DURATION_MINUTES=15
```

### 4. Run with Docker

```bash
# Start containers
docker compose up -d

# Check status
docker compose ps
```

### 5. Run Locally (Development)

```bash
# Frontend
npm install
npm run dev

# Backend (separate terminal)
cd server
npm install
node src/index.js
```

## Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8081 |
| Backend API | http://localhost:8082 |
| Health Check | http://localhost:8082/api/health |

## Default Admin Login

```
Email: admin@webpro.co.id
Password: admin123
```

**Note:** Ganti password default setelah login pertama!

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user baru |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Request reset password |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Get current user |

### Data (Requires Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data/suppliers` | List suppliers |
| POST | `/api/data/suppliers` | Add supplier |
| PUT | `/api/data/suppliers/:id` | Update supplier |
| DELETE | `/api/data/suppliers/:id` | Delete supplier |
| GET | `/api/data/barang` | List barang |
| POST | `/api/data/barang` | Add barang |
| PUT | `/api/data/barang/:id` | Update barang |
| DELETE | `/api/data/barang/:id` | Delete barang |
| GET | `/api/data/pembeli` | List pembeli |
| POST | `/api/data/pembeli` | Add pembeli |
| PUT | `/api/data/pembeli/:id` | Update pembeli |
| DELETE | `/api/data/pembeli/:id` | Delete pembeli |
| GET | `/api/data/transactions` | List transactions |
| POST | `/api/data/transactions` | Create transaction |
| PUT | `/api/data/transactions/:id` | Update transaction |
| DELETE | `/api/data/transactions/:id` | Delete transaction |
| GET | `/api/data/payments` | List payments |
| POST | `/api/data/payments` | Create payment |
| PUT | `/api/data/payments/:id` | Update payment |
| DELETE | `/api/data/payments/:id` | Delete payment |

### Admin (Requires Admin Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/pending-approvals` | List pending approvals |
| POST | `/api/admin/approve-user` | Approve user |
| POST | `/api/admin/reject-user` | Reject user |
| PUT | `/api/admin/users/:id` | Edit user |
| DELETE | `/api/admin/users/:id` | Delete user |
| POST | `/api/admin/reset-user-password/:id` | Reset user password |
| POST | `/api/admin/unlock-user/:id` | Unlock user |

## User Registration Flow

1. User register via `/api/auth/register`
2. Request masuk ke approval queue
3. Admin review dan approve/reject via Admin Panel
4. Jika approved, user bisa login dengan password yang di-set

## Project Structure

```
webpro-admin-dashboard/
├── src/                    # Frontend React
│   ├── components/         # React components
│   ├── views/             # Page views
│   ├── utils/             # Utilities
│   └── App.tsx            # Main app
├── server/                 # Backend Express
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth middleware
│   │   └── utils/         # Utilities
│   └── index.js           # Entry point
├── docker-compose.yml      # Docker compose
└── Dockerfile             # Docker build
```

## Deployment

### Docker Compose

```bash
# Build dan start
docker compose up -d --build

# Restart
docker compose restart

# Stop
docker compose down

# View logs
docker compose logs -f
```

### Environment Variables untuk Production

Pastikan set environment variables berikut:

- `NODE_ENV=production`
- `JWT_SECRET` (unique secret key)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `EMAIL_*` untuk SMTP email
- `TELEGRAM_*` untuk notifications

## Troubleshooting

### Container tidak start?

```bash
# Check logs
docker compose logs

# Rebuild
docker compose up -d --build --force-recreate
```

### Database connection error?

```bash
# Pastikan MySQL accessible
docker exec webpro-admin-backend ping crud_mysql

# Check network
docker network ls
```

### Reset Admin Password

```sql
UPDATE users SET password_hash = '$2a$10$...' WHERE email = 'admin@webpro.co.id';
```

## License

MIT License

## Author

Fadhlirabbi
