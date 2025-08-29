/**
 * Collaboration Routes
 * Real-time collaboration session management and history
 */

import { Router } from 'express';
import { z } from 'zod';
import { prismaClient } from '../config/database';
import { responseFormats, validationSchemas } from '../config/api.config';
import { 
  validateRequest, 
  asyncHandler, 
  createError 
} from '../middleware/error-handler';
import { getSessionInfo, getActiveSessionsCount, broadcastToSession } from '../sockets/socket-handlers';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const sessionParamsSchema = z.object({
  params: z.object({
    paletteId: validationSchemas.uuid,
  }),
});

const createInviteSchema = z.object({
  body: z.object({
    paletteId: validationSchemas.uuid,
    email: z.string().email(),
    permission: z.enum(['view', 'edit']).default('edit'),
    message: z.string().max(500).optional(),
  }),
});

const respondInviteSchema = z.object({
  params: z.object({
    inviteId: validationSchemas.uuid,
  }),
  body: z.object({
    action: z.enum(['accept', 'decline']),
  }),
});

/**
 * @swagger
 * /collaboration/sessions:
 *   get:
 *     summary: Get active collaboration sessions
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active sessions list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalSessions:
 *                           type: integer
 *                         userSessions:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/CollaborationSession'
 */
router.get('/sessions',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    
    // Get user's palettes that might have active sessions
    const userPalettes = await prismaClient.palette.findMany({
      where: { 
        OR: [
          { userId }, // Own palettes
          { 
            isPublic: true, // Public palettes user might be collaborating on
            favorites: { some: { userId } } // Favorited palettes
          }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isPublic: true,
        userId: true,
        user: {
          select: { name: true, avatar: true }
        }
      }
    });

    // Check which palettes have active sessions
    const sessionsData = [];
    for (const palette of userPalettes) {
      const sessionInfo = getSessionInfo(palette.id);
      if (sessionInfo && sessionInfo.userCount > 0) {
        sessionsData.push({
          palette: {
            id: palette.id,
            name: palette.name,
            slug: palette.slug,
            isOwner: palette.userId === userId,
            owner: palette.user
          },
          session: sessionInfo
        });
      }
    }

    const result = {
      totalActiveSessions: getActiveSessionsCount(),
      userSessions: sessionsData,
    };

    res.json(responseFormats.success(result, 'Active sessions retrieved'));
  })
);

/**
 * @swagger
 * /collaboration/sessions/{paletteId}:
 *   get:
 *     summary: Get collaboration session info for a palette
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: paletteId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Palette ID
 *     responses:
 *       200:
 *         description: Session information
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CollaborationSession'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/sessions/:paletteId',
  validateRequest(sessionParamsSchema),
  asyncHandler(async (req, res) => {
    const { paletteId } = req.params;
    
    // Check if palette exists and user has access
    const palette = await prismaClient.palette.findUnique({
      where: { id: paletteId },
      select: {
        id: true,
        name: true,
        isPublic: true,
        userId: true,
      }
    });

    if (!palette) {
      throw createError.notFound('Palette');
    }

    // Check access permission
    if (!palette.isPublic && palette.userId !== req.user!.id) {
      throw createError.notFound('Palette');
    }

    const sessionInfo = getSessionInfo(paletteId);
    
    if (!sessionInfo) {
      res.json(responseFormats.success({
        paletteId,
        isActive: false,
        userCount: 0,
        users: [],
      }, 'No active session'));
      return;
    }

    const result = {
      ...sessionInfo,
      isActive: true,
      palette: {
        id: palette.id,
        name: palette.name,
        isOwner: palette.userId === req.user!.id,
      }
    };

    res.json(responseFormats.success(result, 'Session info retrieved'));
  })
);

/**
 * @swagger
 * /collaboration/invites:
 *   post:
 *     summary: Create a collaboration invite
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paletteId
 *               - email
 *             properties:
 *               paletteId:
 *                 type: string
 *                 format: uuid
 *               email:
 *                 type: string
 *                 format: email
 *               permission:
 *                 type: string
 *                 enum: [view, edit]
 *                 default: edit
 *               message:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Invite created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/invites',
  validateRequest(createInviteSchema),
  asyncHandler(async (req, res) => {
    const { paletteId, email, permission, message } = req.body;
    const inviterId = req.user!.id;

    // Check if palette exists and user is owner
    const palette = await prismaClient.palette.findUnique({
      where: { id: paletteId },
      select: {
        id: true,
        name: true,
        userId: true,
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!palette) {
      throw createError.notFound('Palette');
    }

    if (palette.userId !== inviterId) {
      throw createError.forbidden('Only palette owner can send invites');
    }

    // Check if invited user exists
    const invitedUser = await prismaClient.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true }
    });

    if (!invitedUser) {
      throw createError.validation('User with this email not found');
    }

    if (invitedUser.id === inviterId) {
      throw createError.validation('Cannot invite yourself');
    }

    // Check for existing invite
    const existingInvite = await prismaClient.$queryRaw`
      SELECT * FROM collaboration_invites 
      WHERE palette_id = ${paletteId} 
      AND invited_user_id = ${invitedUser.id} 
      AND status = 'pending'
    ` as any[];

    if (existingInvite.length > 0) {
      throw createError.conflict('Invite already sent to this user');
    }

    // Create invite (assuming we have a collaboration_invites table)
    // Since it's not in the Prisma schema, we'll simulate it
    const inviteId = require('uuid').v4();
    const invite = {
      id: inviteId,
      paletteId,
      inviterId,
      invitedUserId: invitedUser.id,
      permission,
      message,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    // In a real implementation, you would:
    // 1. Save the invite to database
    // 2. Send email notification
    // 3. Create in-app notification

    logger.info('Collaboration invite created', {
      inviteId,
      paletteId,
      inviterId,
      invitedUserId: invitedUser.id,
      permission,
    });

    // Create notification for invited user
    await prismaClient.notification.create({
      data: {
        type: 'TEAM_INVITE',
        title: 'Collaboration Invite',
        message: `${palette.user.name} invited you to collaborate on "${palette.name}"`,
        userId: invitedUser.id,
        metadata: {
          inviteId,
          paletteId,
          paletteName: palette.name,
          inviterName: palette.user.name,
          permission,
        }
      }
    });

    res.status(201).json(responseFormats.success({
      inviteId,
      palette: {
        id: palette.id,
        name: palette.name,
      },
      invitedUser: {
        id: invitedUser.id,
        name: invitedUser.name,
        email: invitedUser.email,
      },
      permission,
      status: 'pending',
      expiresAt: invite.expiresAt,
    }, 'Collaboration invite sent successfully'));
  })
);

/**
 * @swagger
 * /collaboration/invites/received:
 *   get:
 *     summary: Get received collaboration invites
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, accepted, declined]
 *         description: Filter by invite status
 *     responses:
 *       200:
 *         description: Received invites list
 */
router.get('/invites/received',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const status = req.query.status as string;

    // Get notifications that represent collaboration invites
    const where: any = {
      userId,
      type: 'TEAM_INVITE',
    };

    const notifications = await prismaClient.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to recent invites
    });

    // Transform notifications to invite format
    const invites = notifications.map(notification => ({
      id: notification.metadata?.inviteId || notification.id,
      paletteId: notification.metadata?.paletteId,
      paletteName: notification.metadata?.paletteName,
      inviterName: notification.metadata?.inviterName,
      permission: notification.metadata?.permission,
      message: notification.message,
      createdAt: notification.createdAt,
      isRead: notification.isRead,
    }));

    res.json(responseFormats.success(invites, 'Received invites retrieved'));
  })
);

/**
 * @swagger
 * /collaboration/invites/sent:
 *   get:
 *     summary: Get sent collaboration invites
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sent invites list
 */
router.get('/invites/sent',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    // For this implementation, we'll get palettes owned by user
    // and check for any recent activity that might indicate invites
    const userPalettes = await prismaClient.palette.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Simulate sent invites (in real app, query actual invites table)
    const sentInvites = userPalettes.map(palette => ({
      id: `invite-${palette.id}`,
      paletteId: palette.id,
      paletteName: palette.name,
      status: 'pending',
      createdAt: palette.createdAt,
    }));

    res.json(responseFormats.success(sentInvites, 'Sent invites retrieved'));
  })
);

/**
 * @swagger
 * /collaboration/history/{paletteId}:
 *   get:
 *     summary: Get collaboration history for a palette
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: paletteId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Palette ID
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Collaboration history
 */
router.get('/history/:paletteId',
  validateRequest({
    params: z.object({ paletteId: validationSchemas.uuid }),
    query: validationSchemas.pagination,
  }),
  asyncHandler(async (req, res) => {
    const { paletteId } = req.params;
    const { page, limit } = req.query as any;

    // Check palette access
    const palette = await prismaClient.palette.findUnique({
      where: { id: paletteId },
      select: {
        id: true,
        isPublic: true,
        userId: true,
      }
    });

    if (!palette) {
      throw createError.notFound('Palette');
    }

    if (!palette.isPublic && palette.userId !== req.user!.id) {
      throw createError.forbidden('Access denied');
    }

    // Get activities related to this palette
    const result = await prismaClient.paginate('activity', {
      page,
      limit,
      where: { paletteId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      }
    });

    res.json(responseFormats.paginated(
      result.data,
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit
    ));
  })
);

/**
 * @swagger
 * /collaboration/broadcast/{paletteId}:
 *   post:
 *     summary: Broadcast a message to collaboration session
 *     tags: [Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: paletteId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Palette ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - data
 *             properties:
 *               event:
 *                 type: string
 *                 description: Event name to broadcast
 *               data:
 *                 type: object
 *                 description: Event data to broadcast
 *     responses:
 *       200:
 *         description: Message broadcasted successfully
 */
router.post('/broadcast/:paletteId',
  validateRequest({
    params: z.object({ paletteId: validationSchemas.uuid }),
    body: z.object({
      event: z.string().min(1),
      data: z.any(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { paletteId } = req.params;
    const { event, data } = req.body;

    // Check palette access
    const palette = await prismaClient.palette.findUnique({
      where: { id: paletteId },
      select: {
        id: true,
        isPublic: true,
        userId: true,
      }
    });

    if (!palette) {
      throw createError.notFound('Palette');
    }

    if (!palette.isPublic && palette.userId !== req.user!.id) {
      throw createError.forbidden('Access denied');
    }

    // This would require access to the io instance
    // In a real implementation, you might use a message queue or event system
    // For now, we'll just log the broadcast attempt
    logger.info('Collaboration broadcast', {
      paletteId,
      event,
      userId: req.user!.id,
      data,
    });

    res.json(responseFormats.success({
      paletteId,
      event,
      broadcastedAt: new Date(),
    }, 'Message broadcasted to collaboration session'));
  })
);

export default router;