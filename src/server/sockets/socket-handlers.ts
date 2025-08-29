/**
 * Socket.io Handlers
 * Real-time collaboration features for ChromaVault
 */

import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prismaClient } from '../config/database';
import { jwtConfig } from '../config/api.config';
import { logger, logSocket } from '../utils/logger';

// Extended socket interface with user information
interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

// Active collaboration sessions
interface CollaborationSession {
  paletteId: string;
  users: Map<string, {
    socketId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    cursor: { x: number; y: number };
    lastActivity: Date;
  }>;
  operations: Array<{
    id: string;
    type: string;
    data: any;
    userId: string;
    timestamp: Date;
  }>;
}

const activeSessions = new Map<string, CollaborationSession>();

// Validation schemas
const joinRoomSchema = z.object({
  paletteId: z.string().uuid(),
});

const cursorMoveSchema = z.object({
  paletteId: z.string().uuid(),
  x: z.number(),
  y: z.number(),
});

const colorChangeSchema = z.object({
  paletteId: z.string().uuid(),
  colorId: z.string().uuid().optional(),
  position: z.number().int().min(0),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  operationId: z.string().uuid(),
});

const paletteOperationSchema = z.object({
  paletteId: z.string().uuid(),
  operation: z.enum(['add_color', 'remove_color', 'reorder_color', 'update_name', 'update_description']),
  data: z.any(),
  operationId: z.string().uuid(),
});

// Authentication middleware for sockets
const authenticateSocket = async (socket: AuthenticatedSocket, next: Function) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    }) as any;

    // Get user from database
    const user = await prismaClient.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isVerified: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || !user.isVerified) {
      return next(new Error('Invalid authentication'));
    }

    socket.userId = user.id;
    socket.user = {
      id: user.id,
      name: user.name || 'Anonymous',
      email: user.email,
      avatar: user.avatar || undefined,
    };
    
    logSocket('User authenticated', socket.id, user.id, { email: user.email });
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

// Check if user has access to palette
const checkPaletteAccess = async (paletteId: string, userId: string): Promise<boolean> => {
  const palette = await prismaClient.palette.findUnique({
    where: { id: paletteId },
    select: {
      id: true,
      isPublic: true,
      userId: true,
    },
  });

  if (!palette) return false;
  
  // Owner can always access
  if (palette.userId === userId) return true;
  
  // Public palettes are accessible to authenticated users
  return palette.isPublic;
};

// Get or create collaboration session
const getOrCreateSession = (paletteId: string): CollaborationSession => {
  if (!activeSessions.has(paletteId)) {
    activeSessions.set(paletteId, {
      paletteId,
      users: new Map(),
      operations: [],
    });
  }
  return activeSessions.get(paletteId)!;
};

// Clean up inactive sessions periodically
setInterval(() => {
  const now = new Date();
  const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

  activeSessions.forEach((session, paletteId) => {
    // Remove inactive users
    session.users.forEach((user, userId) => {
      if (now.getTime() - user.lastActivity.getTime() > inactiveThreshold) {
        session.users.delete(userId);
        logSocket('User removed from session due to inactivity', user.socketId, userId);
      }
    });

    // Remove empty sessions
    if (session.users.size === 0) {
      activeSessions.delete(paletteId);
      logSocket('Collaboration session closed', '', '', { paletteId });
    }
  });
}, 5 * 60 * 1000); // Run cleanup every 5 minutes

// Main socket handler setup
export const setupSocketHandlers = (io: SocketServer): void => {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket: AuthenticatedSocket) => {
    logSocket('User connected', socket.id, socket.userId);

    // Join palette collaboration room
    socket.on('join-palette', async (data) => {
      try {
        const { paletteId } = joinRoomSchema.parse(data);
        
        // Check access permission
        const hasAccess = await checkPaletteAccess(paletteId, socket.userId!);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this palette' });
          return;
        }

        // Join socket room
        await socket.join(`palette:${paletteId}`);
        
        // Get or create session
        const session = getOrCreateSession(paletteId);
        
        // Add user to session
        session.users.set(socket.userId!, {
          socketId: socket.id,
          userId: socket.userId!,
          userName: socket.user!.name || 'Anonymous',
          userAvatar: socket.user!.avatar,
          cursor: { x: 0, y: 0 },
          lastActivity: new Date(),
        });

        // Notify other users
        socket.to(`palette:${paletteId}`).emit('user-joined', {
          userId: socket.userId,
          userName: socket.user!.name,
          userAvatar: socket.user!.avatar,
        });

        // Send current active users to newly joined user
        const activeUsers = Array.from(session.users.values()).map(user => ({
          userId: user.userId,
          userName: user.userName,
          userAvatar: user.userAvatar,
          cursor: user.cursor,
        }));

        socket.emit('active-users', activeUsers);

        // Send recent operations to sync state
        const recentOperations = session.operations.slice(-50); // Last 50 operations
        socket.emit('sync-operations', recentOperations);

        logSocket('User joined palette', socket.id, socket.userId, { paletteId });
        
      } catch (error) {
        logger.error('Error joining palette:', error);
        socket.emit('error', { message: 'Failed to join palette collaboration' });
      }
    });

    // Leave palette collaboration room
    socket.on('leave-palette', (data) => {
      try {
        const { paletteId } = joinRoomSchema.parse(data);
        
        socket.leave(`palette:${paletteId}`);
        
        const session = activeSessions.get(paletteId);
        if (session) {
          session.users.delete(socket.userId!);
          
          // Notify other users
          socket.to(`palette:${paletteId}`).emit('user-left', {
            userId: socket.userId,
          });
        }

        logSocket('User left palette', socket.id, socket.userId, { paletteId });
        
      } catch (error) {
        logger.error('Error leaving palette:', error);
      }
    });

    // Handle cursor movement
    socket.on('cursor-move', (data) => {
      try {
        const { paletteId, x, y } = cursorMoveSchema.parse(data);
        
        const session = activeSessions.get(paletteId);
        if (session && session.users.has(socket.userId!)) {
          // Update user's cursor position
          const user = session.users.get(socket.userId!)!;
          user.cursor = { x, y };
          user.lastActivity = new Date();
          
          // Broadcast to other users in the room
          socket.to(`palette:${paletteId}`).emit('cursor-update', {
            userId: socket.userId,
            x,
            y,
          });
        }
        
      } catch (error) {
        logger.error('Error handling cursor move:', error);
      }
    });

    // Handle color changes
    socket.on('color-change', async (data) => {
      try {
        const { paletteId, colorId, position, hex, operationId } = colorChangeSchema.parse(data);
        
        // Check access
        const hasAccess = await checkPaletteAccess(paletteId, socket.userId!);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        const session = getOrCreateSession(paletteId);
        
        // Add operation to session history
        const operation = {
          id: operationId,
          type: 'color-change',
          data: { colorId, position, hex },
          userId: socket.userId!,
          timestamp: new Date(),
        };
        
        session.operations.push(operation);
        
        // Keep only last 100 operations
        if (session.operations.length > 100) {
          session.operations = session.operations.slice(-100);
        }

        // Update user's last activity
        if (session.users.has(socket.userId!)) {
          session.users.get(socket.userId!)!.lastActivity = new Date();
        }

        // Broadcast to other users
        socket.to(`palette:${paletteId}`).emit('color-changed', {
          operationId,
          userId: socket.userId,
          userName: socket.user!.name,
          colorId,
          position,
          hex,
          timestamp: operation.timestamp,
        });

        // Optionally persist to database (debounced)
        // This could be implemented with a queue system for better performance
        
        logSocket('Color changed', socket.id, socket.userId, { paletteId, position, hex });
        
      } catch (error) {
        logger.error('Error handling color change:', error);
        socket.emit('error', { message: 'Failed to process color change' });
      }
    });

    // Handle palette operations (add/remove colors, etc.)
    socket.on('palette-operation', async (data) => {
      try {
        const { paletteId, operation, data: operationData, operationId } = paletteOperationSchema.parse(data);
        
        // Check access
        const hasAccess = await checkPaletteAccess(paletteId, socket.userId!);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        const session = getOrCreateSession(paletteId);
        
        // Add operation to session history
        const op = {
          id: operationId,
          type: operation,
          data: operationData,
          userId: socket.userId!,
          timestamp: new Date(),
        };
        
        session.operations.push(op);
        
        // Keep only last 100 operations
        if (session.operations.length > 100) {
          session.operations = session.operations.slice(-100);
        }

        // Update user's last activity
        if (session.users.has(socket.userId!)) {
          session.users.get(socket.userId!)!.lastActivity = new Date();
        }

        // Broadcast to other users
        socket.to(`palette:${paletteId}`).emit('palette-operation', {
          operationId,
          userId: socket.userId,
          userName: socket.user!.name,
          operation,
          data: operationData,
          timestamp: op.timestamp,
        });

        logSocket('Palette operation', socket.id, socket.userId, { paletteId, operation });
        
      } catch (error) {
        logger.error('Error handling palette operation:', error);
        socket.emit('error', { message: 'Failed to process palette operation' });
      }
    });

    // Handle chat messages (for collaboration)
    socket.on('chat-message', async (data) => {
      try {
        const messageSchema = z.object({
          paletteId: z.string().uuid(),
          message: z.string().min(1).max(500),
        });
        
        const { paletteId, message } = messageSchema.parse(data);
        
        // Check access
        const hasAccess = await checkPaletteAccess(paletteId, socket.userId!);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Broadcast message to room
        io.to(`palette:${paletteId}`).emit('chat-message', {
          userId: socket.userId,
          userName: socket.user!.name,
          userAvatar: socket.user!.avatar,
          message,
          timestamp: new Date(),
        });

        logSocket('Chat message', socket.id, socket.userId, { paletteId });
        
      } catch (error) {
        logger.error('Error handling chat message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      try {
        const { paletteId } = joinRoomSchema.parse(data);
        
        socket.to(`palette:${paletteId}`).emit('user-typing', {
          userId: socket.userId,
          userName: socket.user!.name,
        });
        
      } catch (error) {
        logger.error('Error handling typing start:', error);
      }
    });

    socket.on('typing-stop', (data) => {
      try {
        const { paletteId } = joinRoomSchema.parse(data);
        
        socket.to(`palette:${paletteId}`).emit('user-stopped-typing', {
          userId: socket.userId,
        });
        
      } catch (error) {
        logger.error('Error handling typing stop:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logSocket('User disconnected', socket.id, socket.userId, { reason });
      
      // Remove user from all sessions
      activeSessions.forEach((session, paletteId) => {
        if (session.users.has(socket.userId!)) {
          session.users.delete(socket.userId!);
          
          // Notify other users
          socket.to(`palette:${paletteId}`).emit('user-left', {
            userId: socket.userId,
          });
        }
      });
    });

    // Heartbeat for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Get session info
    socket.on('get-session-info', (data) => {
      try {
        const { paletteId } = joinRoomSchema.parse(data);
        
        const session = activeSessions.get(paletteId);
        if (session) {
          const activeUsers = Array.from(session.users.values()).map(user => ({
            userId: user.userId,
            userName: user.userName,
            userAvatar: user.userAvatar,
            cursor: user.cursor,
            lastActivity: user.lastActivity,
          }));

          socket.emit('session-info', {
            paletteId,
            activeUsers,
            operationCount: session.operations.length,
          });
        } else {
          socket.emit('session-info', {
            paletteId,
            activeUsers: [],
            operationCount: 0,
          });
        }
        
      } catch (error) {
        logger.error('Error getting session info:', error);
      }
    });
  });

  // Log server startup
  logger.info('Socket.io handlers initialized');
};

// Export session management functions for external use
export const getActiveSessionsCount = (): number => {
  return activeSessions.size;
};

export const getSessionInfo = (paletteId: string) => {
  const session = activeSessions.get(paletteId);
  if (!session) return null;
  
  return {
    paletteId,
    userCount: session.users.size,
    operationCount: session.operations.length,
    users: Array.from(session.users.values()).map(user => ({
      userId: user.userId,
      userName: user.userName,
      lastActivity: user.lastActivity,
    })),
  };
};

export const broadcastToSession = (paletteId: string, event: string, data: any, io: SocketServer) => {
  io.to(`palette:${paletteId}`).emit(event, data);
};

export default setupSocketHandlers;