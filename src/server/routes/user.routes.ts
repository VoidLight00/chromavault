/**
 * User Routes
 * User profile management and social features
 */

import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prismaClient } from '../config/database';
import { responseFormats, validationSchemas } from '../config/api.config';
import { 
  validateRequest, 
  asyncHandler, 
  createError 
} from '../middleware/error-handler';
import { requireOwnershipOrAdmin, requireRole } from '../middleware/auth';
import { strictRateLimit } from '../middleware/rate-limit';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  params: z.object({
    id: validationSchemas.uuid,
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional(),
    avatar: z.string().url().optional(),
  }),
});

const getUsersSchema = z.object({
  query: validationSchemas.pagination.extend({
    search: z.string().optional(),
    role: z.enum(['USER', 'PRO', 'ADMIN', 'MODERATOR']).optional(),
    sortBy: z.enum(['name', 'createdAt', 'lastLogin']).default('createdAt'),
  }),
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get users list (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - name: role
 *         in: query
 *         schema:
 *           type: string
 *           enum: [USER, PRO, ADMIN, MODERATOR]
 *         description: Filter by user role
 *       - $ref: '#/components/parameters/SortParam'
 *       - $ref: '#/components/parameters/OrderParam'
 *     responses:
 *       200:
 *         description: Users list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/',
  requireRole(['ADMIN', 'MODERATOR']),
  validateRequest(getUsersSchema),
  asyncHandler(async (req, res) => {
    const { page, limit, search, role, sortBy, sortOrder } = req.query as any;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const select = {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      isVerified: true,
      createdAt: true,
      lastLogin: true,
      _count: {
        select: {
          palettes: true,
          favorites: true,
          comments: true,
        }
      }
    };

    const result = await prismaClient.paginate('user', {
      page,
      limit,
      where,
      orderBy,
      select,
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
 * /users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id',
  validateRequest({ params: z.object({ id: validationSchemas.uuid }) }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prismaClient.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: req.user?.id === id || req.user?.role === 'ADMIN', // Email only visible to self or admin
        name: true,
        avatar: true,
        bio: true,
        role: req.user?.role === 'ADMIN', // Role only visible to admin
        isVerified: true,
        createdAt: true,
        lastLogin: req.user?.id === id || req.user?.role === 'ADMIN',
        _count: {
          select: {
            palettes: { where: { isPublic: true } },
            favorites: true,
            comments: true,
          }
        }
      }
    });

    if (!user) {
      throw createError.notFound('User');
    }

    res.json(responseFormats.success(user, 'User profile retrieved'));
  })
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               avatar:
 *                 type: string
 *                 format: url
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id',
  validateRequest(updateProfileSchema),
  requireOwnershipOrAdmin(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, bio, avatar } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await prismaClient.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.json(responseFormats.success(user, 'Profile updated successfully'));
  })
);

/**
 * @swagger
 * /users/{id}/palettes:
 *   get:
 *     summary: Get user's palettes
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: isPublic
 *         in: query
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by visibility (only works for own palettes)
 *     responses:
 *       200:
 *         description: User's palettes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/:id/palettes',
  validateRequest({
    params: z.object({ id: validationSchemas.uuid }),
    query: validationSchemas.pagination.extend({
      isPublic: z.enum(['true', 'false']).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit, isPublic } = req.query as any;

    // Check if user exists
    const userExists = await prismaClient.user.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!userExists) {
      throw createError.notFound('User');
    }

    const where: any = { userId: id };

    // Visibility logic
    const canSeePrivate = req.user?.id === id || req.user?.role === 'ADMIN';
    if (!canSeePrivate) {
      where.isPublic = true;
    } else if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }

    const include = {
      colors: {
        orderBy: { position: 'asc' },
        take: 5, // Only first 5 colors for preview
      },
      tags: {
        include: {
          tag: {
            select: { name: true, slug: true }
          }
        },
        take: 3, // Only first 3 tags
      },
      _count: {
        select: {
          favorites: true,
          comments: true,
        }
      }
    };

    const result = await prismaClient.paginate('palette', {
      page,
      limit,
      where,
      orderBy: { createdAt: 'desc' },
      include,
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
 * /users/{id}/favorites:
 *   get:
 *     summary: Get user's favorite palettes
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: User's favorite palettes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/:id/favorites',
  validateRequest({
    params: z.object({ id: validationSchemas.uuid }),
    query: validationSchemas.pagination,
  }),
  requireOwnershipOrAdmin(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query as any;

    const where = {
      userId: id,
      palette: {
        isPublic: true, // Only public palettes in favorites
      }
    };

    const include = {
      palette: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          },
          colors: {
            orderBy: { position: 'asc' },
            take: 5,
          },
          tags: {
            include: {
              tag: {
                select: { name: true, slug: true }
              }
            },
            take: 3,
          },
          _count: {
            select: {
              favorites: true,
              comments: true,
            }
          }
        }
      }
    };

    const result = await prismaClient.paginate('favorite', {
      page,
      limit,
      where,
      orderBy: { createdAt: 'desc' },
      include,
    });

    // Transform to return just the palettes
    const palettes = result.data.map((fav: any) => fav.palette);

    res.json(responseFormats.paginated(
      palettes,
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit
    ));
  })
);

/**
 * @swagger
 * /users/{id}/collections:
 *   get:
 *     summary: Get user's collections
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: User's collections
 */
router.get('/:id/collections',
  validateRequest({
    params: z.object({ id: validationSchemas.uuid }),
    query: validationSchemas.pagination,
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query as any;

    const where: any = { userId: id };

    // Privacy: only show public collections unless it's the user's own or admin
    const canSeePrivate = req.user?.id === id || req.user?.role === 'ADMIN';
    if (!canSeePrivate) {
      where.isPublic = true;
    }

    const include = {
      palettes: {
        include: {
          palette: {
            include: {
              colors: {
                orderBy: { position: 'asc' },
                take: 3, // Just a preview
              }
            }
          }
        },
        orderBy: { position: 'asc' },
        take: 5, // Preview of first 5 palettes
      },
      _count: {
        select: { palettes: true }
      }
    };

    const result = await prismaClient.paginate('collection', {
      page,
      limit,
      where,
      orderBy: { createdAt: 'desc' },
      include,
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
 * /users/{id}/activities:
 *   get:
 *     summary: Get user's activity history
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by activity type
 *     responses:
 *       200:
 *         description: User's activities
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/:id/activities',
  validateRequest({
    params: z.object({ id: validationSchemas.uuid }),
    query: validationSchemas.pagination.extend({
      type: z.string().optional(),
    }),
  }),
  requireOwnershipOrAdmin(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit, type } = req.query as any;

    const where: any = { userId: id };
    if (type) where.type = type;

    const include = {
      palette: {
        select: {
          id: true,
          name: true,
          slug: true,
          colors: {
            take: 3,
            orderBy: { position: 'asc' },
            select: { hex: true }
          }
        }
      }
    };

    const result = await prismaClient.paginate('activity', {
      page,
      limit,
      where,
      orderBy: { createdAt: 'desc' },
      include,
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
 * /users/{id}/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User statistics
 */
router.get('/:id/stats',
  validateRequest({
    params: z.object({ id: validationSchemas.uuid }),
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user exists
    const user = await prismaClient.user.findUnique({
      where: { id },
      select: { id: true, createdAt: true }
    });

    if (!user) {
      throw createError.notFound('User');
    }

    // Get various counts
    const [
      totalPalettes,
      publicPalettes,
      totalFavorites,
      totalComments,
      totalViews,
      totalDownloads
    ] = await Promise.all([
      prismaClient.palette.count({ where: { userId: id } }),
      prismaClient.palette.count({ where: { userId: id, isPublic: true } }),
      prismaClient.favorite.count({ where: { userId: id } }),
      prismaClient.comment.count({ where: { userId: id } }),
      prismaClient.palette.aggregate({
        where: { userId: id },
        _sum: { viewCount: true }
      }),
      prismaClient.palette.aggregate({
        where: { userId: id },
        _sum: { downloadCount: true }
      })
    ]);

    // Get favorite received (palettes favorited by others)
    const favoritesReceived = await prismaClient.favorite.count({
      where: {
        palette: { userId: id }
      }
    });

    const stats = {
      user: {
        joinedDate: user.createdAt,
        daysSinceJoined: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      },
      palettes: {
        total: totalPalettes,
        public: publicPalettes,
        private: totalPalettes - publicPalettes,
      },
      engagement: {
        totalViews: totalViews._sum.viewCount || 0,
        totalDownloads: totalDownloads._sum.downloadCount || 0,
        favoritesGiven: totalFavorites,
        favoritesReceived,
        commentsPosted: totalComments,
      },
      averages: {
        viewsPerPalette: totalPalettes > 0 ? Math.round((totalViews._sum.viewCount || 0) / totalPalettes) : 0,
        downloadsPerPalette: totalPalettes > 0 ? Math.round((totalDownloads._sum.downloadCount || 0) / totalPalettes) : 0,
      }
    };

    res.json(responseFormats.success(stats, 'User statistics retrieved'));
  })
);

export default router;