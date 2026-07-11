const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const exportRoutes = require('./routes/export');
const fontRoutes = require('./routes/fonts');
const validateRoutes = require('./routes/validate');
const userRoutes = require('./routes/user');
const themeRoutes = require('./routes/themes');
const { authMiddleware } = require('./middleware/auth');
const { exportLimiter, generalLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// Security & Middleware
// =============================================================================

app.use(helmet({
  // Allow Google Docs sidebar to embed this app in an iframe
  frameguard: false, // Disable X-Frame-Options (handled by CSP instead)
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https://bookify-ixxa.onrender.com"],
      // Allow this app to be embedded in Google Docs sidebar iframe
      frameAncestors: [
        "'self'",
        "https://*.google.com",
        "https://*.googleusercontent.com",
        "https://docs.google.com",
        "https://script.google.com",
        "https://*.google.com.au",
      ],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://bookify-ixxa.onrender.com',
  /\.google\.com$/,
  /script\.google\.com$/,
  // Dev
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// =============================================================================
// Health Check (for Render.com keep-alive ping)
// =============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'bookify-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
  });
});

// =============================================================================
// Public Routes
// =============================================================================

app.use('/fonts', generalLimiter, fontRoutes);

// =============================================================================
// Authenticated Routes
// =============================================================================

app.use('/export', authMiddleware, exportLimiter, exportRoutes);
app.use('/validate', authMiddleware, generalLimiter, validateRoutes);
app.use('/user', authMiddleware, generalLimiter, userRoutes);
app.use('/themes', authMiddleware, generalLimiter, themeRoutes);

// =============================================================================
// Serve Frontend App
// =============================================================================

const path = require('path');
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// =============================================================================
// Error Handler
// =============================================================================

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// =============================================================================
// Start Server
// =============================================================================

app.listen(PORT, () => {
  console.log(`Bookify API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Memory limit: ${Math.round(require('v8').getHeapStatistics().heap_size_limit / 1024 / 1024)}MB`);
});

module.exports = app;
