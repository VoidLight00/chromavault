'use client';

import React from 'react';
import { Palette, Color } from '@/types';
import { ColorSwatch } from '@/components/color/color-swatch';
import { Button } from '@/components/ui/button';
import { RotateCcw, Eye, Copy, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getContrastRatio } from '@/lib/utils/color';

interface PaletteComparisonProps {
  palettes: Palette[];
  onPaletteRemove?: (paletteId: string) => void;
  className?: string;
}

interface ComparisonMetrics {
  averageContrast: number;
  colorCount: number;
  dominantTemperature: 'warm' | 'cool' | 'neutral';
  energyLevel: 'low' | 'medium' | 'high';
}

const calculatePaletteMetrics = (palette: Palette): ComparisonMetrics => {
  const colors = palette.colors;
  
  // Calculate average contrast against white
  const totalContrast = colors.reduce((sum, color) => {
    return sum + getContrastRatio(color.hex, '#ffffff');
  }, 0);
  const averageContrast = totalContrast / colors.length;
  
  // Determine dominant temperature
  const temperatures = colors.map(color => {
    const hue = color.hsl.h;
    if (hue >= 0 && hue < 60 || hue >= 300) return 'warm';
    if (hue >= 60 && hue < 120) return 'neutral';
    return 'cool';
  });
  
  const tempCounts = temperatures.reduce((acc, temp) => {
    acc[temp] = (acc[temp] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const dominantTemperature = Object.entries(tempCounts)
    .sort(([,a], [,b]) => b - a)[0][0] as 'warm' | 'cool' | 'neutral';
  
  // Calculate energy level based on average saturation
  const averageSaturation = colors.reduce((sum, color) => sum + color.hsl.s, 0) / colors.length;
  const energyLevel = averageSaturation > 70 ? 'high' : averageSaturation > 30 ? 'medium' : 'low';
  
  return {
    averageContrast,
    colorCount: colors.length,
    dominantTemperature,
    energyLevel
  };
};

const exportPalette = (palette: Palette, format: 'css' | 'json' | 'ase') => {
  let content = '';
  let filename = '';
  
  switch (format) {
    case 'css':
      content = `:root {\n${palette.colors.map((color, index) => 
        `  --color-${index + 1}: ${color.hex};`
      ).join('\n')}\n}`;
      filename = `${palette.name.replace(/\s+/g, '-')}.css`;
      break;
      
    case 'json':
      content = JSON.stringify({
        name: palette.name,
        colors: palette.colors.map(color => ({
          hex: color.hex,
          rgb: color.rgb,
          hsl: color.hsl,
          name: color.name
        }))
      }, null, 2);
      filename = `${palette.name.replace(/\s+/g, '-')}.json`;
      break;
  }
  
  if (content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};

const copyPaletteColors = (palette: Palette) => {
  const colors = palette.colors.map(color => color.hex).join(', ');
  navigator.clipboard.writeText(colors);
};

export function PaletteComparison({ 
  palettes, 
  onPaletteRemove,
  className 
}: PaletteComparisonProps) {
  const [selectedPalettes, setSelectedPalettes] = React.useState<string[]>([]);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  
  if (!palettes || palettes.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Eye size={48} className="mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">비교할 팔레트가 없습니다</h3>
        <p className="text-muted-foreground">
          팔레트를 추가하여 색상 조합을 비교해보세요
        </p>
      </div>
    );
  }

  const togglePaletteSelection = (paletteId: string) => {
    setSelectedPalettes(prev => 
      prev.includes(paletteId) 
        ? prev.filter(id => id !== paletteId)
        : [...prev, paletteId]
    );
  };

  const clearSelection = () => {
    setSelectedPalettes([]);
  };

  const selectedPaletteData = palettes.filter(p => selectedPalettes.includes(p.id));

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Eye size={20} />
            팔레트 비교 ({palettes.length}개)
          </h3>
          <p className="text-muted-foreground text-sm">
            팔레트를 선택하여 색상 조합과 특성을 비교해보세요
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedPalettes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              <RotateCcw size={14} />
              선택 해제 ({selectedPalettes.length})
            </Button>
          )}
          
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-2 text-sm',
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background'
              )}
            >
              격자
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-2 text-sm',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background'
              )}
            >
              목록
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Summary */}
      {selectedPalettes.length > 1 && (
        <div className="bg-card border rounded-lg p-6">
          <h4 className="font-semibold mb-4">선택된 팔레트 비교 요약</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {selectedPaletteData.map(palette => {
              const metrics = calculatePaletteMetrics(palette);
              return (
                <div key={palette.id} className="bg-background rounded-lg p-4 border">
                  <h5 className="font-medium text-sm mb-3 truncate">{palette.name}</h5>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">색상 수</span>
                      <span>{metrics.colorCount}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">평균 대비율</span>
                      <span>{metrics.averageContrast.toFixed(1)}:1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">온도감</span>
                      <span className={cn(
                        'px-1.5 py-0.5 rounded',
                        metrics.dominantTemperature === 'warm' && 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                        metrics.dominantTemperature === 'cool' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                        metrics.dominantTemperature === 'neutral' && 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      )}>
                        {metrics.dominantTemperature === 'warm' ? '따뜻' : 
                         metrics.dominantTemperature === 'cool' ? '차가움' : '중성'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">에너지</span>
                      <span className={cn(
                        'px-1.5 py-0.5 rounded',
                        metrics.energyLevel === 'high' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                        metrics.energyLevel === 'medium' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                        metrics.energyLevel === 'low' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      )}>
                        {metrics.energyLevel === 'high' ? '높음' : 
                         metrics.energyLevel === 'medium' ? '보통' : '낮음'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side-by-side Color Comparison */}
          <div className="space-y-3">
            <h5 className="font-medium text-sm">색상 비교</h5>
            <div className="grid gap-2">
              {selectedPaletteData.map(palette => (
                <div key={palette.id} className="flex items-center gap-3">
                  <div className="w-24 text-xs font-medium truncate">{palette.name}</div>
                  <div className="flex gap-1 flex-1">
                    {palette.colors.map((color, index) => (
                      <ColorSwatch
                        key={`${palette.id}-${color.id}`}
                        color={color.hex}
                        size="sm"
                        className="flex-1 h-8"
                        showTooltip
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Palettes */}
      <div className={cn(
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
      )}>
        {palettes.map(palette => {
          const isSelected = selectedPalettes.includes(palette.id);
          const metrics = calculatePaletteMetrics(palette);
          
          return (
            <div
              key={palette.id}
              className={cn(
                'bg-card border rounded-lg p-4 transition-all cursor-pointer',
                isSelected && 'ring-2 ring-primary ring-offset-2'
              )}
              onClick={() => togglePaletteSelection(palette.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{palette.name}</h4>
                  {palette.description && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {palette.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPaletteColors(palette);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Copy size={14} />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportPalette(palette, 'json');
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Download size={14} />
                  </Button>
                  
                  {onPaletteRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPaletteRemove(palette.id);
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>

              {/* Colors */}
              <div className={cn(
                'grid gap-2 mb-4',
                viewMode === 'list' ? 'grid-cols-10' : 'grid-cols-5'
              )}>
                {palette.colors.map((color, index) => (
                  <ColorSwatch
                    key={color.id}
                    color={color.hex}
                    size={viewMode === 'list' ? 'sm' : 'md'}
                    className={viewMode === 'list' ? 'h-6' : 'h-10'}
                    showTooltip
                  />
                ))}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>대비율</span>
                  <span>{metrics.averageContrast.toFixed(1)}:1</span>
                </div>
                <div className="flex justify-between">
                  <span>에너지</span>
                  <span>{metrics.energyLevel === 'high' ? '높음' : 
                       metrics.energyLevel === 'medium' ? '보통' : '낮음'}</span>
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="mt-3 text-center text-xs text-primary font-medium">
                  ✓ 비교 대상으로 선택됨
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}