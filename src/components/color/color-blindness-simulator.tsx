'use client';

import React from 'react';
import { ColorSwatch } from './color-swatch';
import { Color } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Eye, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorBlindnessSimulatorProps {
  colors: Color[];
  className?: string;
}

type ColorBlindnessType = {
  id: string;
  name: string;
  description: string;
  prevalence: string;
  simulate: (hex: string) => string;
};

// Simplified color blindness simulation functions
const simulateProtanopia = (hex: string): string => {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Protanopia transformation matrix (simplified)
  const newR = Math.round(0.567 * r + 0.433 * g);
  const newG = Math.round(0.558 * r + 0.442 * g);
  const newB = Math.round(0.242 * g + 0.758 * b);

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

const simulateDeuteranopia = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Deuteranopia transformation matrix (simplified)
  const newR = Math.round(0.625 * r + 0.375 * g);
  const newG = Math.round(0.700 * r + 0.300 * g);
  const newB = Math.round(0.300 * g + 0.700 * b);

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

const simulateTritanopia = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Tritanopia transformation matrix (simplified)
  const newR = Math.round(0.950 * r + 0.050 * g);
  const newG = Math.round(0.433 * g + 0.567 * b);
  const newB = Math.round(0.475 * g + 0.525 * b);

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

const simulateMonochromacy = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Convert to grayscale using luminance formula
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

  return `#${gray.toString(16).padStart(2, '0')}${gray.toString(16).padStart(2, '0')}${gray.toString(16).padStart(2, '0')}`;
};

const colorBlindnessTypes: ColorBlindnessType[] = [
  {
    id: 'normal',
    name: '정상 시야',
    description: '일반적인 색각',
    prevalence: '대부분',
    simulate: (hex) => hex
  },
  {
    id: 'protanopia',
    name: '적색맹',
    description: '빨간색을 구별하기 어려움',
    prevalence: '남성 1%, 여성 0.01%',
    simulate: simulateProtanopia
  },
  {
    id: 'deuteranopia',
    name: '녹색맹',
    description: '초록색을 구별하기 어려움',
    prevalence: '남성 1%, 여성 0.01%',
    simulate: simulateDeuteranopia
  },
  {
    id: 'tritanopia',
    name: '청색맹',
    description: '파란색을 구별하기 어려움',
    prevalence: '남녀 0.01%',
    simulate: simulateTritanopia
  },
  {
    id: 'monochromacy',
    name: '단색시',
    description: '색상을 구별할 수 없음',
    prevalence: '매우 드묾',
    simulate: simulateMonochromacy
  }
];

export function ColorBlindnessSimulator({ colors, className }: ColorBlindnessSimulatorProps) {
  const [selectedType, setSelectedType] = React.useState('normal');
  
  if (!colors || colors.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Eye size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">색상을 추가하여 색각 시뮬레이션을 시작하세요</p>
      </div>
    );
  }

  const selectedSimulation = colorBlindnessTypes.find(type => type.id === selectedType);
  const simulatedColors = colors.map(color => ({
    ...color,
    simulatedHex: selectedSimulation?.simulate(color.hex) || color.hex
  }));

  // Check for potential issues
  const hasIssues = selectedType !== 'normal' && simulatedColors.some((color, index) => {
    if (index === 0) return false;
    const prevColor = simulatedColors[index - 1];
    // Simple check for similar colors (this could be more sophisticated)
    return Math.abs(
      parseInt(color.simulatedHex.slice(1), 16) - 
      parseInt(prevColor.simulatedHex.slice(1), 16)
    ) < 100000; // Threshold for "too similar"
  });

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          <Eye size={20} />
          색각 시뮬레이터
        </h3>
        <p className="text-muted-foreground text-sm">
          다양한 색각 조건에서 팔레트가 어떻게 보이는지 확인하세요
        </p>
      </div>

      {/* Color Blindness Type Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium">색각 유형</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {colorBlindnessTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                'p-3 text-left border rounded-lg transition-colors',
                selectedType === type.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent border-border'
              )}
            >
              <div className="font-medium text-sm">{type.name}</div>
              <div className="text-xs opacity-70 mt-1">{type.description}</div>
              <div className="text-xs opacity-50 mt-1">유병률: {type.prevalence}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Issues Warning */}
      {hasIssues && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-950 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                접근성 경고
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {selectedSimulation?.name} 사용자에게 일부 색상이 구별하기 어려울 수 있습니다. 
                색상 외에 다른 시각적 구분 요소를 추가하는 것을 권장합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Color Comparison */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            시뮬레이션 결과
            {selectedSimulation && (
              <Badge variant="outline" size="sm" className="ml-2">
                {selectedSimulation.name}
              </Badge>
            )}
          </label>
          
          {selectedType !== 'normal' && (
            <button
              onClick={() => setSelectedType('normal')}
              className="text-sm text-primary hover:underline"
            >
              정상 시야로 비교
            </button>
          )}
        </div>

        {/* Original vs Simulated */}
        <div className="space-y-4">
          {selectedType !== 'normal' && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">원본</h4>
              <div className="grid grid-cols-5 gap-2">
                {colors.map((color, index) => (
                  <div key={`original-${index}`} className="text-center">
                    <ColorSwatch
                      color={color.hex}
                      size="lg"
                      className="w-full h-16 mb-1"
                      showTooltip
                    />
                    <div className="text-xs font-mono">{color.hex.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2 text-foreground">
              {selectedType === 'normal' ? '정상 시야' : '시뮬레이션 결과'}
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {simulatedColors.map((color, index) => (
                <div key={`simulated-${index}`} className="text-center">
                  <ColorSwatch
                    color={color.simulatedHex}
                    size="lg"
                    className="w-full h-16 mb-1"
                    showTooltip
                  />
                  <div className="text-xs font-mono">{color.simulatedHex.toUpperCase()}</div>
                  {selectedType !== 'normal' && color.hex !== color.simulatedHex && (
                    <div className="text-xs text-muted-foreground mt-1">
                      변경됨
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Tips */}
      <div className="bg-accent/50 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-2">💡 색각 접근성 팁</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• 색상만으로 정보를 전달하지 말고 패턴, 텍스트, 아이콘을 함께 사용하세요</li>
          <li>• 충분한 명도 대비를 유지하세요 (WCAG 4.5:1 이상 권장)</li>
          <li>• 빨강-초록, 파랑-노랑 조합을 사용할 때는 특히 주의하세요</li>
          <li>• 전체 인구의 약 8%가 어떤 형태의 색각 이상을 가지고 있습니다</li>
        </ul>
      </div>

      {/* Statistics */}
      {selectedType !== 'normal' && (
        <div className="text-center text-sm text-muted-foreground">
          <p>
            전 세계 인구의 약 {selectedSimulation?.prevalence}이(가) {selectedSimulation?.name}을(를) 경험합니다
          </p>
        </div>
      )}
    </div>
  );
}