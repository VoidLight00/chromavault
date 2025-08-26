export interface GeneratedPalette {
  id: string;
  name: string;
  colors: string[];
  mood: string;
  tags: string[];
  dominantColor: string;
  confidence: number;
}

export interface PaletteGenerationOptions {
  colorCount?: number;
  mood?: string;
  style?: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'custom';
  temperature?: 'warm' | 'cool' | 'neutral';
  saturation?: 'low' | 'medium' | 'high';
  brightness?: 'dark' | 'medium' | 'bright';
}

export interface HarmonyPalette {
  id: string;
  name: string;
  colors: string[];
  baseColor: string;
  harmonyType: string;
  confidence: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export class PaletteGeneratorClient {
  /**
   * Generate palette from text description
   */
  static async generateFromText(
    description: string,
    options: PaletteGenerationOptions = {}
  ): Promise<GeneratedPalette> {
    const response = await fetch(`${API_BASE_URL}/ai/generate-palette/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        ...options
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Palette generation failed');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Generate palette from mood
   */
  static async generateFromMood(
    mood: string,
    options: PaletteGenerationOptions = {}
  ): Promise<GeneratedPalette> {
    const response = await fetch(`${API_BASE_URL}/ai/generate-palette/mood`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mood,
        ...options
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Mood-based palette generation failed');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Generate harmonious colors based on a base color
   */
  static async generateHarmony(
    baseColor: string,
    harmonyType: 'complementary' | 'analogous' | 'monochromatic' | 'triadic' | 'tetradic',
    count: number = 5
  ): Promise<HarmonyPalette> {
    const response = await fetch(`${API_BASE_URL}/ai/generate-palette/harmony`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        baseColor,
        harmonyType,
        count
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Harmony palette generation failed');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Generate seasonal palette
   */
  static async generateSeasonal(
    season: 'spring' | 'summer' | 'autumn' | 'winter'
  ): Promise<GeneratedPalette> {
    const response = await fetch(`${API_BASE_URL}/ai/generate-palette/seasonal/${season}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Seasonal palette generation failed');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Generate multiple palette variations from a prompt
   */
  static async generateVariations(
    prompt: string,
    count: number = 3,
    options: PaletteGenerationOptions = {}
  ): Promise<GeneratedPalette[]> {
    const variations: GeneratedPalette[] = [];
    const styles: Array<PaletteGenerationOptions['style']> = [
      'custom', 'analogous', 'complementary'
    ];

    for (let i = 0; i < count; i++) {
      try {
        const variationOptions = {
          ...options,
          style: styles[i % styles.length]
        };

        const palette = await this.generateFromText(prompt, variationOptions);
        variations.push(palette);
      } catch (error) {
        console.warn(`Failed to generate variation ${i + 1}:`, error);
      }
    }

    return variations;
  }

  /**
   * Generate palette with client-side logic (fallback)
   */
  static generatePaletteClient(
    baseColor: string,
    type: 'complementary' | 'analogous' | 'monochromatic' | 'triadic' = 'complementary',
    count: number = 5
  ): string[] {
    const hsl = this.hexToHsl(baseColor);
    const colors = [baseColor];

    switch (type) {
      case 'complementary':
        return this.generateComplementaryClient(hsl, count);
      case 'analogous':
        return this.generateAnalogousClient(hsl, count);
      case 'monochromatic':
        return this.generateMonochromaticClient(hsl, count);
      case 'triadic':
        return this.generateTriadicClient(hsl, count);
      default:
        return [baseColor];
    }
  }

  /**
   * Generate complementary colors (client-side)
   */
  private static generateComplementaryClient(
    baseHsl: { h: number; s: number; l: number },
    count: number
  ): string[] {
    const colors = [this.hslToHex(baseHsl.h, baseHsl.s, baseHsl.l)];
    const complementaryHue = (baseHsl.h + 180) % 360;

    // Add complementary color
    colors.push(this.hslToHex(complementaryHue, baseHsl.s, baseHsl.l));

    // Add variations
    for (let i = 2; i < count; i++) {
      const isBase = i % 2 === 0;
      const hue = isBase ? baseHsl.h : complementaryHue;
      const saturationVar = Math.max(10, baseHsl.s - (i * 10));
      const lightnessVar = Math.min(90, Math.max(10, baseHsl.l + ((i - 2) * 15) - 15));
      
      colors.push(this.hslToHex(hue, saturationVar, lightnessVar));
    }

    return colors;
  }

  /**
   * Generate analogous colors (client-side)
   */
  private static generateAnalogousClient(
    baseHsl: { h: number; s: number; l: number },
    count: number
  ): string[] {
    const colors = [this.hslToHex(baseHsl.h, baseHsl.s, baseHsl.l)];
    const hueStep = 30;

    for (let i = 1; i < count; i++) {
      const direction = i % 2 === 1 ? 1 : -1;
      const steps = Math.ceil(i / 2);
      const newHue = (baseHsl.h + (direction * hueStep * steps) + 360) % 360;
      
      colors.push(this.hslToHex(newHue, baseHsl.s, baseHsl.l));
    }

    return colors;
  }

  /**
   * Generate monochromatic colors (client-side)
   */
  private static generateMonochromaticClient(
    baseHsl: { h: number; s: number; l: number },
    count: number
  ): string[] {
    const colors = [this.hslToHex(baseHsl.h, baseHsl.s, baseHsl.l)];
    const lightnessStep = 80 / (count - 1);

    for (let i = 1; i < count; i++) {
      const newLightness = Math.min(90, Math.max(10, 10 + (i * lightnessStep)));
      colors.push(this.hslToHex(baseHsl.h, baseHsl.s, newLightness));
    }

    return colors;
  }

  /**
   * Generate triadic colors (client-side)
   */
  private static generateTriadicClient(
    baseHsl: { h: number; s: number; l: number },
    count: number
  ): string[] {
    const colors = [this.hslToHex(baseHsl.h, baseHsl.s, baseHsl.l)];

    // Add triadic colors (120° apart)
    colors.push(this.hslToHex((baseHsl.h + 120) % 360, baseHsl.s, baseHsl.l));
    if (count > 2) {
      colors.push(this.hslToHex((baseHsl.h + 240) % 360, baseHsl.s, baseHsl.l));
    }

    // Fill remaining with variations
    while (colors.length < count) {
      const baseIndex = colors.length % 3;
      const baseColor = this.hexToHsl(colors[baseIndex]);
      const variation = Math.max(10, baseColor.l - 15);
      colors.push(this.hslToHex(baseColor.h, baseColor.s, variation));
    }

    return colors.slice(0, count);
  }

  /**
   * Get available moods for palette generation
   */
  static getAvailableMoods(): string[] {
    return [
      'sunset', 'ocean', 'forest', 'spring', 'autumn', 'winter',
      'romantic', 'energetic', 'calm', 'mysterious', 'earthy', 'tropical'
    ];
  }

  /**
   * Get available harmony types
   */
  static getHarmonyTypes(): Array<{
    type: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic';
    name: string;
    description: string;
  }> {
    return [
      {
        type: 'monochromatic',
        name: 'Monochromatic',
        description: 'Different shades and tints of the same color'
      },
      {
        type: 'analogous',
        name: 'Analogous',
        description: 'Colors that are next to each other on the color wheel'
      },
      {
        type: 'complementary',
        name: 'Complementary',
        description: 'Colors opposite each other on the color wheel'
      },
      {
        type: 'triadic',
        name: 'Triadic',
        description: 'Three colors evenly spaced on the color wheel'
      },
      {
        type: 'tetradic',
        name: 'Tetradic',
        description: 'Four colors forming a rectangle on the color wheel'
      }
    ];
  }

  /**
   * Get seasonal palettes info
   */
  static getSeasonalInfo(): Array<{
    season: 'spring' | 'summer' | 'autumn' | 'winter';
    name: string;
    description: string;
    characteristics: string[];
  }> {
    return [
      {
        season: 'spring',
        name: 'Spring',
        description: 'Fresh, light, and blooming colors',
        characteristics: ['Light greens', 'Soft pinks', 'Warm yellows', 'Fresh blues']
      },
      {
        season: 'summer',
        name: 'Summer',
        description: 'Bright, vibrant, and energetic colors',
        characteristics: ['Bright blues', 'Vivid greens', 'Warm oranges', 'Sunny yellows']
      },
      {
        season: 'autumn',
        name: 'Autumn',
        description: 'Warm, earthy, and cozy colors',
        characteristics: ['Rich oranges', 'Deep browns', 'Golden yellows', 'Burgundy reds']
      },
      {
        season: 'winter',
        name: 'Winter',
        description: 'Cool, crisp, and serene colors',
        characteristics: ['Cool blues', 'Pure whites', 'Deep grays', 'Icy pastels']
      }
    ];
  }

  /**
   * Validate color input
   */
  static isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * Generate random palette (client-side)
   */
  static generateRandomPalette(count: number = 5): string[] {
    const colors: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const hue = Math.floor(Math.random() * 360);
      const saturation = 40 + Math.floor(Math.random() * 60); // 40-100%
      const lightness = 30 + Math.floor(Math.random() * 50); // 30-80%
      
      colors.push(this.hslToHex(hue, saturation, lightness));
    }
    
    return colors;
  }

  /**
   * Color conversion utilities
   */
  private static hexToHsl(hex: string): { h: number; s: number; l: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 0 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
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

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
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
}

export default PaletteGeneratorClient;