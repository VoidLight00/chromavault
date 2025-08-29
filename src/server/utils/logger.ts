/**
 * Winston Logger Configuration
 * Structured logging for the ChromaVault API
 */

import winston from 'winston';
import { apiConfig } from '../config/api.config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that we want to link the colors 
winston.addColors(colors);

// Create custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\nMetadata: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always present)
transports.push(
  new winston.transports.Console({
    format: apiConfig.NODE_ENV === 'development' ? consoleFormat : customFormat,
  })
);

// File transports for production
if (apiConfig.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  
  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: apiConfig.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format: customFormat,
  transports,
  exitOnError: false,
});

// Add request logging helper
export const logRequest = (req: any, res: any, responseTime?: number) => {
  const { method, url, ip, headers } = req;
  const { statusCode } = res;
  
  const logData = {
    method,
    url,
    ip,
    userAgent: headers['user-agent'],
    statusCode,
    responseTime: responseTime ? `${responseTime}ms` : undefined,
  };
  
  const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
  
  logger.log(level, `${method} ${url} ${statusCode}`, logData);
};

// Add error logging helper
export const logError = (error: Error, context?: any) => {
  logger.error(error.message, {
    error: error.name,
    stack: error.stack,
    context,
  });
};

// Add authentication logging helper
export const logAuth = (action: string, userId?: string, details?: any) => {
  logger.info(`Auth: ${action}`, {
    userId,
    action,
    ...details,
  });
};

// Add database logging helper
export const logDatabase = (operation: string, model?: string, duration?: number, details?: any) => {
  const level = duration && duration > 1000 ? 'warn' : 'debug';
  
  logger.log(level, `DB: ${operation}`, {
    operation,
    model,
    duration: duration ? `${duration}ms` : undefined,
    ...details,
  });
};

// Add security logging helper
export const logSecurity = (event: string, details?: any) => {
  logger.warn(`Security: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Performance monitoring helper
export const logPerformance = (operation: string, duration: number, details?: any) => {
  const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
  
  logger.log(level, `Performance: ${operation} took ${duration}ms`, {
    operation,
    duration,
    ...details,
  });
};

// Application lifecycle logging
export const logLifecycle = (event: 'startup' | 'shutdown' | 'restart', details?: any) => {
  logger.info(`Lifecycle: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Structured error logging for API responses
export const createApiError = (
  message: string, 
  statusCode: number = 500, 
  code: string = 'INTERNAL_ERROR',
  details?: any
) => {
  const error = {
    message,
    statusCode,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
  
  logger.error(`API Error: ${message}`, error);
  
  return error;
};

// Rate limiting logging
export const logRateLimit = (ip: string, endpoint: string, limit: number) => {
  logSecurity('Rate limit exceeded', {
    ip,
    endpoint,
    limit,
  });
};

// File operation logging
export const logFileOperation = (operation: 'upload' | 'delete' | 'process', filename?: string, size?: number, details?: any) => {
  logger.info(`File: ${operation}`, {
    operation,
    filename,
    size: size ? `${(size / 1024 / 1024).toFixed(2)}MB` : undefined,
    ...details,
  });
};

// Socket.io logging
export const logSocket = (event: string, socketId?: string, userId?: string, details?: any) => {
  logger.debug(`Socket: ${event}`, {
    event,
    socketId,
    userId,
    ...details,
  });
};

// Health check logging
export const logHealthCheck = (service: string, status: 'healthy' | 'unhealthy', details?: any) => {
  const level = status === 'healthy' ? 'info' : 'error';
  
  logger.log(level, `Health: ${service} is ${status}`, {
    service,
    status,
    ...details,
  });
};

// Create child logger for specific modules
export const createChildLogger = (module: string) => {
  return logger.child({ module });
};

// Export default logger
export default logger;