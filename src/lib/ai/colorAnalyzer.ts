export interface ColorHarmony {
  score: number;
  type: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'custom';
  description: string;
}

export interface AccessibilityScore {
  aa: boolean;
  aaa: boolean;
  contrast: number;
  readable: boolean;
}

export interface EmotionalAnalysis {
  emotions: string[];
  mood: string;
  energy: 'low' | 'medium' | 'high';
  temperature: 'cool' | 'neutral' | 'warm';
}

export interface IndustryRelevance {
  industries: string[];
  confidence: number;
}

export interface ColorSuggestion {
  type: 'complementary' | 'analogous' | 'triadic' | 'split-complementary';
  colors: string[];
  harmony: number;
}

export class ColorAnalyzer {
  // Convert hex to RGB
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

  // Convert RGB to HSL
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

  // Calculate contrast ratio
  private getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    const l1 = this.getRelativeLuminance(rgb1);
    const l2 = this.getRelativeLuminance(rgb2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  private getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
    const sRGB = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
    const linearRGB = sRGB.map((val) => {
      if (val <= 0.03928) {
        return val / 12.92;
      }
      return Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return linearRGB[0] * 0.2126 + linearRGB[1] * 0.7152 + linearRGB[2] * 0.0722;
  }

  // Analyze color harmony
  analyzeHarmony(colors: string[]): ColorHarmony {
    if (colors.length < 2) {
      return {
        score: 100,
        type: 'monochromatic',
        description: '단일 색상 팔레트',
      };
    }

    const hslColors = colors.map((color) => {
      const rgb = this.hexToRgb(color);
      return this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    });

    // Simple harmony detection based on hue differences
    const hueDiffs = [];
    for (let i = 0; i < hslColors.length - 1; i++) {
      for (let j = i + 1; j < hslColors.length; j++) {
        const diff = Math.abs(hslColors[i].h - hslColors[j].h);
        hueDiffs.push(Math.min(diff, 360 - diff));
      }
    }

    const avgDiff = hueDiffs.reduce((a, b) => a + b, 0) / hueDiffs.length;

    if (avgDiff < 30) {
      return {
        score: 95,
        type: 'analogous',
        description: '유사색 조화 - 자연스럽고 편안한 조합',
      };
    } else if (avgDiff > 150 && avgDiff < 210) {
      return {
        score: 90,
        type: 'complementary',
        description: '보색 조화 - 강렬하고 다이나믹한 대비',
      };
    } else if (avgDiff > 110 && avgDiff < 130) {
      return {
        score: 85,
        type: 'triadic',
        description: '삼원색 조화 - 균형잡힌 활기찬 조합',
      };
    } else {
      return {
        score: 75,
        type: 'custom',
        description: '커스텀 조화 - 독특하고 창의적인 조합',
      };
    }
  }

  // Check accessibility
  checkAccessibility(foreground: string, background: string): AccessibilityScore {
    const ratio = this.getContrastRatio(foreground, background);

    return {
      aa: ratio >= 4.5,
      aaa: ratio >= 7,
      contrast: Math.round(ratio * 10) / 10,
      readable: ratio >= 3,
    };
  }

  // Analyze emotional impact
  analyzeEmotions(colors: string[]): EmotionalAnalysis {
    const emotions: string[] = [];
    let totalWarmth = 0;
    let totalEnergy = 0;

    colors.forEach((color) => {
      const rgb = this.hexToRgb(color);
      const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

      // Analyze based on hue
      if (hsl.h >= 0 && hsl.h < 30) {
        emotions.push('열정적');
        totalWarmth += 2;
        totalEnergy += 2;
      } else if (hsl.h >= 30 && hsl.h < 60) {
        emotions.push('활기찬');
        totalWarmth += 1;
        totalEnergy += 2;
      } else if (hsl.h >= 60 && hsl.h < 120) {
        emotions.push('자연친화적');
        totalEnergy += 1;
      } else if (hsl.h >= 120 && hsl.h < 180) {
        emotions.push('신선한');
        totalWarmth -= 1;
      } else if (hsl.h >= 180 && hsl.h < 240) {
        emotions.push('신뢰감');
        totalWarmth -= 2;
        totalEnergy -= 1;
      } else if (hsl.h >= 240 && hsl.h < 300) {
        emotions.push('창의적');
        totalWarmth -= 1;
        totalEnergy += 1;
      } else {
        emotions.push('럭셔리');
        totalEnergy += 1;
      }

      // Analyze based on saturation and lightness
      if (hsl.s < 20) {
        emotions.push('미니멀');
      }
      if (hsl.l > 80) {
        emotions.push('부드러운');
      } else if (hsl.l < 30) {
        emotions.push('강렬한');
        totalEnergy += 1;
      }
    });

    const avgWarmth = totalWarmth / colors.length;
    const avgEnergy = totalEnergy / colors.length;

    return {
      emotions: [...new Set(emotions)].slice(0, 5),
      mood: avgEnergy > 1 ? '활동적' : avgEnergy < -0.5 ? '차분한' : '균형잡힌',
      energy: avgEnergy > 1 ? 'high' : avgEnergy < -0.5 ? 'low' : 'medium',
      temperature: avgWarmth > 0.5 ? 'warm' : avgWarmth < -0.5 ? 'cool' : 'neutral',
    };
  }

  // Analyze industry relevance
  analyzeIndustryRelevance(colors: string[]): IndustryRelevance {
    const analysis = this.analyzeEmotions(colors);
    const industries: string[] = [];
    let confidence = 0;

    // Map emotions to industries
    if (analysis.emotions.includes('신뢰감')) {
      industries.push('금융', '의료', '법률');
      confidence += 20;
    }
    if (analysis.emotions.includes('창의적')) {
      industries.push('디자인', '예술', '패션');
      confidence += 20;
    }
    if (analysis.emotions.includes('자연친화적')) {
      industries.push('환경', '건강', '유기농');
      confidence += 20;
    }
    if (analysis.emotions.includes('럭셔리')) {
      industries.push('프리미엄', '부동산', '자동차');
      confidence += 20;
    }
    if (analysis.emotions.includes('활기찬')) {
      industries.push('스포츠', '엔터테인먼트', '게임');
      confidence += 20;
    }

    // Default industries if none matched
    if (industries.length === 0) {
      industries.push('기술', '스타트업', '일반');
      confidence = 50;
    }

    return {
      industries: [...new Set(industries)].slice(0, 5),
      confidence: Math.min(confidence, 95),
    };
  }

  // Generate color suggestions
  generateSuggestions(baseColor: string): ColorSuggestion[] {
    const rgb = this.hexToRgb(baseColor);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const suggestions: ColorSuggestion[] = [];

    // Complementary
    const compHue = (hsl.h + 180) % 360;
    suggestions.push({
      type: 'complementary',
      colors: [
        this.hslToHex(compHue, hsl.s, hsl.l),
        this.hslToHex(compHue, hsl.s * 0.8, hsl.l * 1.2),
      ],
      harmony: 85,
    });

    // Analogous
    suggestions.push({
      type: 'analogous',
      colors: [
        this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
        this.hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
      ],
      harmony: 90,
    });

    // Triadic
    suggestions.push({
      type: 'triadic',
      colors: [
        this.hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
        this.hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
      ],
      harmony: 80,
    });

    return suggestions;
  }

  private hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;

    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }
}

export const colorAnalyzer = new ColorAnalyzer();