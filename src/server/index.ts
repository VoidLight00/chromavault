/**
 * ChromaVault Backend API Server
 * Express.js with TypeScript, Socket.io, and comprehensive API endpoints
 */

import 'dotenv/config'; // Load environment variables
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
// import swaggerUi from 'swagger-ui-express';
// import swaggerJSDoc from 'swagger-jsdoc';

// Import configurations and middleware
import { apiConfig } from './config/api.config';
import { prismaClient } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { 
  fixPathToRegexpParams, 
  enhanceResponse 
} from './middleware/route-compatibility';

// Import route handlers
import authRoutes from './routes/auth.routes';
import simplePaletteRoutes from './routes/simple-palette.routes';
// import paletteRoutes from './routes/palette.routes';
// import userRoutes from './routes/user.routes';
// import colorRoutes from './routes/color.routes';
// import collaborationRoutes from './routes/collaboration.routes';
// import uploadRoutes from './routes/upload.routes';
// import adminRoutes from './routes/admin.routes';

// Import socket handlers
import { setupSocketHandlers } from './sockets/socket-handlers';

// Import Swagger configuration
// import { swaggerOptions } from './config/swagger.config';

class ChromaVaultServer {
  private app: express.Application;
  private server: http.Server;
  private io: SocketServer;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketServer(this.server, {
      cors: {
        origin: apiConfig.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSocketHandlers();
    this.initializeErrorHandling();
    this.initializeSwagger();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: apiConfig.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Express 5.x compatibility middleware
    this.app.use(fixPathToRegexpParams);
    this.app.use(enhanceResponse);

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    }));

    // Rate limiting
    this.app.use(rateLimitMiddleware);

    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
      });
    });
  }

  private initializeRoutes(): void {
    const apiV1 = express.Router();

    // Public routes
    apiV1.use('/auth', authRoutes);
    
    // Protected routes (require authentication)
    apiV1.use('/palettes', optionalAuthMiddleware, simplePaletteRoutes);
    // apiV1.use('/users', authMiddleware, userRoutes);
    // apiV1.use('/colors', authMiddleware, colorRoutes);
    // apiV1.use('/collaboration', authMiddleware, collaborationRoutes);
    // apiV1.use('/upload', authMiddleware, uploadRoutes);
    
    // Admin routes (commented out until implemented)
    // apiV1.use('/admin', authMiddleware, adminRoutes);

    // Mount API routes
    this.app.use('/api/v1', apiV1);

    // 404 handler for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
      });
    });
  }

  private initializeSocketHandlers(): void {
    setupSocketHandlers(this.io);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);

    // Graceful shutdown
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception thrown:', error);
      process.exit(1);
    });
  }

  private initializeSwagger(): void {
    // Temporarily disable Swagger to focus on getting the server running
    // TODO: Fix type issues with swagger-ui-express
    logger.info('Swagger documentation temporarily disabled');
    
    // const specs = swaggerJSDoc(swaggerOptions);
    // this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Close server
    this.server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close database connection
        await prismaClient.$disconnect();
        logger.info('Database connection closed');

        // Close socket.io server
        this.io.close(() => {
          logger.info('Socket.io server closed');
          process.exit(0);
        });
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  }

  public start(): void {
    const port = apiConfig.PORT;
    
    this.server.listen(port, () => {
      logger.info(`🚀 ChromaVault API server running on port ${port}`);
      logger.info(`📚 API Documentation: http://localhost:${port}/api/docs`);
      logger.info(`🏥 Health Check: http://localhost:${port}/health`);
      logger.info(`🌐 Environment: ${apiConfig.NODE_ENV}`);
    });
  }
}

// Start server if this file is executed directly
if (require.main === module) {
  const server = new ChromaVaultServer();
  server.start();
}

export default ChromaVaultServer;