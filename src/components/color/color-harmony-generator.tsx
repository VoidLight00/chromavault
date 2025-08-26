'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ColorSwatch } from './color-swatch';
import { Color } from '@/types';
import { hexToHsl, hslToHex } from '@/lib/utils/color';
import { RefreshCw, Palette } from 'lucide-react';

interface ColorHarmonyGeneratorProps {
  baseColor?: string;
  onColorsGenerated?: (colors: Color[]) => void;
  className?: string;
}

const harmonyTypes = [
  {
    id: 'complementary',
    name: '보색',
    description: '색상환에서 정반대에 위치한 색상',
    generate: (h: number, s: number, l: number) => [
      { h, s, l },
      { h: (h + 180) % 360, s, l }
    ]
  },
  {
    id: 'analogous',
    name: '유사색',
    description: '색상환에서 인접한 색상들',
    generate: (h: number, s: number, l: number) => [
      { h: (h - 30 + 360) % 360, s, l },
      { h, s, l },
      { h: (h + 30) % 360, s, l }
    ]
  },
  {
    id: 'triadic',
    name: '삼색조화',
    description: '색상환에서 120도씩 떨어진 3개 색상',
    generate: (h: number, s: number, l: number) => [
      { h, s, l },
      { h: (h + 120) % 360, s, l },
      { h: (h + 240) % 360, s, l }
    ]
  },
  {
    id: 'split-complementary',
    name: '분할보색',
    description: '보색의 양쪽 인접 색상들',
    generate: (h: number, s: number, l: number) => [
      { h, s, l },
      { h: (h + 150) % 360, s, l },
      { h: (h + 210) % 360, s, l }
    ]
  },
  {
    id: 'tetradic',
    name: '사각형조화',
    description: '색상환에서 90도씩 떨어진 4개 색상',
    generate: (h: number, s: number, l: number) => [
      { h, s, l },
      { h: (h + 90) % 360, s, l },
      { h: (h + 180) % 360, s, l },
      { h: (h + 270) % 360, s, l }
    ]
  }
];

export function ColorHarmonyGenerator({ 
  baseColor = '#3B82F6', 
  onColorsGenerated,
  className = '' 
}: ColorHarmonyGeneratorProps) {
  const [selectedHarmony, setSelectedHarmony] = React.useState('complementary');
  const [generatedColors, setGeneratedColors] = React.useState<Color[]>([]);
  const [currentBaseColor, setCurrentBaseColor] = React.useState(baseColor);

  const generateHarmony = React.useCallback((harmonyType: string, color: string) => {
    const harmony = harmonyTypes.find(h => h.id === harmonyType);
    if (!harmony) return [];

    const hsl = hexToHsl(color);
    const hslColors = harmony.generate(hsl.h, hsl.s, hsl.l);
    
    return hslColors.map((hslColor, index) => ({
      id: `${harmonyType}-${index}`,
      hex: hslToHex(hslColor.h, hslColor.s, hslColor.l),
      rgb: {
        r: Math.round(255 * (hslColor.l / 100)),
        g: Math.round(255 * (hslColor.l / 100)),
        b: Math.round(255 * (hslColor.l / 100))
      },
      hsl: hslColor
    }));
  }, []);

  React.useEffect(() => {
    const colors = generateHarmony(selectedHarmony, currentBaseColor);
    setGeneratedColors(colors);
    onColorsGenerated?.(colors);
  }, [selectedHarmony, currentBaseColor, generateHarmony, onColorsGenerated]);

  const regenerateColors = () => {
    const colors = generateHarmony(selectedHarmony, currentBaseColor);
    setGeneratedColors(colors);
    onColorsGenerated?.(colors);
  };

  const selectedHarmonyData = harmonyTypes.find(h => h.id === selectedHarmony);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          <Palette size={20} />
          색상 조화 생성기
        </h3>
        <p className="text-muted-foreground text-sm">
          기본 색상을 바탕으로 조화로운 색상 조합을 생성합니다
        </p>
      </div>

      {/* Base Color Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">기본 색상</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={currentBaseColor}
            onChange={(e) => setCurrentBaseColor(e.target.value)}
            className="w-12 h-12 border border-border rounded-lg cursor-pointer"
          />
          <div className="flex-1">
            <input
              type="text"
              value={currentBaseColor}
              onChange={(e) => setCurrentBaseColor(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              placeholder="#3B82F6"
            />
          </div>
        </div>
      </div>

      {/* Harmony Type Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium">조화 유형</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {harmonyTypes.map((harmony) => (
            <button
              key={harmony.id}
              onClick={() => setSelectedHarmony(harmony.id)}
              className={`p-3 text-left border rounded-lg transition-colors ${
                selectedHarmony === harmony.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent border-border'
              }`}
            >
              <div className="font-medium text-sm">{harmony.name}</div>
              <div className="text-xs opacity-70 mt-1">{harmony.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generated Colors */}
      {generatedColors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              생성된 색상 ({selectedHarmonyData?.name})
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={regenerateColors}
            >
              <RefreshCw size={14} />
              새로고침
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {generatedColors.map((color, index) => (
              <div key={color.id} className="space-y-2">
                <ColorSwatch
                  color={color.hex}
                  size="lg"
                  showTooltip
                  className="w-full h-16"
                />
                <div className="text-center">
                  <div className="text-xs font-mono">{color.hex.toUpperCase()}</div>
                  <div className="text-xs text-muted-foreground">
                    {index === 0 ? '기본' : `조화 ${index}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-accent/50 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-2">💡 색상 조화 팁</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• 보색 조화는 강한 대비와 시각적 임팩트를 제공합니다</li>
          <li>• 유사색 조화는 부드럽고 편안한 느낌을 줍니다</li>
          <li>• 삼색조화는 균형잡힌 생동감을 표현할 때 좋습니다</li>
          <li>• 채도와 명도를 조절하여 더욱 세련된 조합을 만들어보세요</li>
        </ul>
      </div>
    </div>
  );
}