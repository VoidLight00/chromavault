/**
 * Route Compatibility Middleware
 * Enhanced Express 4.x routing utilities and middleware
 */

import { Request, Response, NextFunction, Router } from 'express';
import { logger } from '../utils/logger';

// Custom route parameter type
export interface RouteParam {
  name: string;
  optional?: boolean;
  repeat?: boolean;
}

// Enhanced route handler type that supports Express 5.x
export type RouteHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

// Route parameter validation middleware
export const validateRouteParams = (paramSchema: Record<string, RegExp>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      for (const [paramName, pattern] of Object.entries(paramSchema)) {
        const paramValue = req.params[paramName];
        
        if (paramValue && !pattern.test(paramValue)) {
          res.status(400).json({
            success: false,
            message: `Invalid parameter: ${paramName}`,
            code: 'INVALID_ROUTE_PARAMETER',
            details: {
              parameter: paramName,
              value: paramValue,
              expected: pattern.toString(),
            },
          });
          return;
        }
      }
      next();
    } catch (error) {
      logger.error('Route parameter validation error:', error);
      next(error);
    }
  };
};

// UUID parameter validation
export const validateUuidParam = (paramName: string = 'id') => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  return validateRouteParams({
    [paramName]: uuidPattern,
  });
};

// Safe route creation for Express 4.x
export const createSafeRoute = (path: string): string => {
  try {
    // Basic validation for Express 4.x route patterns
    if (!path || typeof path !== 'string') {
      throw new Error('Invalid path');
    }
    
    // Express 4.x handles these patterns well
    return path
      .replace(/\/+/g, '/') // Remove duplicate slashes
      .replace(/\/$/, '') || '/'; // Remove trailing slash except for root
  } catch (error) {
    logger.warn(`Invalid route path detected: ${path}, using fallback`);
    return '/';
  }
};

// Enhanced router that provides Express 4.x utilities
export class CompatibleRouter {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  // Safe route registration methods
  get(path: string, ...handlers: RouteHandler[]): void {
    const safePath = createSafeRoute(path);
    this.router.get(safePath, ...handlers);
  }

  post(path: string, ...handlers: RouteHandler[]): void {
    const safePath = createSafeRoute(path);
    this.router.post(safePath, ...handlers);
  }

  put(path: string, ...handlers: RouteHandler[]): void {
    const safePath = createSafeRoute(path);
    this.router.put(safePath, ...handlers);
  }

  patch(path: string, ...handlers: RouteHandler[]): void {
    const safePath = createSafeRoute(path);
    this.router.patch(safePath, ...handlers);
  }

  delete(path: string, ...handlers: RouteHandler[]): void {
    const safePath = createSafeRoute(path);
    this.router.delete(safePath, ...handlers);
  }

  use(path: string | RouteHandler, ...handlers: RouteHandler[]): void {
    if (typeof path === 'string') {
      const safePath = createSafeRoute(path);
      this.router.use(safePath, ...handlers);
    } else {
      this.router.use(path, ...handlers);
    }
  }

  // Get the underlying Express router
  getRouter(): Router {
    return this.router;
  }
}

// Middleware to enhance Express 4.x parameter parsing
export const fixPathToRegexpParams = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Ensure all route parameters are properly decoded
    if (req.params) {
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string') {
          req.params[key] = decodeURIComponent(value);
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Path parameter fixing error:', error);
    next();
  }
};

// Express 4.x response helpers
export const enhanceResponse = (_req: Request, res: Response, next: NextFunction) => {
  // Add backward compatibility for Express 4.x style responses
  if (!res.json.bind) {
    const originalJson = res.json;
    res.json = function(obj: any) {
      return originalJson.call(this, obj);
    };
  }

  // Add custom response helpers
  res.success = function(data: any, message?: string) {
    return res.status(200).json({
      success: true,
      message: message || 'Success',
      data,
      timestamp: new Date().toISOString(),
    });
  };

  res.error = function(message: string, code?: string, statusCode: number = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
      code: code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  };

  next();
};

// Export everything
export { Router } from 'express';

// Type augmentation for enhanced response methods
declare global {
  namespace Express {
    interface Response {
      success(data: any, message?: string): Response;
      error(message: string, code?: string, statusCode?: number): Response;
    }
  }
}

export default {
  validateRouteParams,
  validateUuidParam,
  createSafeRoute,
  CompatibleRouter,
  fixPathToRegexpParams,
  enhanceResponse,
};