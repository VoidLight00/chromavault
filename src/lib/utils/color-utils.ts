import { Color } from '@/types';

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
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
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function generateRandomColor(): Color {
  const hex = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  const rgb = hexToRgb(hex)!;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  return {
    id: Math.random().toString(36).slice(2),
    hex,
    rgb,
    hsl,
  };
}

export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getReadableTextColor(backgroundColor: string): string {
  const ratio = getContrastRatio(backgroundColor, '#ffffff');
  return ratio >= 4.5 ? '#ffffff' : '#000000';
}

export function generateComplementaryColor(baseHex: string): Color {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return generateRandomColor();

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const complementaryHsl = {
    h: (hsl.h + 180) % 360,
    s: hsl.s,
    l: hsl.l,
  };

  const complementaryRgb = hslToRgb(complementaryHsl.h, complementaryHsl.s, complementaryHsl.l);
  const complementaryHex = rgbToHex(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b);

  return {
    id: Math.random().toString(36).slice(2),
    hex: complementaryHex,
    rgb: complementaryRgb,
    hsl: complementaryHsl,
  };
}

export function generateAnalogousColors(baseHex: string, count: number = 5): Color[] {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return [];

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const colors: Color[] = [];
  const step = 30;

  for (let i = 0; i < count; i++) {
    const analogousHsl = {
      h: (hsl.h + (i - Math.floor(count / 2)) * step + 360) % 360,
      s: hsl.s,
      l: hsl.l,
    };

    const analogousRgb = hslToRgb(analogousHsl.h, analogousHsl.s, analogousHsl.l);
    const analogousHex = rgbToHex(analogousRgb.r, analogousRgb.g, analogousRgb.b);

    colors.push({
      id: Math.random().toString(36).slice(2),
      hex: analogousHex,
      rgb: analogousRgb,
      hsl: analogousHsl,
    });
  }

  return colors;
}

export function generateTriadicColors(baseHex: string): Color[] {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return [];

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const colors: Color[] = [];

  for (let i = 0; i < 3; i++) {
    const triadicHsl = {
      h: (hsl.h + i * 120) % 360,
      s: hsl.s,
      l: hsl.l,
    };

    const triadicRgb = hslToRgb(triadicHsl.h, triadicHsl.s, triadicHsl.l);
    const triadicHex = rgbToHex(triadicRgb.r, triadicRgb.g, triadicRgb.b);

    colors.push({
      id: Math.random().toString(36).slice(2),
      hex: triadicHex,
      rgb: triadicRgb,
      hsl: triadicHsl,
    });
  }

  return colors;
}