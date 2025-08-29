/**
 * API Configuration
 * Central configuration for the ChromaVault API server
 */

import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform((val) => parseInt(val, 10)),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  
  // Database
  DATABASE_URL: z.string(),
  
  // JWT
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // Redis
  REDIS_URL: z.string().optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  
  // File uploads
  UPLOAD_MAX_SIZE: z.string().default('10485760').transform((val) => parseInt(val, 10)), // 10MB
  UPLOAD_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/gif,image/webp'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((val) => parseInt(val, 10)), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform((val) => parseInt(val, 10)),
  
  // Email (optional, for future use)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // AWS S3 (optional, for file storage)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    if (error instanceof z.ZodError) {
      error.issues.forEach((issue) => {
        console.error(`  ${issue.path.join('.')}: ${issue.message}`);
      });
    }
    process.exit(1);
  }
};

export const apiConfig = parseEnv();

// Database configuration
export const databaseConfig = {
  url: apiConfig.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
};

// JWT configuration
export const jwtConfig = {
  secret: apiConfig.JWT_SECRET,
  expiresIn: apiConfig.JWT_EXPIRES_IN,
  refreshSecret: apiConfig.JWT_REFRESH_SECRET,
  refreshExpiresIn: apiConfig.JWT_REFRESH_EXPIRES_IN,
  algorithm: 'HS256' as const,
  issuer: 'chromavault-api',
  audience: 'chromavault-client',
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: apiConfig.RATE_LIMIT_WINDOW_MS,
  max: apiConfig.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(apiConfig.RATE_LIMIT_WINDOW_MS / 1000 / 60), // in minutes
  },
};

// File upload configuration
export const uploadConfig = {
  maxSize: apiConfig.UPLOAD_MAX_SIZE,
  allowedTypes: apiConfig.UPLOAD_ALLOWED_TYPES.split(','),
  destination: 'uploads/',
  imageProcessing: {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 85,
    formats: ['jpeg', 'png', 'webp'],
  },
};

// CORS configuration
export const corsConfig = {
  origin: apiConfig.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
};

// Socket.io configuration
export const socketConfig = {
  cors: corsConfig,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
};

// OpenAI configuration (if available)
export const aiConfig = apiConfig.OPENAI_API_KEY ? {
  apiKey: apiConfig.OPENAI_API_KEY,
  model: 'gpt-4-turbo-preview',
  maxTokens: 1000,
  temperature: 0.7,
} : null;

// Redis configuration (if available)
export const redisConfig = apiConfig.REDIS_URL ? {
  url: apiConfig.REDIS_URL,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  commandTimeout: 5000,
} : null;

// Validation schemas for common API operations
export const validationSchemas = {
  pagination: z.object({
    page: z.string().transform((val) => Math.max(1, parseInt(val, 10) || 1)),
    limit: z.string().transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 10))),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format'),
  
  uuid: z.string().uuid('Invalid UUID format'),
  
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
};

// API response formats
export const responseFormats = {
  success: <T>(data: T, message?: string, meta?: any) => ({
    success: true,
    message: message || 'Operation successful',
    data,
    meta,
    timestamp: new Date().toISOString(),
  }),
  
  error: (message: string, code?: string, details?: any) => ({
    success: false,
    message,
    error: {
      code: code || 'UNKNOWN_ERROR',
      details,
    },
    timestamp: new Date().toISOString(),
  }),
  
  paginated: <T>(data: T[], total: number, page: number, limit: number) => ({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
  }),
};

export default apiConfig;