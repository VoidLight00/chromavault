'use client';

import React from 'react';
import { Copy, Check, Palette } from 'lucide-react';
import { Color } from '@/types';
import { cn, copyToClipboard } from '@/lib/utils';
import { getReadableTextColor } from '@/lib/utils/color-utils';
import { useUIStore } from '@/lib/stores/ui-store';

interface ColorSwatchProps {
  color: Color;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showHex?: boolean;
  showCopy?: boolean;
  onClick?: () => void;
  className?: string;
  interactive?: boolean;
}

export function ColorSwatch({
  color,
  size = 'md',
  showHex = true,
  showCopy = true,
  onClick,
  className,
  interactive = true,
}: ColorSwatchProps) {
  const [copied, setCopied] = React.useState(false);
  const { showToast } = useUIStore();

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24',
  };

  const textColor = getReadableTextColor(color.hex);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(color.hex);
    if (success) {
      setCopied(true);
      showToast(`${color.hex} 복사됨`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast('복사 실패', 'error');
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (interactive) {
      copyToClipboard(color.hex);
    }
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700',
        interactive && 'cursor-pointer transition-transform hover:scale-105',
        className
      )}
      onClick={handleClick}
    >
      {/* Color Display */}
      <div
        className={cn(sizeClasses[size], 'relative flex items-center justify-center')}
        style={{ backgroundColor: color.hex }}
      >
        {/* Color Info Overlay */}
        {(showHex || showCopy) && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1"
            style={{ color: textColor }}
          >
            {showHex && (
              <span className="text-xs font-mono font-bold">
                {color.hex.toUpperCase()}
              </span>
            )}
            {showCopy && (
              <button
                onClick={handleCopy}
                className="p-1 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
              >
                {copied ? (
                  <Check size={size === 'sm' ? 12 : 14} />
                ) : (
                  <Copy size={size === 'sm' ? 12 : 14} />
                )}
              </button>
            )}
          </div>
        )}

        {/* Name Badge */}
        {color.name && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
              {color.name}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      {showHex && (
        <div className="p-2 bg-white dark:bg-gray-800">
          <div className="text-center">
            <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
              {color.hex.toUpperCase()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              RGB({color.rgb.r}, {color.rgb.g}, {color.rgb.b})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Mini version for compact displays
export function MiniColorSwatch({
  color,
  className,
  onClick,
}: {
  color: Color;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'w-6 h-6 rounded-full border-2 border-white shadow-sm cursor-pointer',
        'hover:scale-110 transition-transform',
        className
      )}
      style={{ backgroundColor: color.hex }}
      onClick={onClick}
      title={color.hex.toUpperCase()}
    />
  );
}