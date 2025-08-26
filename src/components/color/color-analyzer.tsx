'use client';

import React from 'react';
import { ColorSwatch } from './color-swatch';
import { Color } from '@/types';
import { hexToRgb, hexToHsl, getContrastRatio, getLuminance } from '@/lib/utils/color';
import { Eye, Palette, BarChart3, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorAnalyzerProps {
  colors: Color[];
  className?: string;
}

interface ColorAnalysis {
  accessibility: {
    wcagAA: boolean;
    wcagAAA: boolean;
    contrastRatio: number;
  };
  psychology: {
    mood: string;
    energy: 'low' | 'medium' | 'high';
    temperature: 'cool' | 'neutral' | 'warm';
  };
  technical: {
    luminance: number;
    brightness: number;
    saturation: number;
    hue: number;
  };
}

const getMoodFromHue = (hue: number): string => {
  if (hue >= 0 && hue < 30) return '열정적, 활동적';
  if (hue >= 30 && hue < 60) return '밝은, 즐거운';
  if (hue >= 60 && hue < 120) return '자연적, 안정적';
  if (hue >= 120 && hue < 180) return '시원한, 신선한';
  if (hue >= 180 && hue < 240) return '차분한, 평온한';
  if (hue >= 240 && hue < 300) return '신비로운, 창의적';
  return '우아한, 고급스러운';
};

const getTemperature = (hue: number): 'cool' | 'neutral' | 'warm' => {
  if (hue >= 0 && hue < 60) return 'warm';
  if (hue >= 60 && hue < 120) return 'neutral';
  if (hue >= 120 && hue < 240) return 'cool';
  if (hue >= 240 && hue < 300) return 'cool';
  return 'warm';
};

const analyzeColor = (color: Color, backgroundColor: Color = { 
  id: 'bg', 
  hex: '#ffffff', 
  rgb: { r: 255, g: 255, b: 255 }, 
  hsl: { h: 0, s: 0, l: 100 } 
}): ColorAnalysis => {
  const contrastRatio = getContrastRatio(color.hex, backgroundColor.hex);
  const luminance = getLuminance(color.rgb.r, color.rgb.g, color.rgb.b);
  
  return {
    accessibility: {
      wcagAA: contrastRatio >= 4.5,
      wcagAAA: contrastRatio >= 7,
      contrastRatio
    },
    psychology: {
      mood: getMoodFromHue(color.hsl.h),
      energy: color.hsl.s > 70 ? 'high' : color.hsl.s > 30 ? 'medium' : 'low',
      temperature: getTemperature(color.hsl.h)
    },
    technical: {
      luminance,
      brightness: (color.rgb.r * 299 + color.rgb.g * 587 + color.rgb.b * 114) / 1000,
      saturation: color.hsl.s,
      hue: color.hsl.h
    }
  };
};

export function ColorAnalyzer({ colors, className }: ColorAnalyzerProps) {
  const [selectedColorIndex, setSelectedColorIndex] = React.useState(0);
  const [backgroundMode, setBackgroundMode] = React.useState<'light' | 'dark'>('light');
  
  if (!colors || colors.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Palette size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">색상을 추가하여 분석을 시작하세요</p>
      </div>
    );
  }

  const selectedColor = colors[selectedColorIndex] || colors[0];
  const backgroundColors = {
    light: { id: 'light', hex: '#ffffff', rgb: { r: 255, g: 255, b: 255 }, hsl: { h: 0, s: 0, l: 100 } },
    dark: { id: 'dark', hex: '#000000', rgb: { r: 0, g: 0, b: 0 }, hsl: { h: 0, s: 0, l: 0 } }
  };
  
  const analysis = analyzeColor(selectedColor, backgroundColors[backgroundMode]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          <BarChart3 size={20} />
          색상 분석
        </h3>
        <p className="text-muted-foreground text-sm">
          선택한 색상의 접근성, 심리적 효과, 기술적 특성을 분석합니다
        </p>
      </div>

      {/* Color Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium">분석할 색상 선택</label>
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color, index) => (
            <button
              key={color.id}
              onClick={() => setSelectedColorIndex(index)}
              className={cn(
                'relative rounded-lg border-2 transition-all',
                selectedColorIndex === index 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-transparent hover:border-border'
              )}
            >
              <ColorSwatch
                color={color.hex}
                size="lg"
                className="w-full h-12"
              />
              {selectedColorIndex === index && (
                <div className="absolute inset-0 bg-white/20 rounded-lg flex items-center justify-center">
                  <Eye size={16} className="text-white drop-shadow" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Background Mode Toggle */}
      <div className="space-y-2">
        <label className="text-sm font-medium">배경 모드 (접근성 테스트용)</label>
        <div className="flex gap-2">
          {(['light', 'dark'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setBackgroundMode(mode)}
              className={cn(
                'px-3 py-2 text-sm rounded-lg border transition-colors',
                backgroundMode === mode
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent border-border'
              )}
            >
              {mode === 'light' ? '밝은 배경' : '어두운 배경'}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Accessibility */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Eye size={16} />
            <h4 className="font-semibold text-sm">접근성</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">대비율</span>
              <span className="font-mono text-sm">{analysis.accessibility.contrastRatio.toFixed(2)}:1</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">WCAG AA</span>
              <span className={cn(
                'text-sm font-medium',
                analysis.accessibility.wcagAA ? 'text-green-600' : 'text-red-600'
              )}>
                {analysis.accessibility.wcagAA ? '통과' : '실패'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">WCAG AAA</span>
              <span className={cn(
                'text-sm font-medium',
                analysis.accessibility.wcagAAA ? 'text-green-600' : 'text-red-600'
              )}>
                {analysis.accessibility.wcagAAA ? '통과' : '실패'}
              </span>
            </div>
          </div>

          {/* Contrast Preview */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">미리보기</span>
            <div 
              className="p-3 rounded border text-sm text-center"
              style={{ 
                backgroundColor: backgroundColors[backgroundMode].hex,
                color: selectedColor.hex 
              }}
            >
              샘플 텍스트
            </div>
          </div>
        </div>

        {/* Psychology */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={16} />
            <h4 className="font-semibold text-sm">심리적 효과</h4>
          </div>
          
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground block">분위기</span>
              <span className="text-sm font-medium">{analysis.psychology.mood}</span>
            </div>
            
            <div>
              <span className="text-sm text-muted-foreground block">에너지</span>
              <span className={cn(
                'text-sm font-medium px-2 py-1 rounded text-xs',
                analysis.psychology.energy === 'high' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                analysis.psychology.energy === 'medium' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                analysis.psychology.energy === 'low' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              )}>
                {analysis.psychology.energy === 'high' ? '높음' : 
                 analysis.psychology.energy === 'medium' ? '보통' : '낮음'}
              </span>
            </div>
            
            <div>
              <span className="text-sm text-muted-foreground block">온도감</span>
              <span className={cn(
                'text-sm font-medium px-2 py-1 rounded text-xs',
                analysis.psychology.temperature === 'warm' && 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                analysis.psychology.temperature === 'neutral' && 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                analysis.psychology.temperature === 'cool' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              )}>
                {analysis.psychology.temperature === 'warm' ? '따뜻함' : 
                 analysis.psychology.temperature === 'neutral' ? '중성' : '차가움'}
              </span>
            </div>
          </div>
        </div>

        {/* Technical */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} />
            <h4 className="font-semibold text-sm">기술적 특성</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">색조(H)</span>
              <span className="font-mono">{Math.round(analysis.technical.hue)}°</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">채도(S)</span>
              <span className="font-mono">{Math.round(analysis.technical.saturation)}%</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">명도(L)</span>
              <span className="font-mono">{Math.round(selectedColor.hsl.l)}%</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">휘도</span>
              <span className="font-mono">{analysis.technical.luminance.toFixed(3)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">밝기</span>
              <span className="font-mono">{Math.round(analysis.technical.brightness)}</span>
            </div>
          </div>

          {/* Color Values */}
          <div className="pt-2 border-t space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">HEX</span>
              <span className="font-mono">{selectedColor.hex.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">RGB</span>
              <span className="font-mono">
                {selectedColor.rgb.r}, {selectedColor.rgb.g}, {selectedColor.rgb.b}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">HSL</span>
              <span className="font-mono">
                {Math.round(selectedColor.hsl.h)}°, {Math.round(selectedColor.hsl.s)}%, {Math.round(selectedColor.hsl.l)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}