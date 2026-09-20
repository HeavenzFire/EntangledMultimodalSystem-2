const winston = require('winston');
const config = require('../../config');

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom log format for development
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: config.nodeEnv === 'production' 
    ? combine(timestamp(), json())
    : combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        devFormat
      ),
  defaultMeta: { service: 'neural-mesh-registry' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.nodeEnv === 'production' 
        ? combine(timestamp(), json())
        : combine(colorize(), devFormat)
    }),
    
    // File transport for errors
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: combine(timestamp(), json())
    }),
    
    // File transport for all logs
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: combine(timestamp(), json())
    })
  ]
});

// Stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
