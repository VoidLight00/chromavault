export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  frequency: number;
  dominance: number;
}

export interface ColorExtractionOptions {
  maxColors?: number;
  quality?: number;
  ignoreWhite?: boolean;
  ignoreBlack?: boolean;
  colorThreshold?: number;
}

export interface ColorExtractionResult {
  colors: ExtractedColor[];
  totalColors: number;
  processingOptions: ColorExtractionOptions;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export class ColorExtractorClient {
  /**
   * Extract colors from an image file
   */
  static async extractColorsFromImage(
    imageFile: File,
    options: ColorExtractionOptions = {}
  ): Promise<ColorExtractionResult> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Append options to form data
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/ai/extract-colors`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Color extraction failed');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Extract colors from an image URL (by first fetching and converting to file)
   */
  static async extractColorsFromImageUrl(
    imageUrl: string,
    options: ColorExtractionOptions = {}
  ): Promise<ColorExtractionResult> {
    try {
      // Fetch image from URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });
      
      return await this.extractColorsFromImage(file, options);
    } catch (error) {
      throw new Error(`Failed to extract colors from URL: ${error.message}`);
    }
  }

  /**
   * Analyze an existing color palette
   */
  static async analyzeColorPalette(colors: string[]): Promise<ExtractedColor[]> {
    const response = await fetch(`${API_BASE_URL}/ai/analyze-palette`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ colors }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Palette analysis failed');
    }

    const result = await response.json();
    return result.data.analysis;
  }

  /**
   * Extract colors from image using Canvas API (client-side alternative)
   */
  static async extractColorsFromImageClient(
    imageFile: File,
    options: ColorExtractionOptions = {}
  ): Promise<ExtractedColor[]> {
    const {
      maxColors = 8,
      quality = 10,
      ignoreWhite = true,
      ignoreBlack = true,
      colorThreshold = 0.1
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              throw new Error('Canvas context not available');
            }

            // Resize image for performance
            const maxSize = 400;
            const scale = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const colors = this.processImageData(imageData, options);
            
            resolve(colors);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(imageFile);
    });
  }

  /**
   * Process image data to extract colors (client-side)
   */
  private static processImageData(
    imageData: ImageData,
    options: ColorExtractionOptions
  ): ExtractedColor[] {
    const {
      maxColors = 8,
      quality = 10,
      ignoreWhite = true,
      ignoreBlack = true,
      colorThreshold = 0.1
    } = options;

    const data = imageData.data;
    const colorCounts = new Map<string, number>();
    let totalPixels = 0;

    // Sample pixels based on quality
    for (let i = 0; i < data.length; i += 4 * quality) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip transparent pixels
      if (a < 125) continue;

      // Skip colors too close to white/black if specified
      if (ignoreWhite && this.isColorClose([r, g, b], [255, 255, 255], 30)) continue;
      if (ignoreBlack && this.isColorClose([r, g, b], [0, 0, 0], 30)) continue;

      const hex = this.rgbToHex(r, g, b);
      colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
      totalPixels++;
    }

    // Convert to ExtractedColor format and sort by frequency
    const extractedColors: ExtractedColor[] = [];
    
    for (const [hex, count] of colorCounts.entries()) {
      const frequency = count / totalPixels;
      if (frequency < colorThreshold) continue;

      const rgb = this.hexToRgb(hex);
      const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

      extractedColors.push({
        hex,
        rgb,
        hsl,
        frequency,
        dominance: count
      });
    }

    return extractedColors
      .sort((a, b) => b.dominance - a.dominance)
      .slice(0, maxColors);
  }

  /**
   * Check if two colors are close within a threshold
   */
  private static isColorClose(color1: number[], color2: number[], threshold: number): boolean {
    const distance = Math.sqrt(
      Math.pow(color1[0] - color2[0], 2) +
      Math.pow(color1[1] - color2[1], 2) +
      Math.pow(color1[2] - color2[2], 2)
    );
    return distance < threshold;
  }

  /**
   * Convert RGB to HEX
   */
  private static rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * Convert HEX to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Convert RGB to HSL
   */
  private static rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
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
}

export default ColorExtractorClient;