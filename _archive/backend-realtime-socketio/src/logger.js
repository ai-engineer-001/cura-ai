/**
 * Winston logger configuration
 */

import winston from 'winston';
import { config } from './config.js';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for console
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} [${level}] ${message} ${metaStr}`;
});

// Create logger instance
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    config.LOG_FORMAT === 'json' ? json() : consoleFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        consoleFormat
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

export default logger;
