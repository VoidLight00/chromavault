/**
 * Simple Palette Routes - Basic implementation for testing
 */

import { Router, Request, Response } from 'express';
import { prismaClient } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/v1/palettes - Get all public palettes
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const palettes = await prismaClient.palette.findMany({
      where: {
        isPublic: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        colors: {
          orderBy: { position: 'asc' },
        },
        tags: {
          include: {
            tag: {
              select: { name: true, slug: true },
            },
          },
        },
        _count: {
          select: {
            favorites: true,
            comments: true,
            ratings: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    res.json({
      success: true,
      data: palettes,
      message: 'Palettes retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching palettes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch palettes',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// GET /api/v1/palettes/featured - Get featured palettes
router.get('/featured', async (req: Request, res: Response): Promise<void> => {
  try {
    const palettes = await prismaClient.palette.findMany({
      where: {
        isPublic: true,
        isFeatured: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        colors: {
          orderBy: { position: 'asc' },
        },
        tags: {
          include: {
            tag: {
              select: { name: true, slug: true },
            },
          },
        },
        _count: {
          select: {
            favorites: true,
            comments: true,
            ratings: true,
          },
        },
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: 10,
    });

    res.json({
      success: true,
      data: palettes,
      message: 'Featured palettes retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching featured palettes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured palettes',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// GET /api/v1/palettes/:id - Get a specific palette
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const palette = await prismaClient.palette.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        colors: {
          orderBy: { position: 'asc' },
        },
        tags: {
          include: {
            tag: {
              select: { name: true, slug: true },
            },
          },
        },
        _count: {
          select: {
            favorites: true,
            comments: true,
            ratings: true,
          },
        },
      },
    });

    if (!palette) {
      res.status(404).json({
        success: false,
        message: 'Palette not found',
      });
      return;
    }

    // Check if palette is public
    if (!palette.isPublic && (!req.user || palette.userId !== req.user.id)) {
      res.status(404).json({
        success: false,
        message: 'Palette not found',
      });
      return;
    }

    // Increment view count if not the owner
    if (!req.user || palette.userId !== req.user.id) {
      await prismaClient.palette.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    res.json({
      success: true,
      data: palette,
      message: 'Palette retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching palette:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch palette',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

export default router;