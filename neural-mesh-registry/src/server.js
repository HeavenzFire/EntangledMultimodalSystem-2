const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('./utils/logger');

// Import routes
const neuronsRouter = require('./routes/neurons');
const pathwaysRouter = require('./routes/pathways');
const authRouter = require('./routes/auth');

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  }
}));

// CORS
app.use(cors(config.cors));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.logging.format, { stream: logger.stream }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.maxAuthAttempts,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  }
});

// Apply rate limiting to API routes
app.use('/api', limiter);
app.use('/api/auth', authLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/neurons', neuronsRouter);
app.use('/api/pathways', pathwaysRouter);
app.use('/api/auth', authRouter);

// Metrics endpoint (for Prometheus)
app.get('/metrics', async (req, res) => {
  try {
    // In production, integrate with prom-client
    res.set('Content-Type', 'text/plain');
    res.send('# Metrics endpoint - integrate with prom-client for full metrics\n');
  } catch (error) {
    logger.error(`Error fetching metrics: ${error.message}`);
    res.status(500).send('Error fetching metrics');
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Don't leak error details in production
  const message = config.nodeEnv === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    message,
    ...(config.nodeEnv !== 'production' && { stack: err.stack })
  });
});

module.exports = app;
