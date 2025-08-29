/**
 * Database Configuration
 * Prisma client setup with error handling and connection management
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { apiConfig } from './api.config';

// Create Prisma client with logging configuration
const prismaClientSingleton = () => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: apiConfig.DATABASE_URL,
      },
    },
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event', 
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
    errorFormat: 'pretty',
  });

  // Set up event listeners for logging in development
  if (apiConfig.NODE_ENV === 'development') {
    prisma.$on('query' as never, (e: any) => {
      logger.debug(`Query: ${e.query}`);
      logger.debug(`Params: ${e.params}`);
      logger.debug(`Duration: ${e.duration}ms`);
    });
  }

  prisma.$on('error' as never, (e: any) => {
    logger.error(`Database error: ${e.message}`);
  });

  prisma.$on('info' as never, (e: any) => {
    logger.info(`Database info: ${e.message}`);
  });

  prisma.$on('warn' as never, (e: any) => {
    logger.warn(`Database warning: ${e.message}`);
  });

  return prisma;
};

// Global type for the Prisma client
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Use singleton pattern to prevent multiple instances in development
export const prismaClient = global.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prismaClient;
}

// Export functions for database operations
export const connectDatabase = async (): Promise<void> => {
  try {
    await prismaClient.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    // Don't exit process here, let the server decide
    logger.warn('Server will continue without database connection');
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prismaClient.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database:', error);
    throw error;
  }
};

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// Database utility functions
export const dbUtils = {
  // Generate unique slug
  generateUniqueSlug: async (model: string, baseSlug: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await (prismaClient as any)[model].findUnique({
        where: { slug },
        select: { id: true },
      });
      
      if (!existing) {
        return slug;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  },

  // Transaction helper with retry logic
  transaction: async <T>(fn: (prisma: any) => Promise<T>, maxRetries = 3): Promise<T> => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const result = await prismaClient.$transaction(async (tx) => {
          return await fn(tx);
        });
        return result;
      } catch (error: any) {
        retries++;
        
        if (error.code === 'P2034' && retries < maxRetries) {
          // Retry on transaction conflicts
          logger.warn(`Transaction conflict, retrying (${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 100 * retries));
          continue;
        }
        
        throw error;
      }
    }
    
    throw new Error('Transaction failed after maximum retries');
  },
};

// Pagination helper
export const paginate = async <T>(
  model: string,
  {
    page = 1,
    limit = 10,
    where = {},
    orderBy = {},
    include = {},
    select = {},
  }: {
    page?: number;
    limit?: number;
    where?: any;
    orderBy?: any;
    include?: any;
    select?: any;
  } = {}
): Promise<{
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> => {
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    (prismaClient as any)[model].findMany({
      skip,
      take: limit,
      where,
      orderBy,
      include: Object.keys(include).length > 0 ? include : undefined,
      select: Object.keys(select).length > 0 ? select : undefined,
    }),
    (prismaClient as any)[model].count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
};

// Add paginate function to prismaClient
declare module '@prisma/client' {
  interface PrismaClient {
    paginate: typeof paginate;
  }
}

(prismaClient as any).paginate = paginate;

// Try to connect on startup but don't fail if database is not available
connectDatabase().catch(() => {
  logger.warn('Database not available on startup, continuing without database');
});

export default prismaClient;