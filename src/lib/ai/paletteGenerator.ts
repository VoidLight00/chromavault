export interface GeneratedPalette {
  name: string;
  description: string;
  colors: string[];
  mood: string;
  tags: string[];
}

export type PaletteStyle = 
  | 'monochromatic'
  | 'analogous'
  | 'complementary'
  | 'triadic'
  | 'tetradic'
  | 'random'
  | 'seasonal'
  | 'trendy';

export type PaletteMood =
  | 'energetic'
  | 'calm'
  | 'professional'
  | 'playful'
  | 'elegant'
  | 'natural'
  | 'bold'
  | 'minimal';

export class PaletteGenerator {
  // Generate palette based on a mood
  generateFromMood(mood: PaletteMood, count: number = 5): GeneratedPalette {
    const moodConfigs = {
      energetic: {
        hueRanges: [[0, 30], [30, 60]], // Reds and oranges
        saturation: [70, 100],
        lightness: [40, 60],
        name: '에너지틱 팔레트',
        description: '활기차고 열정적인 색상 조합',
        tags: ['활기찬', '열정적', '다이나믹'],
      },
      calm: {
        hueRanges: [[180, 240]], // Blues
        saturation: [20, 50],
        lightness: [50, 70],
        name: '차분한 팔레트',
        description: '평온하고 안정감 있는 색상 조합',
        tags: ['차분한', '평화로운', '안정적'],
      },
      professional: {
        hueRanges: [[200, 250]], // Navy blues
        saturation: [10, 40],
        lightness: [20, 40],
        name: '프로페셔널 팔레트',
        description: '신뢰감과 전문성을 전달하는 색상 조합',
        tags: ['전문적', '신뢰', '비즈니스'],
      },
      playful: {
        hueRanges: [[0, 360]], // All hues
        saturation: [60, 100],
        lightness: [50, 70],
        name: '플레이풀 팔레트',
        description: '재미있고 유쾌한 색상 조합',
        tags: ['재미있는', '유쾌한', '창의적'],
      },
      elegant: {
        hueRanges: [[260, 320]], // Purples
        saturation: [20, 60],
        lightness: [30, 50],
        name: '엘레강트 팔레트',
        description: '고급스럽고 세련된 색상 조합',
        tags: ['고급스러운', '세련된', '우아한'],
      },
      natural: {
        hueRanges: [[60, 120]], // Greens
        saturation: [30, 60],
        lightness: [30, 60],
        name: '내추럴 팔레트',
        description: '자연에서 영감을 받은 색상 조합',
        tags: ['자연친화적', '유기농', '편안한'],
      },
      bold: {
        hueRanges: [[0, 360]], // All hues
        saturation: [80, 100],
        lightness: [30, 50],
        name: '볼드 팔레트',
        description: '강렬하고 대담한 색상 조합',
        tags: ['대담한', '강렬한', '임팩트'],
      },
      minimal: {
        hueRanges: [[0, 360]], // Any hue but desaturated
        saturation: [0, 20],
        lightness: [20, 80],
        name: '미니멀 팔레트',
        description: '절제되고 깔끔한 색상 조합',
        tags: ['미니멀', '깔끔한', '모던'],
      },
    };

    const config = moodConfigs[mood];
    const colors: string[] = [];

    for (let i = 0; i < count; i++) {
      const hueRange = config.hueRanges[Math.floor(Math.random() * config.hueRanges.length)];
      const hue = this.randomBetween(hueRange[0], hueRange[1]);
      const saturation = this.randomBetween(config.saturation[0], config.saturation[1]);
      const lightness = this.randomBetween(config.lightness[0], config.lightness[1]);
      
      colors.push(this.hslToHex(hue, saturation, lightness));
    }

    return {
      name: config.name,
      description: config.description,
      colors,
      mood,
      tags: config.tags,
    };
  }

  // Generate palette based on a base color
  generateFromColor(baseColor: string, style: PaletteStyle = 'analogous', count: number = 5): GeneratedPalette {
    const rgb = this.hexToRgb(baseColor);
    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const colors: string[] = [baseColor];

    switch (style) {
      case 'monochromatic':
        for (let i = 1; i < count; i++) {
          const lightness = hsl.l + (i - count / 2) * 15;
          colors.push(this.hslToHex(hsl.h, hsl.s, Math.max(10, Math.min(90, lightness))));
        }
        return {
          name: '모노크로매틱 팔레트',
          description: '단일 색상의 명도 변화로 구성된 조화로운 팔레트',
          colors,
          mood: 'minimal',
          tags: ['단색', '조화로운', '깔끔한'],
        };

      case 'analogous':
        const step = 30;
        for (let i = 1; i < count; i++) {
          const hue = (hsl.h + (i - count / 2) * step + 360) % 360;
          colors.push(this.hslToHex(hue, hsl.s, hsl.l));
        }
        return {
          name: '유사색 팔레트',
          description: '인접한 색상으로 구성된 자연스러운 팔레트',
          colors,
          mood: 'calm',
          tags: ['유사색', '자연스러운', '부드러운'],
        };

      case 'complementary':
        colors.push(this.hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l));
        for (let i = 2; i < count; i++) {
          const variation = i % 2 === 0 ? 0 : 180;
          const lightness = hsl.l + (i - 2) * 10;
          colors.push(this.hslToHex((hsl.h + variation) % 360, hsl.s * 0.8, lightness));
        }
        return {
          name: '보색 팔레트',
          description: '대비가 강한 보색으로 구성된 다이나믹 팔레트',
          colors,
          mood: 'bold',
          tags: ['보색', '대비', '다이나믹'],
        };

      case 'triadic':
        for (let i = 1; i < Math.min(3, count); i++) {
          colors.push(this.hslToHex((hsl.h + i * 120) % 360, hsl.s, hsl.l));
        }
        for (let i = 3; i < count; i++) {
          const baseHue = (i - 3) * 120;
          colors.push(this.hslToHex((hsl.h + baseHue) % 360, hsl.s * 0.7, hsl.l * 1.2));
        }
        return {
          name: '삼원색 팔레트',
          description: '균형 잡힌 3색 조화 팔레트',
          colors,
          mood: 'playful',
          tags: ['삼원색', '균형', '활기찬'],
        };

      case 'tetradic':
        for (let i = 1; i < Math.min(4, count); i++) {
          colors.push(this.hslToHex((hsl.h + i * 90) % 360, hsl.s, hsl.l));
        }
        for (let i = 4; i < count; i++) {
          const baseHue = (i - 4) * 90;
          colors.push(this.hslToHex((hsl.h + baseHue) % 360, hsl.s * 0.6, hsl.l * 0.8));
        }
        return {
          name: '사각색 팔레트',
          description: '4색 조화로 다양성이 풍부한 팔레트',
          colors,
          mood: 'energetic',
          tags: ['사각색', '다양한', '복잡한'],
        };

      case 'seasonal':
        return this.generateSeasonalPalette(hsl, count);

      case 'trendy':
        return this.generateTrendyPalette(count);

      default:
        for (let i = 1; i < count; i++) {
          colors.push(this.generateRandomColor());
        }
        return {
          name: '랜덤 팔레트',
          description: '무작위로 생성된 독특한 팔레트',
          colors,
          mood: 'playful',
          tags: ['랜덤', '독특한', '실험적'],
        };
    }
  }

  // Generate seasonal palette
  private generateSeasonalPalette(baseHsl: { h: number; s: number; l: number }, count: number): GeneratedPalette {
    const season = this.getCurrentSeason();
    const seasonConfigs = {
      spring: {
        hueRange: [60, 180], // Greens and light blues
        saturation: [40, 70],
        lightness: [50, 70],
        name: '봄 팔레트',
        description: '신선하고 생기 있는 봄의 색상',
        tags: ['봄', '신선한', '파스텔'],
      },
      summer: {
        hueRange: [180, 240], // Blues and cyans
        saturation: [60, 90],
        lightness: [40, 60],
        name: '여름 팔레트',
        description: '시원하고 청량한 여름의 색상',
        tags: ['여름', '시원한', '청량한'],
      },
      autumn: {
        hueRange: [0, 60], // Reds, oranges, yellows
        saturation: [50, 80],
        lightness: [30, 50],
        name: '가을 팔레트',
        description: '따뜻하고 풍성한 가을의 색상',
        tags: ['가을', '따뜻한', '풍성한'],
      },
      winter: {
        hueRange: [200, 280], // Blues and purples
        saturation: [10, 40],
        lightness: [20, 40],
        name: '겨울 팔레트',
        description: '차갑고 깨끗한 겨울의 색상',
        tags: ['겨울', '차가운', '깨끗한'],
      },
    };

    const config = seasonConfigs[season];
    const colors: string[] = [];

    for (let i = 0; i < count; i++) {
      const hue = this.randomBetween(config.hueRange[0], config.hueRange[1]);
      const saturation = this.randomBetween(config.saturation[0], config.saturation[1]);
      const lightness = this.randomBetween(config.lightness[0], config.lightness[1]);
      colors.push(this.hslToHex(hue, saturation, lightness));
    }

    return {
      name: config.name,
      description: config.description,
      colors,
      mood: 'natural',
      tags: config.tags,
    };
  }

  // Generate trendy palette based on current design trends
  private generateTrendyPalette(count: number): GeneratedPalette {
    const trendyPalettes = [
      {
        name: '네오 브루탈리즘',
        description: '대담하고 원시적인 디자인 트렌드',
        baseColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
        tags: ['트렌디', '브루탈리즘', '대담한'],
      },
      {
        name: '글래스모피즘',
        description: '투명하고 흐릿한 유리 효과',
        baseColors: ['#667EEA', '#764BA2', '#F093FB', '#C471F5', '#FA709A'],
        tags: ['트렌디', '글래스모피즘', '투명한'],
      },
      {
        name: '뉴모피즘',
        description: '부드러운 그림자와 입체감',
        baseColors: ['#E0E5EC', '#9BAACF', '#6E7C8C', '#364F6B', '#FC5185'],
        tags: ['트렌디', '뉴모피즘', '부드러운'],
      },
    ];

    const selected = trendyPalettes[Math.floor(Math.random() * trendyPalettes.length)];
    const colors = selected.baseColors.slice(0, count);

    return {
      name: selected.name,
      description: selected.description,
      colors,
      mood: 'bold',
      tags: selected.tags,
    };
  }

  // Helper functions
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private generateRandomColor(): string {
    const hue = this.randomBetween(0, 360);
    const saturation = this.randomBetween(20, 80);
    const lightness = this.randomBetween(30, 70);
    return this.hslToHex(hue, saturation, lightness);
  }

  private getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

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

export const paletteGenerator = new PaletteGenerator();