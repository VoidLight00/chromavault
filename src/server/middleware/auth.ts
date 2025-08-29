/**
 * Authentication Middleware
 * JWT-based authentication for ChromaVault API
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prismaClient } from '../config/database';
import { jwtConfig, responseFormats } from '../config/api.config';
import { logger, logAuth, logSecurity } from '../utils/logger';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name?: string;
        avatar?: string;
      };
    }
  }
}

// JWT payload schema
const jwtPayloadSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.string(),
  iat: z.number(),
  exp: z.number(),
  iss: z.string(),
  aud: z.string(),
});

// Extract token from Authorization header
const extractToken = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

// Verify JWT token
const verifyToken = (token: string): Promise<z.infer<typeof jwtPayloadSchema>> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithms: [jwtConfig.algorithm],
    }, (err, decoded) => {
      if (err) {
        reject(err);
        return;
      }
      
      try {
        const payload = jwtPayloadSchema.parse(decoded);
        resolve(payload);
      } catch (validationError) {
        reject(new Error('Invalid token payload'));
      }
    });
  });
};

// Main authentication middleware
export const authMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      logSecurity('Missing authentication token', { 
        ip: req.ip, 
        userAgent: req.headers['user-agent'],
        path: req.path 
      });
      
      res.status(401).json(responseFormats.error(
        'Authentication token required',
        'MISSING_TOKEN'
      ));
      return;
    }

    // Verify token
    const payload = await verifyToken(token);
    
    // Check if user still exists and is active
    const user = await prismaClient.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isVerified: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      logSecurity('Token for non-existent or deleted user', { 
        userId: payload.id,
        ip: req.ip 
      });
      
      res.status(401).json(responseFormats.error(
        'Invalid authentication token',
        'USER_NOT_FOUND'
      ));
      return;
    }

    if (!user.isVerified) {
      logSecurity('Unverified user attempting access', { 
        userId: user.id,
        email: user.email,
        ip: req.ip 
      });
      
      res.status(401).json(responseFormats.error(
        'Account not verified',
        'ACCOUNT_NOT_VERIFIED'
      ));
      return;
    }

    // Update last login
    await prismaClient.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || undefined,
      avatar: user.avatar || undefined,
    };

    logAuth('Authentication successful', user.id, {
      email: user.email,
      role: user.role,
      ip: req.ip,
      path: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logSecurity('Expired token used', { 
        ip: req.ip,
        expiredAt: error.expiredAt 
      });
      
      res.status(401).json(responseFormats.error(
        'Authentication token expired',
        'TOKEN_EXPIRED',
        { expiredAt: error.expiredAt }
      ));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logSecurity('Invalid token format', { 
        ip: req.ip,
        error: error.message 
      });
      
      res.status(401).json(responseFormats.error(
        'Invalid authentication token',
        'INVALID_TOKEN'
      ));
      return;
    }

    logger.error('Authentication middleware error:', error);
    res.status(500).json(responseFormats.error(
      'Authentication service error',
      'AUTH_SERVICE_ERROR'
    ));
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req.headers.authorization);
  
  if (!token) {
    next();
    return;
  }

  try {
    const payload = await verifyToken(token);
    
    const user = await prismaClient.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isVerified: true,
        deletedAt: true,
      },
    });

    if (user && !user.deletedAt && user.isVerified) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name || undefined,
        avatar: user.avatar || undefined,
      };
    }
  } catch (error) {
    // Silently ignore authentication errors for optional auth
    logger.debug('Optional authentication failed:', error);
  }

  next();
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json(responseFormats.error(
        'Authentication required',
        'UNAUTHORIZED'
      ));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurity('Access denied - insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        ip: req.ip,
      });
      
      res.status(403).json(responseFormats.error(
        'Insufficient permissions',
        'FORBIDDEN',
        { requiredRoles: allowedRoles }
      ));
      return;
    }

    next();
  };
};

// Admin-only middleware
export const requireAdmin = requireRole(['ADMIN']);

// Pro or Admin middleware
export const requireProOrAdmin = requireRole(['PRO', 'ADMIN']);

// Moderator, Admin, or Pro middleware
export const requireModerator = requireRole(['MODERATOR', 'ADMIN', 'PRO']);

// Resource ownership middleware (for user resources)
export const requireOwnershipOrAdmin = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json(responseFormats.error(
        'Authentication required',
        'UNAUTHORIZED'
      ));
      return;
    }

    // Admin can access any resource
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const resourceId = req.params[resourceIdParam];
    const userId = req.user.id;

    // For user resources, check if the authenticated user is the owner
    if (resourceIdParam === 'userId' || req.baseUrl.includes('/users')) {
      if (resourceId !== userId) {
        logSecurity('Access denied - not resource owner', {
          userId,
          resourceId,
          path: req.path,
          ip: req.ip,
        });
        
        res.status(403).json(responseFormats.error(
          'Access denied',
          'NOT_RESOURCE_OWNER'
        ));
        return;
      }
    }

    next();
  };
};

// Generate JWT token
export const generateTokens = (user: { id: string; email: string; role: string }) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    algorithm: jwtConfig.algorithm,
  } as any);

  const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    algorithm: jwtConfig.algorithm,
  } as any);

  // Calculate expiration time in seconds
  const expiresIn = jwt.decode(accessToken) as any;
  const expirationTime = expiresIn.exp - Math.floor(Date.now() / 1000);

  return {
    accessToken,
    refreshToken,
    expiresIn: expirationTime,
  };
};

// Verify refresh token
export const verifyRefreshToken = (token: string): Promise<z.infer<typeof jwtPayloadSchema>> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, jwtConfig.refreshSecret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithms: [jwtConfig.algorithm],
    }, (err, decoded) => {
      if (err) {
        reject(err);
        return;
      }
      
      try {
        const payload = jwtPayloadSchema.parse(decoded);
        resolve(payload);
      } catch (validationError) {
        reject(new Error('Invalid refresh token payload'));
      }
    });
  });
};

export default authMiddleware;