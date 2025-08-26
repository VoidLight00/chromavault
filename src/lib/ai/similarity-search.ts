export interface SimilarityResult {
  color: {
    id: string;
    hex: string;
    metadata?: Record<string, any>;
  };
  similarity: number;
  distance: number;
}

export interface SimilaritySearchOptions {
  limit?: number;
  threshold?: number;
  colorSpace?: 'rgb' | 'hsl' | 'lab' | 'luv';
  weightedFeatures?: boolean;
}

export interface ColorDistance {
  color1: string;
  color2: string;
  distance: number;
  similarity: number;
  colorSpace: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export class SimilaritySearchClient {
  /**
   * Find similar colors to a target color
   */
  static async findSimilarColors(
    targetColor: string,
    options: SimilaritySearchOptions = {}
  ): Promise<{
    targetColor: string;
    similarColors: SimilarityResult[];
    totalFound: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/ai/similarity/colors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetColor,
        ...options
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Color similarity search failed');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Calculate distance between two colors
   */
  static async calculateColorDistance(
    color1: string,
    color2: string,
    colorSpace: 'rgb' | 'hsl' | 'lab' | 'deltaE' = 'lab'
  ): Promise<ColorDistance> {
    const response = await fetch(`${API_BASE_URL}/ai/similarity/distance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        color1,
        color2,
        colorSpace
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Color distance calculation failed');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Find similar colors using client-side calculations (fallback)
   */
  static findSimilarColorsClient(
    targetColor: string,
    colorDatabase: Array<{ id: string; hex: string; metadata?: any }>,
    options: SimilaritySearchOptions = {}
  ): SimilarityResult[] {
    const {
      limit = 10,
      threshold = 0.7,
      colorSpace = 'lab'
    } = options;

    const targetRgb = this.hexToRgb(targetColor);
    const similarities: SimilarityResult[] = [];

    for (const color of colorDatabase) {
      const colorRgb = this.hexToRgb(color.hex);
      const distance = this.calculateEuclideanDistance(
        this.rgbToVector(targetRgb, colorSpace),
        this.rgbToVector(colorRgb, colorSpace)
      );
      
      const similarity = 1 - (distance / this.getMaxDistance(colorSpace));
      
      if (similarity >= threshold) {
        similarities.push({
          color: {
            id: color.id,
            hex: color.hex,
            metadata: color.metadata
          },
          similarity: Math.max(0, Math.min(1, similarity)),
          distance
        });
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Calculate color distance using various color spaces (client-side)
   */
  static calculateColorDistanceClient(
    color1: string,
    color2: string,
    colorSpace: 'rgb' | 'hsl' | 'lab' = 'lab'
  ): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    switch (colorSpace) {
      case 'rgb':
        return this.calculateRgbDistance(rgb1, rgb2);
      case 'hsl':
        return this.calculateHslDistance(rgb1, rgb2);
      case 'lab':
        return this.calculateLabDistance(rgb1, rgb2);
      default:
        return this.calculateRgbDistance(rgb1, rgb2);
    }
  }

  /**
   * Find complementary colors
   */
  static findComplementaryColors(color: string): string[] {
    const hsl = this.rgbToHsl(...Object.values(this.hexToRgb(color)));
    const complementaryHue = (hsl.h + 180) % 360;
    
    const complementary: string[] = [];
    
    // Generate variations around the complementary hue
    for (let i = -30; i <= 30; i += 15) {
      const hue = (complementaryHue + i + 360) % 360;
      complementary.push(this.hslToHex(hue, hsl.s, hsl.l));
    }

    return complementary;
  }

  /**
   * Find analogous colors
   */
  static findAnalogousColors(color: string, range: number = 30): string[] {
    const hsl = this.rgbToHsl(...Object.values(this.hexToRgb(color)));
    const analogous: string[] = [];

    for (let i = -range; i <= range; i += 10) {
      if (i === 0) continue; // Skip the original color
      const hue = (hsl.h + i + 360) % 360;
      analogous.push(this.hslToHex(hue, hsl.s, hsl.l));
    }

    return analogous;
  }

  /**
   * Calculate palette harmony score
   */
  static calculatePaletteHarmony(colors: string[]): number {
    if (colors.length < 2) return 1;

    let totalHarmony = 0;
    let comparisons = 0;

    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const harmony = this.calculateColorHarmony(colors[i], colors[j]);
        totalHarmony += harmony;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalHarmony / comparisons : 0;
  }

  /**
   * Calculate harmony between two colors
   */
  private static calculateColorHarmony(color1: string, color2: string): number {
    const hsl1 = this.rgbToHsl(...Object.values(this.hexToRgb(color1)));
    const hsl2 = this.rgbToHsl(...Object.values(this.hexToRgb(color2)));

    const hueDiff = Math.abs(hsl1.h - hsl2.h);
    const normalizedHueDiff = Math.min(hueDiff, 360 - hueDiff);

    // Common harmonious angles
    const harmoniousAngles = [0, 30, 60, 90, 120, 150, 180];
    
    let bestHarmony = 0;
    for (const angle of harmoniousAngles) {
      const proximity = 1 - Math.abs(normalizedHueDiff - angle) / 180;
      bestHarmony = Math.max(bestHarmony, proximity);
    }

    // Consider saturation and lightness similarity
    const saturationSimilarity = 1 - Math.abs(hsl1.s - hsl2.s) / 100;
    const lightnessSimilarity = 1 - Math.abs(hsl1.l - hsl2.l) / 100;

    return (bestHarmony * 0.6) + (saturationSimilarity * 0.2) + (lightnessSimilarity * 0.2);
  }

  /**
   * Group similar colors in a palette
   */
  static groupSimilarColors(
    colors: string[],
    threshold: number = 0.8
  ): string[][] {
    const groups: string[][] = [];
    const used = new Set<string>();

    for (const color of colors) {
      if (used.has(color)) continue;

      const group = [color];
      used.add(color);

      for (const otherColor of colors) {
        if (used.has(otherColor) || color === otherColor) continue;

        const distance = this.calculateColorDistanceClient(color, otherColor, 'lab');
        const similarity = 1 - (distance / 100); // Normalize

        if (similarity >= threshold) {
          group.push(otherColor);
          used.add(otherColor);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Find the most contrasting color from a palette
   */
  static findMostContrastingColor(
    targetColor: string,
    colors: string[]
  ): { color: string; contrast: number } {
    let maxContrast = 0;
    let mostContrastingColor = colors[0];

    for (const color of colors) {
      const contrast = this.calculateContrast(targetColor, color);
      if (contrast > maxContrast) {
        maxContrast = contrast;
        mostContrastingColor = color;
      }
    }

    return {
      color: mostContrastingColor,
      contrast: maxContrast
    };
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static calculateContrast(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Calculate relative luminance of a color
   */
  private static getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert RGB to different color space vectors
   */
  private static rgbToVector(
    rgb: { r: number; g: number; b: number },
    colorSpace: string
  ): number[] {
    switch (colorSpace) {
      case 'rgb':
        return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
      case 'hsl':
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        return [hsl.h / 360, hsl.s / 100, hsl.l / 100];
      case 'lab':
        // Simplified LAB conversion
        const xyz = this.rgbToXyz(rgb.r, rgb.g, rgb.b);
        const lab = this.xyzToLab(xyz.x, xyz.y, xyz.z);
        return [lab.l / 100, (lab.a + 128) / 256, (lab.b + 128) / 256];
      default:
        return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
    }
  }

  /**
   * Calculate Euclidean distance between vectors
   */
  private static calculateEuclideanDistance(vector1: number[], vector2: number[]): number {
    let sum = 0;
    for (let i = 0; i < vector1.length; i++) {
      sum += Math.pow(vector1[i] - vector2[i], 2);
    }
    return Math.sqrt(sum);
  }

  /**
   * Get maximum possible distance for normalization
   */
  private static getMaxDistance(colorSpace: string): number {
    switch (colorSpace) {
      case 'rgb': return Math.sqrt(3); // sqrt(1^2 + 1^2 + 1^2)
      case 'hsl': return Math.sqrt(3);
      case 'lab': return Math.sqrt(3);
      default: return Math.sqrt(3);
    }
  }

  /**
   * Calculate RGB distance
   */
  private static calculateRgbDistance(
    rgb1: { r: number; g: number; b: number },
    rgb2: { r: number; g: number; b: number }
  ): number {
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }

  /**
   * Calculate HSL distance
   */
  private static calculateHslDistance(
    rgb1: { r: number; g: number; b: number },
    rgb2: { r: number; g: number; b: number }
  ): number {
    const hsl1 = this.rgbToHsl(rgb1.r, rgb1.g, rgb1.b);
    const hsl2 = this.rgbToHsl(rgb2.r, rgb2.g, rgb2.b);

    const hueDiff = Math.min(
      Math.abs(hsl1.h - hsl2.h),
      360 - Math.abs(hsl1.h - hsl2.h)
    );

    return Math.sqrt(
      Math.pow(hueDiff, 2) +
      Math.pow(hsl1.s - hsl2.s, 2) +
      Math.pow(hsl1.l - hsl2.l, 2)
    );
  }

  /**
   * Calculate LAB distance (simplified)
   */
  private static calculateLabDistance(
    rgb1: { r: number; g: number; b: number },
    rgb2: { r: number; g: number; b: number }
  ): number {
    // Simplified Delta E calculation
    const lab1 = this.rgbToLab(rgb1.r, rgb1.g, rgb1.b);
    const lab2 = this.rgbToLab(rgb2.r, rgb2.g, rgb2.b);

    return Math.sqrt(
      Math.pow(lab1.l - lab2.l, 2) +
      Math.pow(lab1.a - lab2.a, 2) +
      Math.pow(lab1.b - lab2.b, 2)
    );
  }

  /**
   * Color conversion utilities
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private static rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

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

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private static hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  // Simplified color space conversions
  private static rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
    r = r / 255; g = g / 255; b = b / 255;
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    return {
      x: (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100,
      y: (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) * 100,
      z: (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) * 100
    };
  }

  private static xyzToLab(x: number, y: number, z: number): { l: number; a: number; b: number } {
    const xn = 95.047, yn = 100.000, zn = 108.883;
    x = x / xn; y = y / yn; z = z / zn;
    
    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

    return {
      l: (116 * y) - 16,
      a: 500 * (x - y),
      b: 200 * (y - z)
    };
  }

  private static rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
    const xyz = this.rgbToXyz(r, g, b);
    return this.xyzToLab(xyz.x, xyz.y, xyz.z);
  }
}

export default SimilaritySearchClient;