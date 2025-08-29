export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  percentage: number;
  name?: string;
}

export interface ExtractionOptions {
  maxColors?: number;
  minPercentage?: number;
  quality?: number;
}

export class ColorExtractor {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  // Extract colors from an image file
  async extractFromImage(
    file: File,
    options: ExtractionOptions = {}
  ): Promise<ExtractedColor[]> {
    const { maxColors = 5, minPercentage = 1, quality = 10 } = options;

    return new Promise((resolve, reject) => {
      if (!this.canvas || !this.ctx) {
        reject(new Error('Canvas not available'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.canvas!.width = img.width;
          this.canvas!.height = img.height;
          this.ctx!.drawImage(img, 0, 0);

          const imageData = this.ctx!.getImageData(0, 0, img.width, img.height);
          const pixels = imageData.data;
          const colorMap = new Map<string, number>();

          // Sample pixels based on quality setting
          for (let i = 0; i < pixels.length; i += 4 * quality) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            // Skip transparent pixels
            if (a < 128) continue;

            const hex = this.rgbToHex(r, g, b);
            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
          }

          // Convert to array and sort by frequency
          const totalPixels = Array.from(colorMap.values()).reduce((a, b) => a + b, 0);
          const colors = Array.from(colorMap.entries())
            .map(([hex, count]) => ({
              hex,
              rgb: this.hexToRgb(hex),
              percentage: (count / totalPixels) * 100,
            }))
            .filter((color) => color.percentage >= minPercentage)
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, maxColors);

          // Cluster similar colors
          const clustered = this.clusterColors(colors);

          // Add color names
          const namedColors = clustered.map((color) => ({
            ...color,
            name: this.getColorName(color.hex),
          }));

          resolve(namedColors);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Extract colors from a URL
  async extractFromUrl(url: string, options: ExtractionOptions = {}): Promise<ExtractedColor[]> {
    return new Promise((resolve, reject) => {
      if (!this.canvas || !this.ctx) {
        reject(new Error('Canvas not available'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        this.canvas!.width = img.width;
        this.canvas!.height = img.height;
        this.ctx!.drawImage(img, 0, 0);

        const imageData = this.ctx!.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;
        const { maxColors = 5, minPercentage = 1, quality = 10 } = options;
        const colorMap = new Map<string, number>();

        for (let i = 0; i < pixels.length; i += 4 * quality) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          if (a < 128) continue;

          const hex = this.rgbToHex(r, g, b);
          colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
        }

        const totalPixels = Array.from(colorMap.values()).reduce((a, b) => a + b, 0);
        const colors = Array.from(colorMap.entries())
          .map(([hex, count]) => ({
            hex,
            rgb: this.hexToRgb(hex),
            percentage: (count / totalPixels) * 100,
          }))
          .filter((color) => color.percentage >= minPercentage)
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, maxColors);

        const clustered = this.clusterColors(colors);
        const namedColors = clustered.map((color) => ({
          ...color,
          name: this.getColorName(color.hex),
        }));

        resolve(namedColors);
      };

      img.onerror = () => reject(new Error('Failed to load image from URL'));
      img.src = url;
    });
  }

  // Cluster similar colors together
  private clusterColors(colors: ExtractedColor[]): ExtractedColor[] {
    if (colors.length <= 1) return colors;

    const clustered: ExtractedColor[] = [];
    const used = new Set<number>();

    colors.forEach((color, i) => {
      if (used.has(i)) return;

      let totalPercentage = color.percentage;
      const similarIndices = [i];

      colors.forEach((otherColor, j) => {
        if (i === j || used.has(j)) return;

        const distance = this.colorDistance(color.rgb, otherColor.rgb);
        if (distance < 50) {
          similarIndices.push(j);
          totalPercentage += otherColor.percentage;
        }
      });

      similarIndices.forEach((idx) => used.add(idx));

      // Use the most prominent color in the cluster
      const dominantColor = similarIndices
        .map((idx) => colors[idx])
        .sort((a, b) => b.percentage - a.percentage)[0];

      clustered.push({
        ...dominantColor,
        percentage: totalPercentage,
      });
    });

    return clustered.sort((a, b) => b.percentage - a.percentage);
  }

  // Calculate color distance
  private colorDistance(
    c1: { r: number; g: number; b: number },
    c2: { r: number; g: number; b: number }
  ): number {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  // Convert RGB to Hex
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  // Convert Hex to RGB
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  // Get color name based on hex value
  private getColorName(hex: string): string {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Basic color naming based on HSL
    let name = '';

    // Determine base hue name
    if (hsl.s < 10) {
      if (hsl.l < 20) name = '검정';
      else if (hsl.l < 40) name = '진회색';
      else if (hsl.l < 60) name = '회색';
      else if (hsl.l < 80) name = '연회색';
      else name = '흰색';
    } else {
      if (hsl.h < 15 || hsl.h >= 345) name = '빨강';
      else if (hsl.h < 45) name = '주황';
      else if (hsl.h < 75) name = '노랑';
      else if (hsl.h < 105) name = '연두';
      else if (hsl.h < 135) name = '초록';
      else if (hsl.h < 165) name = '청록';
      else if (hsl.h < 195) name = '하늘';
      else if (hsl.h < 225) name = '파랑';
      else if (hsl.h < 255) name = '남색';
      else if (hsl.h < 285) name = '보라';
      else if (hsl.h < 315) name = '자주';
      else name = '분홍';

      // Add lightness modifier
      if (hsl.l < 30) name = '진' + name;
      else if (hsl.l > 70) name = '연' + name;

      // Add saturation modifier
      if (hsl.s < 30) name = '탁한 ' + name;
      else if (hsl.s > 80) name = '선명한 ' + name;
    }

    return name;
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }
}

export const colorExtractor = new ColorExtractor();