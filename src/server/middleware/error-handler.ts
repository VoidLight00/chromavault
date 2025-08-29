/**
 * Global Error Handler Middleware
 * Centralized error handling for ChromaVault API
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { logger, logError } from '../utils/logger';
import { responseFormats } from '../config/api.config';

// Custom error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.name = 'RateLimitError';
  }
}

// Handle Zod validation errors
const handleZodError = (error: z.ZodError) => {
  const details = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return new ValidationError('Validation failed', { issues: details });
};

// Handle Prisma errors
const handlePrismaError = (error: any) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        const field = error.meta?.target as string[] | undefined;
        return new ConflictError(
          `Resource already exists${field ? ` (${field.join(', ')})` : ''}`,
          { field, value: error.meta?.target }
        );
      
      case 'P2014': // Required relation missing
        return new ValidationError('Required relation missing', error.meta);
      
      case 'P2003': // Foreign key constraint violation
        return new ValidationError('Invalid reference', error.meta);
      
      case 'P2025': // Record not found
        return new NotFoundError();
      
      case 'P2016': // Query interpretation error
        return new ValidationError('Invalid query parameters', error.meta);
      
      default:
        logger.error('Unhandled Prisma error:', { code: error.code, meta: error.meta });
        return new ApiError('Database operation failed', 500, 'DATABASE_ERROR');
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return new ApiError('Database connection error', 503, 'DATABASE_CONNECTION_ERROR');
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid data format');
  }

  return new ApiError('Database error', 500, 'DATABASE_ERROR');
};

// Handle file upload errors
const handleMulterError = (error: any) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError('File too large', {
      maxSize: error.limit,
      field: error.field,
    });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return new ValidationError('Too many files', {
      maxCount: error.limit,
      field: error.field,
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError('Unexpected file field', {
      field: error.field,
    });
  }

  return new ValidationError('File upload error', { code: error.code });
};

// Main error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let apiError: ApiError;

  // Handle known error types
  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof z.ZodError) {
    apiError = handleZodError(error);
  } else if (error.name === 'MulterError') {
    apiError = handleMulterError(error);
  } else if (error instanceof Prisma.PrismaClientKnownRequestError ||
             error instanceof Prisma.PrismaClientUnknownRequestError ||
             error instanceof Prisma.PrismaClientValidationError) {
    apiError = handlePrismaError(error);
  } else if (error.name === 'JsonWebTokenError') {
    apiError = new UnauthorizedError('Invalid authentication token');
  } else if (error.name === 'TokenExpiredError') {
    apiError = new UnauthorizedError('Authentication token expired');
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    apiError = new ValidationError('Invalid JSON format');
  } else {
    // Unknown error
    apiError = new ApiError('Internal server error');
    
    // Log the full error for debugging
    logError(error, {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body,
      user: req.user,
      ip: req.ip,
    });
  }

  // Log API errors (except client errors)
  if (apiError.statusCode >= 500) {
    logError(apiError, {
      url: req.url,
      method: req.method,
      user: req.user,
      ip: req.ip,
    });
  }

  // Send error response
  res.status(apiError.statusCode).json(responseFormats.error(
    apiError.message,
    apiError.code,
    apiError.details
  ));
};

// 404 handler for undefined routes
export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route not found`);
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation middleware factory
export const validateRequest = (schema: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      
      if (schema.query) {
        const parsed = schema.query.parse(req.query);
        req.query = parsed as any;
      }
      
      if (schema.params) {
        const parsed = schema.params.parse(req.params);
        req.params = parsed as any;
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Error boundary for specific operations
export const withErrorBoundary = <T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> => {
  return operation().catch((error) => {
    if (context) {
      error.context = context;
    }
    throw error;
  });
};

// Health check error handler
export const healthCheckErrorHandler = (error: Error) => {
  logger.error('Health check failed:', error);
  return {
    status: 'unhealthy',
    error: error.message,
    timestamp: new Date().toISOString(),
  };
};

// Export helper functions for creating common errors
export const createError = {
  notFound: (resource?: string) => new NotFoundError(resource),
  unauthorized: (message?: string) => new UnauthorizedError(message),
  forbidden: (message?: string) => new ForbiddenError(message),
  validation: (message: string, details?: any) => new ValidationError(message, details),
  conflict: (message: string, details?: any) => new ConflictError(message, details),
  rateLimit: (retryAfter: number) => new RateLimitError(retryAfter),
  internal: (message?: string) => new ApiError(message || 'Internal server error'),
};

export default errorHandler;