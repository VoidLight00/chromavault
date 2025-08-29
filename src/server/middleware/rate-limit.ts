/**
 * Rate Limiting Middleware
 * Configurable rate limiting for ChromaVault API
 */

import { Request, Response, NextFunction } from 'express';
import { rateLimitConfig, responseFormats } from '../config/api.config';
import { logRateLimit } from '../utils/logger';

// In-memory store for rate limiting (use Redis in production)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime <= now) {
      delete store[key];
    }
  });
}, 60000); // Clean up every minute

// Get client identifier (IP + User ID if authenticated)
const getClientId = (req: Request): string => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userId = req.user?.id;
  return userId ? `user:${userId}` : `ip:${ip}`;
};

// Main rate limiting middleware
export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientId = getClientId(req);
  const now = Date.now();
  const windowMs = rateLimitConfig.windowMs;
  const maxRequests = getMaxRequests(req);

  // Initialize or get current limit data
  if (!store[clientId] || store[clientId].resetTime <= now) {
    store[clientId] = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  store[clientId].count++;

  // Set rate limit headers
  const remaining = Math.max(0, maxRequests - store[clientId].count);
  const resetTime = new Date(store[clientId].resetTime);

  res.set({
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(store[clientId].resetTime / 1000).toString(),
  });

  // Check if limit exceeded
  if (store[clientId].count > maxRequests) {
    const retryAfter = Math.ceil((store[clientId].resetTime - now) / 1000);
    
    logRateLimit(req.ip || 'unknown', req.path || 'unknown', maxRequests);
    
    res.set('Retry-After', retryAfter.toString());
    res.status(429).json(responseFormats.error(
      'Too many requests, please try again later',
      'RATE_LIMIT_EXCEEDED',
      {
        limit: maxRequests,
        windowMs,
        retryAfter,
        resetTime: resetTime.toISOString(),
      }
    ));
    return;
  }

  next();
};

// Get max requests based on user tier and endpoint
const getMaxRequests = (req: Request): number => {
  const basePath = req.path.split('/')[1];
  const userRole = req.user?.role;

  // Different limits for different user tiers
  const tierMultipliers = {
    ADMIN: 10,
    PRO: 3,
    USER: 1,
    ANONYMOUS: 0.2,
  };

  const currentTier = userRole || 'ANONYMOUS';
  const multiplier = tierMultipliers[currentTier as keyof typeof tierMultipliers] || 1;

  // Different limits for different endpoints
  const endpointLimits = {
    auth: 20,      // Lower limit for auth endpoints
    upload: 10,    // Lower limit for file uploads
    ai: 30,        // Lower limit for AI processing
    default: 100,  // Default limit
  };

  const endpointLimit = endpointLimits[basePath as keyof typeof endpointLimits] || endpointLimits.default;
  
  return Math.floor(endpointLimit * multiplier);
};

// Stricter rate limiting for sensitive operations
export const strictRateLimit = (
  limit: number = 5,
  windowMs: number = 60000 // 1 minute
) => {
  const strictStore: RateLimitStore = {};

  // Clean up expired entries
  setInterval(() => {
    const now = Date.now();
    Object.keys(strictStore).forEach(key => {
      if (strictStore[key].resetTime <= now) {
        delete strictStore[key];
      }
    });
  }, 60000);

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = getClientId(req);
    const now = Date.now();

    // Initialize or get current limit data
    if (!strictStore[clientId] || strictStore[clientId].resetTime <= now) {
      strictStore[clientId] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    strictStore[clientId].count++;

    // Set rate limit headers
    const remaining = Math.max(0, limit - strictStore[clientId].count);

    res.set({
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(strictStore[clientId].resetTime / 1000).toString(),
    });

    // Check if limit exceeded
    if (strictStore[clientId].count > limit) {
      const retryAfter = Math.ceil((strictStore[clientId].resetTime - now) / 1000);
      
      logRateLimit(req.ip || 'unknown', req.path || 'unknown', limit);
      
      res.set('Retry-After', retryAfter.toString());
      res.status(429).json(responseFormats.error(
        'Rate limit exceeded for this operation',
        'STRICT_RATE_LIMIT_EXCEEDED',
        {
          limit,
          windowMs,
          retryAfter,
        }
      ));
      return;
    }

    next();
  };
};

// Rate limit for login attempts (per IP and per email)
export const loginRateLimit = (() => {
  const loginStore: { [key: string]: RateLimitStore } = {
    ip: {},
    email: {},
  };

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    Object.keys(loginStore).forEach(storeType => {
      Object.keys(loginStore[storeType]).forEach(key => {
        if (loginStore[storeType][key].resetTime <= now) {
          delete loginStore[storeType][key];
        }
      });
    });
  }, 60000);

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || 'unknown';
    const email = req.body?.email;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    // Check IP-based rate limit
    const ipKey = `ip:${ip}`;
    if (!loginStore.ip[ipKey] || loginStore.ip[ipKey].resetTime <= now) {
      loginStore.ip[ipKey] = { count: 0, resetTime: now + windowMs };
    }

    // Check email-based rate limit if email is provided
    let emailKey = '';
    if (email) {
      emailKey = `email:${email}`;
      if (!loginStore.email[emailKey] || loginStore.email[emailKey].resetTime <= now) {
        loginStore.email[emailKey] = { count: 0, resetTime: now + windowMs };
      }
    }

    // Increment counters
    loginStore.ip[ipKey].count++;
    if (email) {
      loginStore.email[emailKey].count++;
    }

    // Check if limits exceeded
    const ipExceeded = loginStore.ip[ipKey].count > maxAttempts;
    const emailExceeded = email && loginStore.email[emailKey].count > maxAttempts;

    if (ipExceeded || emailExceeded) {
      const retryAfter = Math.ceil(
        Math.max(
          loginStore.ip[ipKey].resetTime - now,
          email ? loginStore.email[emailKey].resetTime - now : 0
        ) / 1000
      );

      logRateLimit(ip, 'login attempt', maxAttempts);

      res.set('Retry-After', retryAfter.toString());
      res.status(429).json(responseFormats.error(
        'Too many login attempts. Please try again later.',
        'LOGIN_RATE_LIMIT_EXCEEDED',
        {
          retryAfter,
          maxAttempts,
          windowMinutes: windowMs / 60000,
        }
      ));
      return;
    }

    next();
  };
})();

// Progressive delay middleware (increases delay with each request)
export const progressiveDelayMiddleware = (
  baseDelayMs: number = 100,
  maxDelayMs: number = 5000
) => {
  const delayStore: RateLimitStore = {};

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = getClientId(req);
    const now = Date.now();
    const windowMs = 60000; // 1 minute window

    if (!delayStore[clientId] || delayStore[clientId].resetTime <= now) {
      delayStore[clientId] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    delayStore[clientId].count++;

    // Calculate progressive delay
    const delay = Math.min(
      baseDelayMs * Math.pow(2, delayStore[clientId].count - 1),
      maxDelayMs
    );

    if (delay > baseDelayMs) {
      setTimeout(() => next(), delay);
    } else {
      next();
    }
  };
};

// Skip rate limiting for health checks and static assets
export const skipRateLimit = (req: Request): boolean => {
  const skipPaths = ['/health', '/favicon.ico', '/robots.txt'];
  const skipExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg'];
  
  if (skipPaths.includes(req.path)) {
    return true;
  }
  
  return skipExtensions.some(ext => req.path.endsWith(ext));
};

// Apply rate limiting conditionally
export const conditionalRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  if (skipRateLimit(req)) {
    next();
    return;
  }
  
  rateLimitMiddleware(req, res, next);
};

export default conditionalRateLimit;