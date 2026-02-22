require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS (allow local + your deployed frontend)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://hackeurope2026.vercel.app',
];

app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (curl, server-to-server, health checks)
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());

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

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
