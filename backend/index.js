require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS (works on Render + Vercel)
app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (health checks / curl / server-to-server)
    if (!origin) return cb(null, true);

    // allow local dev
    if (origin === 'http://localhost:5173' || origin === 'http://localhost:4173') {
      return cb(null, true);
    }

    // allow any Vercel deployment (prod + preview)
    if (origin.endsWith('.vercel.app')) {
      return cb(null, true);
    }

    return cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// IMPORTANT: do NOT add app.options('*'...) or app.options('/*'...) on your setup (it crashes on Render)
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[request] ${req.method} ${req.path}`);
  next();
});

app.use('/auth', require('./routes/auth'));
app.use('/finance', require('./routes/finance'));
app.use('/subscriptions', require('./routes/subscriptions'));
app.use('/plaid', require('./routes/plaid'));
app.use('/cfo', require('./routes/cfo'));

app.get('/', (_req, res) => {
  res.json({ message: 'hackeurope2026 API!' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});