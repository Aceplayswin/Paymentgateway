require('dotenv').config();

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');

const pool = require('./config/db');
const { getCorsOptions, parseAllowedOrigins } = require('./config/cors');

const authRoutes = require('./routes/user.routes');
const transactionRoutes = require('./routes/transaction.routes');
const paymentRoutes = require('./routes/payment.routes');
const kycRoutes = require('./routes/kyc.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const payinRoutes = require('./routes/payin.routes');
const payoutRoutes = require('./routes/payout.routes');
const reportsRoutes = require('./routes/reports.routes');
const profileRoutes = require('./routes/profile.routes');
const settingsRoutes = require('./routes/settings.routes');
const developerRoutes = require('./routes/developer.routes');
const adminRoutes = require('./routes/admin.routes');
const v1Routes = require('./routes/v1.routes');

app.use(cors(getCorsOptions()));
console.log('CORS allowed origins:', parseAllowedOrigins());

// Public merchant API (/api/v1) is mounted BEFORE the global JSON parser so its
// own parser can capture the raw request body for HMAC signature verification.
app.use('/api/v1', v1Routes);

app.use(express.json({ limit: '25mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payin', payinRoutes);
app.use('/api/payout', payoutRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/admin', adminRoutes);

const PORT = Number(process.env.PORT) || 3000;

// Liveness for nginx / deploy health checks. Must not depend on DB so a
// brief MySQL blip cannot take the process offline and cause 502s.
app.get('/api/health', async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    conn.release();
    res.status(200).json({ status: 'ok', db: true });
  } catch (err) {
    res.status(200).json({
      status: 'ok',
      db: false,
      dbError: err.message,
    });
  }
});

// Listen first so the process stays up for nginx even if MySQL is slow/down.
// DB is verified in the background; routes that need it will still fail until
// the pool can connect.
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

pool
  .getConnection()
  .then((conn) => {
    conn.release();
    console.log('Database Connected');
  })
  .catch((err) => {
    console.error('Database connection failed (server still listening):', err.message);
  });
