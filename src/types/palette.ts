export interface Color {
  id: string;
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  hsl: {
    h: number;
    s: number;
    l: number;
  };
  name?: string;
}

export interface Palette {
  id: string;
  name: string;
  description?: string;
  colors: Color[];
  tags: string[];
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  viewsCount: number;
  shareUrl?: string;
}

export interface PaletteSearchFilter {
  query?: string;
  tags?: string[];
  sortBy?: 'createdAt' | 'likesCount' | 'viewsCount' | 'name';
  sortOrder?: 'asc' | 'desc';
  colorCount?: number;
  userId?: string;
}

export interface ColorHarmony {
  type: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'splitComplementary';
  baseColor: Color;
  colors: Color[];
}

export interface PaletteStats {
  totalPalettes: number;
  totalColors: number;
  popularTags: Array<{ tag: string; count: number }>;
  recentPalettes: Palette[];
}