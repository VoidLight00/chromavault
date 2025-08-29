/**
 * Upload Routes
 * File upload and image processing for color extraction
 */

import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prismaClient } from '../config/database';
import { responseFormats, uploadConfig } from '../config/api.config';
import { 
  validateRequest, 
  asyncHandler, 
  createError 
} from '../middleware/error-handler';
import { strictRateLimit } from '../middleware/rate-limit';
import { logger, logFileOperation } from '../utils/logger';

const router = Router();

// Ensure upload directory exists
const ensureUploadDir = async () => {
  const uploadDir = path.join(process.cwd(), uploadConfig.destination);
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  if (uploadConfig.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError.validation(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: uploadConfig.maxSize,
    files: 5, // Max 5 files at once
  },
  fileFilter,
});

// Color extraction function using sharp
const extractColorsFromImage = async (imageBuffer: Buffer, paletteSize: number = 5) => {
  try {
    // Resize image for faster processing
    const resizedBuffer = await sharp(imageBuffer)
      .resize(200, 200, { fit: 'inside' })
      .png()
      .toBuffer();

    // Get image statistics
    const { dominant, channels } = await sharp(resizedBuffer).stats();
    
    // Simple color extraction (in production, use a more sophisticated algorithm)
    const colors = [];
    
    // Add dominant color
    if (dominant) {
      const hex = rgbToHex(dominant.r, dominant.g, dominant.b);
      colors.push({
        hex,
        frequency: 1.0,
        name: await getColorName(hex),
      });
    }

    // Extract more colors using pixel sampling
    const { data } = await sharp(resizedBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixelColors = new Map<string, number>();
    
    // Sample every 10th pixel to avoid processing overhead
    for (let i = 0; i < data.length; i += 30) { // RGB = 3 bytes, so step by 30 for every 10th pixel
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Quantize colors to reduce noise
      const quantizedR = Math.floor(r / 32) * 32;
      const quantizedG = Math.floor(g / 32) * 32;
      const quantizedB = Math.floor(b / 32) * 32;
      
      const hex = rgbToHex(quantizedR, quantizedG, quantizedB);
      pixelColors.set(hex, (pixelColors.get(hex) || 0) + 1);
    }

    // Sort by frequency and take top colors
    const sortedColors = Array.from(pixelColors.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, paletteSize - 1); // -1 because we already have dominant

    const totalPixels = data.length / 3;
    
    for (const [hex, count] of sortedColors) {
      if (colors.length >= paletteSize) break;
      
      colors.push({
        hex,
        frequency: count / totalPixels,
        name: await getColorName(hex),
      });
    }

    return colors;
  } catch (error) {
    logger.error('Color extraction failed:', error);
    throw createError.internal('Failed to extract colors from image');
  }
};

// Helper functions
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

const getColorName = async (hex: string): Promise<string> => {
  // Simple color naming - in production, use a comprehensive color name database
  const colorNames: { [key: string]: string } = {
    '#FF0000': 'Red',
    '#00FF00': 'Green',
    '#0000FF': 'Blue',
    '#FFFF00': 'Yellow',
    '#FF00FF': 'Magenta',
    '#00FFFF': 'Cyan',
    '#000000': 'Black',
    '#FFFFFF': 'White',
    '#808080': 'Gray',
  };
  
  return colorNames[hex] || `Color ${hex}`;
};

// Process and save uploaded image
const processImage = async (
  file: Express.Multer.File,
  userId: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: string;
  } = {}
): Promise<{
  filename: string;
  originalName: string;
  size: number;
  width: number;
  height: number;
  url: string;
}> => {
  await ensureUploadDir();
  
  const {
    maxWidth = uploadConfig.imageProcessing.maxWidth,
    maxHeight = uploadConfig.imageProcessing.maxHeight,
    quality = uploadConfig.imageProcessing.quality,
    format = 'jpeg'
  } = options;

  // Generate unique filename
  const fileId = uuidv4();
  const filename = `${fileId}.${format}`;
  const filepath = path.join(process.cwd(), uploadConfig.destination, filename);

  // Process image
  let sharpInstance = sharp(file.buffer);
  
  // Get original dimensions
  const metadata = await sharpInstance.metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  // Resize if necessary
  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Apply format and quality
  if (format === 'jpeg') {
    sharpInstance = sharpInstance.jpeg({ quality });
  } else if (format === 'png') {
    sharpInstance = sharpInstance.png({ quality });
  } else if (format === 'webp') {
    sharpInstance = sharpInstance.webp({ quality });
  }

  // Save processed image
  const processedBuffer = await sharpInstance.toBuffer();
  await fs.writeFile(filepath, processedBuffer);

  // Get final dimensions
  const finalMetadata = await sharp(processedBuffer).metadata();

  logFileOperation('process', filename, processedBuffer.length, {
    userId,
    originalSize: file.size,
    finalSize: processedBuffer.length,
    dimensions: `${finalMetadata.width}x${finalMetadata.height}`,
  });

  return {
    filename,
    originalName: file.originalname,
    size: processedBuffer.length,
    width: finalMetadata.width || 0,
    height: finalMetadata.height || 0,
    url: `/uploads/${filename}`,
  };
};

// Validation schemas
const extractColorsSchema = z.object({
  body: z.object({
    paletteSize: z.number().int().min(3).max(20).default(5),
    createPalette: z.boolean().default(false),
    paletteName: z.string().min(1).max(100).optional(),
  }),
});

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload and process an image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *               maxWidth:
 *                 type: integer
 *                 description: Maximum width in pixels
 *                 default: 2048
 *               maxHeight:
 *                 type: integer
 *                 description: Maximum height in pixels
 *                 default: 2048
 *               quality:
 *                 type: integer
 *                 description: Image quality (1-100)
 *                 default: 85
 *               format:
 *                 type: string
 *                 enum: [jpeg, png, webp]
 *                 description: Output format
 *                 default: jpeg
 *     responses:
 *       200:
 *         description: Image uploaded and processed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       413:
 *         description: File too large
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/image',
  strictRateLimit(10, 300000), // 10 uploads per 5 minutes
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw createError.validation('No image file provided');
    }

    const { maxWidth, maxHeight, quality, format } = req.body;

    const processedImage = await processImage(req.file, req.user!.id, {
      maxWidth: maxWidth ? parseInt(maxWidth) : undefined,
      maxHeight: maxHeight ? parseInt(maxHeight) : undefined,
      quality: quality ? parseInt(quality) : undefined,
      format: format || 'jpeg',
    });

    res.json(responseFormats.success(processedImage, 'Image uploaded successfully'));
  })
);

/**
 * @swagger
 * /upload/extract-colors:
 *   post:
 *     summary: Extract colors from uploaded image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to extract colors from
 *               paletteSize:
 *                 type: integer
 *                 minimum: 3
 *                 maximum: 20
 *                 default: 5
 *                 description: Number of colors to extract
 *               createPalette:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to create a palette from extracted colors
 *               paletteName:
 *                 type: string
 *                 description: Name for the created palette (required if createPalette is true)
 *     responses:
 *       200:
 *         description: Colors extracted successfully
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
 *                         colors:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               hex:
 *                                 type: string
 *                               frequency:
 *                                 type: number
 *                               name:
 *                                 type: string
 *                         palette:
 *                           $ref: '#/components/schemas/Palette'
 */
router.post('/extract-colors',
  strictRateLimit(20, 300000), // 20 extractions per 5 minutes
  upload.single('image'),
  validateRequest(extractColorsSchema),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw createError.validation('No image file provided');
    }

    const { paletteSize, createPalette, paletteName } = req.body;

    if (createPalette && !paletteName) {
      throw createError.validation('Palette name is required when creating a palette');
    }

    // Extract colors from image
    const extractedColors = await extractColorsFromImage(req.file.buffer, paletteSize);

    let palette = null;

    // Create palette if requested
    if (createPalette) {
      const colors = extractedColors.map((color, index) => ({
        hex: color.hex,
        name: color.name,
        position: index,
      }));

      // Create palette using existing logic
      palette = await prismaClient.palette.create({
        data: {
          name: paletteName,
          description: `Extracted from ${req.file.originalname}`,
          slug: `${paletteName.toLowerCase().replace(/\s+/g, '-')}-${uuidv4().slice(0, 8)}`,
          isPublic: false,
          userId: req.user!.id,
        }
      });

      // Create colors
      const colorData = colors.map(color => {
        const rgb = hexToRgb(color.hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const lab = rgbToLab(rgb.r, rgb.g, rgb.b);

        return {
          hex: color.hex,
          rgb,
          hsl,
          lab,
          name: color.name,
          position: color.position,
          paletteId: palette.id,
        };
      });

      await prismaClient.color.createMany({
        data: colorData,
      });

      // Add extraction tag
      const extractionTag = await prismaClient.tag.upsert({
        where: { name: 'extracted' },
        create: {
          name: 'extracted',
          slug: 'extracted',
          description: 'Palette extracted from image',
        },
        update: {
          usageCount: { increment: 1 },
        },
      });

      await prismaClient.paletteTag.create({
        data: {
          paletteId: palette.id,
          tagId: extractionTag.id,
        },
      });

      // Create activity log
      await prismaClient.activity.create({
        data: {
          type: 'PALETTE_CREATED',
          userId: req.user!.id,
          paletteId: palette.id,
          metadata: {
            source: 'image_extraction',
            filename: req.file.originalname,
            colorCount: colors.length,
          },
        },
      });

      // Fetch complete palette
      palette = await prismaClient.palette.findUnique({
        where: { id: palette.id },
        include: {
          colors: { orderBy: { position: 'asc' } },
          tags: {
            include: {
              tag: { select: { name: true, slug: true } }
            }
          },
        }
      });
    }

    logFileOperation('extract', req.file.originalname, req.file.size, {
      userId: req.user!.id,
      colorsExtracted: extractedColors.length,
      paletteCreated: !!createPalette,
    });

    const result = {
      image: {
        originalName: req.file.originalname,
        size: req.file.size,
      },
      colors: extractedColors,
      palette,
    };

    res.json(responseFormats.success(result, 'Colors extracted successfully'));
  })
);

// Helper functions for color conversion
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

const rgbToLab = (r: number, g: number, b: number) => {
  // Simplified LAB conversion
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  
  return {
    l: Math.round(y * 100),
    a: Math.round((x - y) * 128),
    b: Math.round((y - z) * 128)
  };
};

/**
 * @swagger
 * /upload/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post('/avatar',
  strictRateLimit(5, 300000), // 5 avatar uploads per 5 minutes
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw createError.validation('No avatar file provided');
    }

    // Process avatar (square, smaller size)
    const processedAvatar = await processImage(req.file, req.user!.id, {
      maxWidth: 300,
      maxHeight: 300,
      quality: 90,
      format: 'jpeg',
    });

    // Update user avatar
    await prismaClient.user.update({
      where: { id: req.user!.id },
      data: { avatar: processedAvatar.url },
    });

    res.json(responseFormats.success(processedAvatar, 'Avatar uploaded successfully'));
  })
);

export default router;