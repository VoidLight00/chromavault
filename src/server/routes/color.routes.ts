/**
 * Color Analysis Routes
 * AI-powered color analysis and processing endpoints
 */

import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { prismaClient } from '../config/database';
import { responseFormats, validationSchemas, aiConfig } from '../config/api.config';
import { 
  validateRequest, 
  asyncHandler, 
  createError 
} from '../middleware/error-handler';
import { strictRateLimit } from '../middleware/rate-limit';
import { logger } from '../utils/logger';

const router = Router();

// Initialize OpenAI client if available
const openai = aiConfig ? new OpenAI({ apiKey: aiConfig.apiKey }) : null;

// Color utility functions
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
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

const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

// Validation schemas
const analyzeColorSchema = z.object({
  body: z.object({
    color: validationSchemas.colorHex,
    context: z.string().max(200).optional(),
  }),
});

const analyzePaletteSchema = z.object({
  body: z.object({
    colors: z.array(validationSchemas.colorHex).min(2).max(20),
    context: z.string().max(200).optional(),
  }),
});

const generateHarmonySchema = z.object({
  body: z.object({
    baseColor: validationSchemas.colorHex,
    harmonyType: z.enum(['complementary', 'analogous', 'triadic', 'tetradic', 'monochromatic']),
    count: z.number().int().min(2).max(10).default(5),
  }),
});

const extractColorsSchema = z.object({
  body: z.object({
    imageUrl: z.string().url().optional(),
    paletteSize: z.number().int().min(3).max(20).default(5),
  }),
});

const accessibilitySchema = z.object({
  body: z.object({
    foreground: validationSchemas.colorHex,
    background: validationSchemas.colorHex,
    fontSize: z.number().min(10).max(72).default(16),
    fontWeight: z.enum(['normal', 'bold']).default('normal'),
  }),
});

/**
 * @swagger
 * /colors/analyze:
 *   post:
 *     summary: Analyze a single color with AI
 *     tags: [Colors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - color
 *             properties:
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: '#FF5733'
 *               context:
 *                 type: string
 *                 description: Optional context for analysis
 *     responses:
 *       200:
 *         description: Color analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ColorAnalysis'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/analyze',
  strictRateLimit(20, 300000), // 20 analyses per 5 minutes
  validateRequest(analyzeColorSchema),
  asyncHandler(async (req, res) => {
    const { color, context } = req.body;

    // Basic color information
    const rgb = hexToRgb(color)!;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // Color temperature analysis
    const getColorTemperature = (h: number): string => {
      if (h >= 0 && h < 60) return 'warm'; // Red-Yellow
      if (h >= 60 && h < 120) return 'warm'; // Yellow-Green
      if (h >= 120 && h < 180) return 'cool'; // Green-Cyan
      if (h >= 180 && h < 240) return 'cool'; // Cyan-Blue
      if (h >= 240 && h < 300) return 'cool'; // Blue-Magenta
      return 'warm'; // Magenta-Red
    };

    const analysis: any = {
      color,
      rgb,
      hsl,
      name: await getColorName(color),
      temperature: getColorTemperature(hsl.h),
      brightness: Math.round((rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000),
      saturation: hsl.s,
      lightness: hsl.l,
    };

    // AI-powered analysis if available
    if (openai) {
      try {
        const prompt = `Analyze the color ${color} ${context ? `in the context of: ${context}` : ''}. 
        
Provide analysis in this JSON format:
{
  "emotions": ["array", "of", "emotions"],
  "associations": ["array", "of", "associations"],
  "personality": "brief personality description",
  "useCases": ["array", "of", "use", "cases"],
  "culturalMeaning": "cultural significance",
  "psychologicalEffect": "psychological impact"
}`;

        const completion = await openai.chat.completions.create({
          model: aiConfig!.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: aiConfig!.maxTokens,
          temperature: aiConfig!.temperature,
        });

        const aiAnalysis = JSON.parse(completion.choices[0].message.content || '{}');
        analysis.ai = aiAnalysis;
      } catch (error) {
        logger.error('AI color analysis failed:', error);
        // Continue without AI analysis
      }
    }

    // Accessibility analysis
    analysis.accessibility = {
      contrastWithWhite: getContrastRatio(color, '#FFFFFF'),
      contrastWithBlack: getContrastRatio(color, '#000000'),
      wcagLevel: getWCAGLevel(color),
    };

    res.json(responseFormats.success(analysis, 'Color analyzed successfully'));
  })
);

/**
 * @swagger
 * /colors/analyze-palette:
 *   post:
 *     summary: Analyze a color palette with AI
 *     tags: [Colors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - colors
 *             properties:
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: '^#[0-9A-Fa-f]{6}$'
 *                 minItems: 2
 *                 maxItems: 20
 *               context:
 *                 type: string
 *     responses:
 *       200:
 *         description: Palette analysis completed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaletteAnalysis'
 */
router.post('/analyze-palette',
  strictRateLimit(10, 300000), // 10 palette analyses per 5 minutes
  validateRequest(analyzePaletteSchema),
  asyncHandler(async (req, res) => {
    const { colors, context } = req.body;

    // Basic palette analysis
    const harmony = detectHarmony(colors);
    const temperature = getPaletteTemperature(colors);
    const contrast = analyzePaletteContrast(colors);

    const analysis: any = {
      colors,
      harmony,
      temperature,
      contrast,
      colorCount: colors.length,
      averageHue: getAverageHue(colors),
      averageSaturation: getAverageSaturation(colors),
      averageLightness: getAverageLightness(colors),
    };

    // AI-powered palette analysis
    if (openai) {
      try {
        const prompt = `Analyze this color palette: ${colors.join(', ')} ${context ? `for: ${context}` : ''}
        
Provide analysis in this JSON format:
{
  "mood": "overall mood/feeling",
  "style": "design style (modern, vintage, etc.)",
  "season": "seasonal association",
  "industries": ["suitable", "industries"],
  "emotions": ["evoked", "emotions"],
  "improvements": ["suggested", "improvements"],
  "complementaryColors": ["#color1", "#color2"],
  "usageAdvice": "how to best use this palette"
}`;

        const completion = await openai.chat.completions.create({
          model: aiConfig!.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: aiConfig!.maxTokens,
          temperature: aiConfig!.temperature,
        });

        const aiAnalysis = JSON.parse(completion.choices[0].message.content || '{}');
        analysis.ai = aiAnalysis;
      } catch (error) {
        logger.error('AI palette analysis failed:', error);
      }
    }

    // Color blindness simulation
    analysis.colorBlindnessInfo = simulateColorBlindness(colors);

    res.json(responseFormats.success(analysis, 'Palette analyzed successfully'));
  })
);

/**
 * @swagger
 * /colors/generate-harmony:
 *   post:
 *     summary: Generate color harmony from a base color
 *     tags: [Colors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - baseColor
 *               - harmonyType
 *             properties:
 *               baseColor:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *               harmonyType:
 *                 type: string
 *                 enum: [complementary, analogous, triadic, tetradic, monochromatic]
 *               count:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 10
 *                 default: 5
 *     responses:
 *       200:
 *         description: Color harmony generated
 */
router.post('/generate-harmony',
  strictRateLimit(30, 300000), // 30 generations per 5 minutes
  validateRequest(generateHarmonySchema),
  asyncHandler(async (req, res) => {
    const { baseColor, harmonyType, count } = req.body;

    const rgb = hexToRgb(baseColor)!;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const colors = generateColorHarmony(hsl, harmonyType, count);

    const result = {
      baseColor,
      harmonyType,
      colors: colors.map(color => ({
        hex: color.hex,
        name: color.name,
        hsl: color.hsl,
        relationship: color.relationship,
      })),
      theory: getHarmonyTheory(harmonyType),
    };

    res.json(responseFormats.success(result, 'Color harmony generated successfully'));
  })
);

/**
 * @swagger
 * /colors/accessibility:
 *   post:
 *     summary: Check color accessibility compliance
 *     tags: [Colors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - foreground
 *               - background
 *             properties:
 *               foreground:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *               background:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *               fontSize:
 *                 type: number
 *                 minimum: 10
 *                 maximum: 72
 *                 default: 16
 *               fontWeight:
 *                 type: string
 *                 enum: [normal, bold]
 *                 default: normal
 *     responses:
 *       200:
 *         description: Accessibility analysis completed
 */
router.post('/accessibility',
  validateRequest(accessibilitySchema),
  asyncHandler(async (req, res) => {
    const { foreground, background, fontSize, fontWeight } = req.body;

    const contrastRatio = getContrastRatio(foreground, background);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight === 'bold');
    
    // WCAG 2.1 Guidelines
    const wcagAA = isLargeText ? 3.0 : 4.5;
    const wcagAAA = isLargeText ? 4.5 : 7.0;

    const result = {
      foreground,
      background,
      contrastRatio: Math.round(contrastRatio * 100) / 100,
      wcag: {
        AA: {
          normal: contrastRatio >= 4.5,
          large: contrastRatio >= 3.0,
          passes: contrastRatio >= wcagAA,
        },
        AAA: {
          normal: contrastRatio >= 7.0,
          large: contrastRatio >= 4.5,
          passes: contrastRatio >= wcagAAA,
        },
      },
      level: contrastRatio >= wcagAAA ? 'AAA' : contrastRatio >= wcagAA ? 'AA' : 'FAIL',
      recommendations: generateAccessibilityRecommendations(foreground, background, contrastRatio),
    };

    res.json(responseFormats.success(result, 'Accessibility analysis completed'));
  })
);

/**
 * @swagger
 * /colors/name/{hex}:
 *   get:
 *     summary: Get the name of a color
 *     tags: [Colors]
 *     parameters:
 *       - name: hex
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9A-Fa-f]{6}$'
 *         description: Hex color code without the # symbol
 *     responses:
 *       200:
 *         description: Color name retrieved
 */
router.get('/name/:hex',
  asyncHandler(async (req, res) => {
    const hex = `#${req.params.hex.toUpperCase()}`;
    
    if (!hex.match(/^#[0-9A-Fa-f]{6}$/)) {
      throw createError.validation('Invalid hex color format');
    }

    const name = await getColorName(hex);
    
    res.json(responseFormats.success({
      hex,
      name,
    }, 'Color name retrieved'));
  })
);

// Helper functions
const getColorName = async (hex: string): Promise<string> => {
  // This would typically use a color name database or API
  // For now, returning a simplified implementation
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

  return colorNames[hex.toUpperCase()] || 'Unknown';
};

const detectHarmony = (colors: string[]): string => {
  // Simplified harmony detection
  if (colors.length === 2) return 'complementary';
  if (colors.length === 3) return 'triadic';
  if (colors.length >= 4) return 'custom';
  return 'monochromatic';
};

const getPaletteTemperature = (colors: string[]): string => {
  const temperatures = colors.map(color => {
    const rgb = hexToRgb(color)!;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return hsl.h >= 0 && hsl.h < 180 ? 'warm' : 'cool';
  });

  const warmCount = temperatures.filter(t => t === 'warm').length;
  const coolCount = temperatures.filter(t => t === 'cool').length;

  if (warmCount > coolCount) return 'warm';
  if (coolCount > warmCount) return 'cool';
  return 'neutral';
};

const analyzePaletteContrast = (colors: string[]) => {
  const contrasts = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      contrasts.push(getContrastRatio(colors[i], colors[j]));
    }
  }

  return {
    highest: Math.max(...contrasts),
    lowest: Math.min(...contrasts),
    average: contrasts.reduce((a, b) => a + b, 0) / contrasts.length,
  };
};

const getAverageHue = (colors: string[]): number => {
  const hues = colors.map(color => {
    const rgb = hexToRgb(color)!;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return hsl.h;
  });

  return Math.round(hues.reduce((a, b) => a + b, 0) / hues.length);
};

const getAverageSaturation = (colors: string[]): number => {
  const saturations = colors.map(color => {
    const rgb = hexToRgb(color)!;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return hsl.s;
  });

  return Math.round(saturations.reduce((a, b) => a + b, 0) / saturations.length);
};

const getAverageLightness = (colors: string[]): number => {
  const lightnesses = colors.map(color => {
    const rgb = hexToRgb(color)!;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return hsl.l;
  });

  return Math.round(lightnesses.reduce((a, b) => a + b, 0) / lightnesses.length);
};

const generateColorHarmony = (baseHsl: any, harmonyType: string, count: number) => {
  const colors = [];
  
  // Add base color
  colors.push({
    hex: hslToHex(baseHsl),
    name: 'Base',
    hsl: baseHsl,
    relationship: 'base',
  });

  switch (harmonyType) {
    case 'complementary':
      colors.push({
        hex: hslToHex({ h: (baseHsl.h + 180) % 360, s: baseHsl.s, l: baseHsl.l }),
        name: 'Complementary',
        hsl: { h: (baseHsl.h + 180) % 360, s: baseHsl.s, l: baseHsl.l },
        relationship: 'complementary',
      });
      break;

    case 'analogous':
      for (let i = 1; i < count; i++) {
        const hue = (baseHsl.h + (i * 30)) % 360;
        colors.push({
          hex: hslToHex({ h: hue, s: baseHsl.s, l: baseHsl.l }),
          name: `Analogous ${i}`,
          hsl: { h: hue, s: baseHsl.s, l: baseHsl.l },
          relationship: 'analogous',
        });
      }
      break;

    case 'triadic':
      colors.push({
        hex: hslToHex({ h: (baseHsl.h + 120) % 360, s: baseHsl.s, l: baseHsl.l }),
        name: 'Triadic 1',
        hsl: { h: (baseHsl.h + 120) % 360, s: baseHsl.s, l: baseHsl.l },
        relationship: 'triadic',
      });
      colors.push({
        hex: hslToHex({ h: (baseHsl.h + 240) % 360, s: baseHsl.s, l: baseHsl.l }),
        name: 'Triadic 2',
        hsl: { h: (baseHsl.h + 240) % 360, s: baseHsl.s, l: baseHsl.l },
        relationship: 'triadic',
      });
      break;

    case 'monochromatic':
      for (let i = 1; i < count; i++) {
        const lightness = Math.max(10, Math.min(90, baseHsl.l + (i * 15) - 30));
        colors.push({
          hex: hslToHex({ h: baseHsl.h, s: baseHsl.s, l: lightness }),
          name: `Monochromatic ${i}`,
          hsl: { h: baseHsl.h, s: baseHsl.s, l: lightness },
          relationship: 'monochromatic',
        });
      }
      break;
  }

  return colors.slice(0, count);
};

const hslToHex = (hsl: { h: number; s: number; l: number }): string => {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const getHarmonyTheory = (harmonyType: string): string => {
  const theories = {
    complementary: 'Colors opposite each other on the color wheel create high contrast and vibrant looks.',
    analogous: 'Colors next to each other on the color wheel create serene and comfortable designs.',
    triadic: 'Three colors equally spaced on the color wheel offer strong visual contrast while maintaining harmony.',
    tetradic: 'Four colors arranged into two complementary pairs create rich and varied palettes.',
    monochromatic: 'Variations in lightness and saturation of a single color create sophisticated, cohesive designs.',
  };

  return theories[harmonyType as keyof typeof theories] || 'Custom color relationship';
};

const getWCAGLevel = (color: string): string => {
  const whiteContrast = getContrastRatio(color, '#FFFFFF');
  const blackContrast = getContrastRatio(color, '#000000');
  const bestContrast = Math.max(whiteContrast, blackContrast);

  if (bestContrast >= 7.0) return 'AAA';
  if (bestContrast >= 4.5) return 'AA';
  return 'FAIL';
};

const simulateColorBlindness = (colors: string[]) => {
  // Simplified color blindness simulation
  // In production, use a proper color blindness simulation library
  return {
    protanopia: colors.map(color => color), // Red-blind
    deuteranopia: colors.map(color => color), // Green-blind
    tritanopia: colors.map(color => color), // Blue-blind
    note: 'Simplified simulation - use specialized tools for accurate results',
  };
};

const generateAccessibilityRecommendations = (fg: string, bg: string, contrast: number): string[] => {
  const recommendations = [];

  if (contrast < 4.5) {
    recommendations.push('Increase contrast for better readability');
    recommendations.push('Consider using darker text on lighter backgrounds');
    recommendations.push('Test with users who have visual impairments');
  }

  if (contrast < 3.0) {
    recommendations.push('This combination fails WCAG guidelines for any text');
    recommendations.push('Consider completely different colors');
  }

  if (contrast >= 7.0) {
    recommendations.push('Excellent contrast - meets AAA standards');
  }

  return recommendations;
};

export default router;