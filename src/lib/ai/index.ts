// Export all AI services for easy importing
export { ColorExtractorClient, type ExtractedColor, type ColorExtractionOptions, type ColorExtractionResult } from './color-extractor';
export { PaletteGeneratorClient, type GeneratedPalette, type PaletteGenerationOptions, type HarmonyPalette } from './palette-generator';
export { SimilaritySearchClient, type SimilarityResult, type SimilaritySearchOptions, type ColorDistance } from './similarity-search';

// Re-export individual clients as default
export { default as ColorExtractor } from './color-extractor';
export { default as PaletteGenerator } from './palette-generator';
export { default as SimilaritySearch } from './similarity-search';

// AI utilities namespace
export const ChromaVaultAI = {
  ColorExtractor: ColorExtractorClient,
  PaletteGenerator: PaletteGeneratorClient,
  SimilaritySearch: SimilaritySearchClient,
} as const;

// Helper functions for common AI operations
export const AIHelpers = {
  /**
   * Validate hex color format
   */
  isValidHex: (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  },

  /**
   * Normalize hex color (ensure # prefix and 6 digits)
   */
  normalizeHex: (color: string): string => {
    if (!color) return '#000000';
    
    let hex = color.trim();
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    
    // Expand 3-digit hex to 6-digit
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    
    return hex.toUpperCase();
  },

  /**
   * Convert hex to RGB
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  /**
   * Convert RGB to hex
   */
  rgbToHex: (r: number, g: number, b: number): string => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  },

  /**
   * Get color brightness (0-255)
   */
  getColorBrightness: (hex: string): number => {
    const rgb = AIHelpers.hexToRgb(hex);
    if (!rgb) return 0;
    return Math.round((rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114));
  },

  /**
   * Check if color is light or dark
   */
  isLightColor: (hex: string, threshold: number = 128): boolean => {
    return AIHelpers.getColorBrightness(hex) > threshold;
  },

  /**
   * Get contrasting text color (black or white)
   */
  getContrastingTextColor: (backgroundColor: string): string => {
    return AIHelpers.isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
  },

  /**
   * Generate random hex color
   */
  generateRandomColor: (): string => {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  },

  /**
   * Create color palette from dominant color
   */
  createPaletteFromDominant: (dominantColor: string, count: number = 5): string[] => {
    return PaletteGeneratorClient.generatePaletteClient(dominantColor, 'analogous', count);
  }
} as const;

// Error types for AI operations
export class AIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class ColorExtractionError extends AIError {
  constructor(message: string, details?: any) {
    super(message, 'COLOR_EXTRACTION_ERROR', details);
    this.name = 'ColorExtractionError';
  }
}

export class PaletteGenerationError extends AIError {
  constructor(message: string, details?: any) {
    super(message, 'PALETTE_GENERATION_ERROR', details);
    this.name = 'PaletteGenerationError';
  }
}

export class SimilaritySearchError extends AIError {
  constructor(message: string, details?: any) {
    super(message, 'SIMILARITY_SEARCH_ERROR', details);
    this.name = 'SimilaritySearchError';
  }
}

// Constants
export const AI_CONSTANTS = {
  MAX_COLORS_PER_EXTRACTION: 20,
  MIN_COLORS_PER_PALETTE: 2,
  MAX_COLORS_PER_PALETTE: 10,
  DEFAULT_SIMILARITY_THRESHOLD: 0.7,
  DEFAULT_COLOR_QUALITY: 10,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  
  MOODS: [
    'sunset', 'ocean', 'forest', 'spring', 'autumn', 'winter',
    'romantic', 'energetic', 'calm', 'mysterious', 'earthy', 'tropical'
  ] as const,
  
  HARMONY_TYPES: [
    'monochromatic', 'analogous', 'complementary', 'triadic', 'tetradic'
  ] as const,
  
  SEASONS: ['spring', 'summer', 'autumn', 'winter'] as const,
  
  COLOR_SPACES: ['rgb', 'hsl', 'lab', 'luv'] as const
} as const;

// Type exports for constants
export type Mood = typeof AI_CONSTANTS.MOODS[number];
export type HarmonyType = typeof AI_CONSTANTS.HARMONY_TYPES[number];
export type Season = typeof AI_CONSTANTS.SEASONS[number];
export type ColorSpace = typeof AI_CONSTANTS.COLOR_SPACES[number];

export default ChromaVaultAI;