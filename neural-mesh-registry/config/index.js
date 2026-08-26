require('dotenv').config();

module.exports = {
  // Server Configuration
  port: process.env.PORT || 7001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/neural_mesh',
    pool: {
      min: 2,
      max: 10
    }
  },
  
  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'neural_mesh:'
  },
  
  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
    jwtExpiresIn: '24h',
    encryptionKey: process.env.ENCRYPTION_KEY || 'change-this-to-32-char-secret-key',
    saltRounds: 10,
    mfa: {
      issuer: process.env.MFA_ISSUER || 'NeuralMeshRegistry',
      window: 1
    }
  },
  
  // Email Configuration (for alerts)
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'alerts@neuralmesh.local'
  },
  
  // Storage Configuration
  storage: {
    path: process.env.STORAGE_PATH || './data',
    encrypt: process.env.ENCRYPT_STORAGE === 'true'
  },
  
  // Monitoring Configuration
  monitoring: {
    metricsRetentionDays: parseInt(process.env.METRICS_RETENTION_DAYS) || 90,
    healthCheckInterval: 30000, // 30 seconds
    heartbeatTimeout: 90000, // 90 seconds
    alertThresholds: {
      latencyMs: parseInt(process.env.ALERT_LATENCY_THRESHOLD_MS) || 500,
      errorRate: parseFloat(process.env.ALERT_ERROR_RATE_THRESHOLD) || 0.05,
      cpuUsage: 0.8,
      memoryUsage: 0.85
    }
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    maxAuthAttempts: 5
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'combined'
  }
};
