'use client';

import React from 'react';
import { SketchPicker, ChromePicker } from 'react-color';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Palette } from 'lucide-react';
import { Color } from '@/types';
import { hexToRgb, rgbToHsl } from '@/lib/utils/color-utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  color?: Color;
  onChange: (color: Color) => void;
  trigger?: React.ReactNode;
  pickerType?: 'sketch' | 'chrome';
}

export function ColorPicker({
  color,
  onChange,
  trigger,
  pickerType = 'sketch',
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [currentColor, setCurrentColor] = React.useState(color?.hex || '#3B82F6');

  const handleColorChange = (colorResult: any) => {
    const hex = colorResult.hex;
    const rgb = hexToRgb(hex);
    if (!rgb) return;

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    const newColor: Color = {
      id: color?.id || Math.random().toString(36).slice(2),
      hex,
      rgb,
      hsl,
      name: color?.name,
    };

    setCurrentColor(hex);
    onChange(newColor);
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Palette size={16} />
      색상 선택
    </Button>
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {trigger || defaultTrigger}
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold">
                색상 선택
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon">
                  <X size={16} />
                </Button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              {pickerType === 'sketch' ? (
                <SketchPicker
                  color={currentColor}
                  onChange={handleColorChange}
                  disableAlpha
                />
              ) : (
                <ChromePicker
                  color={currentColor}
                  onChange={handleColorChange}
                  disableAlpha
                />
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Dialog.Close asChild>
                  <Button variant="outline" size="sm">
                    취소
                  </Button>
                </Dialog.Close>
                <Dialog.Close asChild>
                  <Button size="sm">
                    적용
                  </Button>
                </Dialog.Close>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Inline color picker (no dialog)
export function InlineColorPicker({
  color,
  onChange,
  pickerType = 'sketch',
  className,
}: {
  color: Color;
  onChange: (color: Color) => void;
  pickerType?: 'sketch' | 'chrome';
  className?: string;
}) {
  const handleColorChange = (colorResult: any) => {
    const hex = colorResult.hex;
    const rgb = hexToRgb(hex);
    if (!rgb) return;

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    const newColor: Color = {
      ...color,
      hex,
      rgb,
      hsl,
    };

    onChange(newColor);
  };

  return (
    <div className={cn('inline-block', className)}>
      {pickerType === 'sketch' ? (
        <SketchPicker
          color={color.hex}
          onChange={handleColorChange}
          disableAlpha
        />
      ) : (
        <ChromePicker
          color={color.hex}
          onChange={handleColorChange}
          disableAlpha
        />
      )}
    </div>
  );
}

// Quick color selector with predefined colors
export function QuickColorPicker({
  onChange,
  className,
}: {
  onChange: (color: Color) => void;
  className?: string;
}) {
  const predefinedColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
    '#F43F5E', '#6B7280', '#374151', '#111827',
  ];

  const handleColorSelect = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    const color: Color = {
      id: Math.random().toString(36).slice(2),
      hex,
      rgb,
      hsl,
    };

    onChange(color);
  };

  return (
    <div className={cn('grid grid-cols-10 gap-2', className)}>
      {predefinedColors.map((hex) => (
        <button
          key={hex}
          className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
          style={{ backgroundColor: hex }}
          onClick={() => handleColorSelect(hex)}
          title={hex.toUpperCase()}
        />
      ))}
    </div>
  );
}