'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ColorSwatch } from '@/components/color/color-swatch';
import { Plus, Minus, RotateCcw, Copy, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GradientStop {
  id: string;
  color: string;
  position: number; // 0-100
}

interface ColorGradientPickerProps {
  initialStops?: GradientStop[];
  onChange?: (stops: GradientStop[], cssGradient: string) => void;
  direction?: 'to right' | 'to left' | 'to bottom' | 'to top' | '45deg' | '90deg' | '135deg' | '180deg';
  className?: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultStops: GradientStop[] = [
  { id: generateId(), color: '#3B82F6', position: 0 },
  { id: generateId(), color: '#8B5CF6', position: 100 }
];

const gradientDirections = [
  { value: 'to right', label: '→ 좌에서 우' },
  { value: 'to left', label: '← 우에서 좌' },
  { value: 'to bottom', label: '↓ 위에서 아래' },
  { value: 'to top', label: '↑ 아래에서 위' },
  { value: '45deg', label: '↗ 대각선 (45°)' },
  { value: '135deg', label: '↘ 대각선 (135°)' },
  { value: '180deg', label: '↓ 수직 (180°)' },
  { value: '90deg', label: '→ 수평 (90°)' }
];

export function ColorGradientPicker({
  initialStops = defaultStops,
  onChange,
  direction = 'to right',
  className
}: ColorGradientPickerProps) {
  const [stops, setStops] = React.useState<GradientStop[]>(initialStops);
  const [selectedStopId, setSelectedStopId] = React.useState<string | null>(stops[0]?.id || null);
  const [gradientDirection, setGradientDirection] = React.useState(direction);

  const generateCSSGradient = React.useCallback((stopsData: GradientStop[], dir: string) => {
    const sortedStops = [...stopsData].sort((a, b) => a.position - b.position);
    const stopStrings = sortedStops.map(stop => `${stop.color} ${stop.position}%`);
    return `linear-gradient(${dir}, ${stopStrings.join(', ')})`;
  }, []);

  React.useEffect(() => {
    const cssGradient = generateCSSGradient(stops, gradientDirection);
    onChange?.(stops, cssGradient);
  }, [stops, gradientDirection, onChange, generateCSSGradient]);

  const addStop = () => {
    if (stops.length >= 6) return; // Limit to 6 stops for performance
    
    // Find a good position for the new stop
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    let newPosition = 50;
    
    // Try to place it between existing stops
    for (let i = 0; i < sortedStops.length - 1; i++) {
      const gap = sortedStops[i + 1].position - sortedStops[i].position;
      if (gap > 20) {
        newPosition = sortedStops[i].position + gap / 2;
        break;
      }
    }

    const newStop: GradientStop = {
      id: generateId(),
      color: '#10B981',
      position: newPosition
    };

    const newStops = [...stops, newStop];
    setStops(newStops);
    setSelectedStopId(newStop.id);
  };

  const removeStop = (stopId: string) => {
    if (stops.length <= 2) return; // Keep at least 2 stops
    
    const newStops = stops.filter(stop => stop.id !== stopId);
    setStops(newStops);
    
    if (selectedStopId === stopId) {
      setSelectedStopId(newStops[0]?.id || null);
    }
  };

  const updateStop = (stopId: string, updates: Partial<GradientStop>) => {
    const newStops = stops.map(stop => 
      stop.id === stopId ? { ...stop, ...updates } : stop
    );
    setStops(newStops);
  };

  const resetGradient = () => {
    setStops(defaultStops);
    setSelectedStopId(defaultStops[0].id);
    setGradientDirection('to right');
  };

  const copyGradient = () => {
    const cssGradient = generateCSSGradient(stops, gradientDirection);
    navigator.clipboard.writeText(`background: ${cssGradient};`);
  };

  const selectedStop = stops.find(stop => stop.id === selectedStopId);
  const cssGradient = generateCSSGradient(stops, gradientDirection);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          <Palette size={20} />
          그라디언트 생성기
        </h3>
        <p className="text-muted-foreground text-sm">
          아름다운 색상 그라디언트를 만들고 CSS 코드를 생성하세요
        </p>
      </div>

      {/* Gradient Preview */}
      <div className="space-y-3">
        <label className="text-sm font-medium">미리보기</label>
        <div
          className="w-full h-32 rounded-lg border relative overflow-hidden"
          style={{ background: cssGradient }}
        >
          {/* Gradient Stops Markers */}
          <div className="absolute bottom-2 left-2 right-2 h-4 bg-white/90 rounded border relative">
            {stops.map(stop => (
              <button
                key={stop.id}
                onClick={() => setSelectedStopId(stop.id)}
                className={cn(
                  'absolute top-0 w-4 h-4 border-2 rounded-full transform -translate-x-1/2 transition-all',
                  selectedStopId === stop.id 
                    ? 'border-white shadow-lg scale-110' 
                    : 'border-gray-300 hover:border-white'
                )}
                style={{
                  left: `${stop.position}%`,
                  backgroundColor: stop.color
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Direction Control */}
      <div className="space-y-3">
        <label className="text-sm font-medium">그라디언트 방향</label>
        <select
          value={gradientDirection}
          onChange={(e) => setGradientDirection(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background"
        >
          {gradientDirections.map(dir => (
            <option key={dir.value} value={dir.value}>
              {dir.label}
            </option>
          ))}
        </select>
      </div>

      {/* Color Stops Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">색상 지점 ({stops.length}/6)</label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addStop}
              disabled={stops.length >= 6}
            >
              <Plus size={14} />
              추가
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetGradient}
            >
              <RotateCcw size={14} />
              초기화
            </Button>
          </div>
        </div>

        {/* Stop List */}
        <div className="space-y-3">
          {stops
            .sort((a, b) => a.position - b.position)
            .map((stop, index) => (
              <div
                key={stop.id}
                className={cn(
                  'flex items-center gap-3 p-3 border rounded-lg transition-colors',
                  selectedStopId === stop.id 
                    ? 'bg-accent border-primary' 
                    : 'bg-background'
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <ColorSwatch
                    color={stop.color}
                    size="sm"
                    className="w-8 h-8 flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">지점 {index + 1}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {stop.color} • {stop.position}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Color Input */}
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                    className="w-8 h-8 border border-border rounded cursor-pointer"
                  />

                  {/* Position Input */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={stop.position}
                    onChange={(e) => updateStop(stop.id, { position: parseInt(e.target.value) })}
                    className="w-20"
                  />

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStop(stop.id)}
                    disabled={stops.length <= 2}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Minus size={14} />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Color Input for Selected Stop */}
      {selectedStop && (
        <div className="space-y-3">
          <label className="text-sm font-medium">
            선택된 색상 지점 편집
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={selectedStop.color}
              onChange={(e) => updateStop(selectedStop.id, { color: e.target.value })}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
              placeholder="#3B82F6"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={selectedStop.position}
              onChange={(e) => updateStop(selectedStop.id, { position: parseInt(e.target.value) || 0 })}
              className="w-20 px-3 py-2 border border-border rounded-lg bg-background text-sm"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
      )}

      {/* CSS Output */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">CSS 코드</label>
          <Button
            variant="outline"
            size="sm"
            onClick={copyGradient}
          >
            <Copy size={14} />
            복사
          </Button>
        </div>
        <div className="bg-muted rounded-lg p-3">
          <code className="text-sm font-mono break-all">
            background: {cssGradient};
          </code>
        </div>
      </div>

      {/* Preset Gradients */}
      <div className="space-y-3">
        <label className="text-sm font-medium">인기 그라디언트</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            {
              name: '오션',
              stops: [
                { id: generateId(), color: '#667eea', position: 0 },
                { id: generateId(), color: '#764ba2', position: 100 }
              ]
            },
            {
              name: '선셋',
              stops: [
                { id: generateId(), color: '#ff6b6b', position: 0 },
                { id: generateId(), color: '#ffa726', position: 100 }
              ]
            },
            {
              name: '포레스트',
              stops: [
                { id: generateId(), color: '#56ab2f', position: 0 },
                { id: generateId(), color: '#a8e6cf', position: 100 }
              ]
            },
            {
              name: '라벤더',
              stops: [
                { id: generateId(), color: '#a8edea', position: 0 },
                { id: generateId(), color: '#fed6e3', position: 100 }
              ]
            }
          ].map(preset => (
            <button
              key={preset.name}
              onClick={() => {
                setStops(preset.stops);
                setSelectedStopId(preset.stops[0].id);
              }}
              className="p-2 border rounded-lg text-center hover:bg-accent transition-colors"
            >
              <div
                className="w-full h-8 rounded mb-1"
                style={{
                  background: generateCSSGradient(preset.stops, gradientDirection)
                }}
              />
              <div className="text-xs font-medium">{preset.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}