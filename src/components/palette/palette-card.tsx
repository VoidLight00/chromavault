'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Eye, Share2, MoreHorizontal, Copy } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Palette } from '@/types';
import { MiniColorSwatch } from '@/components/color/color-swatch';
import { Button } from '@/components/ui/button';
import { cn, formatRelativeTime, copyToClipboard } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/ui-store';

interface PaletteCardProps {
  palette: Palette;
  variant?: 'default' | 'compact' | 'grid';
  showActions?: boolean;
  onLike?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function PaletteCard({
  palette,
  variant = 'default',
  showActions = true,
  onLike,
  onShare,
  onDelete,
  className,
}: PaletteCardProps) {
  const { showToast } = useUIStore();
  const [isLiked, setIsLiked] = React.useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLike?.();
    showToast(isLiked ? '좋아요 취소됨' : '좋아요 추가됨', 'success');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/palette/${palette.id}`;
    const success = await copyToClipboard(url);
    if (success) {
      showToast('링크가 복사되었습니다', 'success');
    }
    onShare?.();
  };

  const handleCopyColors = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const colorsText = palette.colors.map(color => color.hex).join(', ');
    const success = await copyToClipboard(colorsText);
    if (success) {
      showToast('색상 코드가 복사되었습니다', 'success');
    }
  };

  if (variant === 'compact') {
    return (
      <Link href={`/palette/${palette.id}`}>
        <div className={cn(
          'group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors',
          className
        )}>
          <div className="flex gap-1">
            {palette.colors.slice(0, 5).map((color, index) => (
              <MiniColorSwatch key={index} color={color} />
            ))}
            {palette.colors.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                +{palette.colors.length - 5}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{palette.name}</h3>
            <p className="text-sm text-muted-foreground">
              {palette.colors.length}개 색상
            </p>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart size={14} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
              <span className="text-sm">{palette.likesCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={14} />
              <span className="text-sm">{palette.viewsCount}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className={cn(
      'group bg-card rounded-lg border overflow-hidden hover:shadow-md transition-shadow',
      className
    )}>
      <Link href={`/palette/${palette.id}`}>
        {/* Color Preview */}
        <div className="aspect-video relative overflow-hidden">
          <div className="flex h-full">
            {palette.colors.map((color, index) => (
              <div
                key={index}
                className="flex-1 transition-all duration-300 hover:flex-[2]"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              {palette.colors.slice(0, 6).map((color, index) => (
                <MiniColorSwatch key={index} color={color} />
              ))}
              {palette.colors.length > 6 && (
                <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-xs font-medium">
                  +{palette.colors.length - 6}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <Link href={`/palette/${palette.id}`}>
              <h3 className="font-semibold truncate hover:text-primary">
                {palette.name}
              </h3>
            </Link>
            {palette.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {palette.description}
              </p>
            )}
          </div>

          {showActions && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="bg-popover border rounded-md shadow-md p-1 min-w-[160px]">
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                    onClick={handleCopyColors}
                  >
                    <Copy size={14} />
                    색상 복사
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                    onClick={handleShare}
                  >
                    <Share2 size={14} />
                    공유
                  </DropdownMenu.Item>
                  {onDelete && (
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                      onClick={() => onDelete()}
                    >
                      삭제
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>

        {/* Tags */}
        {palette.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {palette.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-secondary rounded-full"
              >
                {tag}
              </span>
            ))}
            {palette.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-muted-foreground">
                +{palette.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-muted-foreground">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 hover:text-red-500 transition-colors"
            >
              <Heart size={16} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
              <span className="text-sm">{palette.likesCount}</span>
            </button>
            
            <div className="flex items-center gap-1">
              <Eye size={16} />
              <span className="text-sm">{palette.viewsCount}</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(palette.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}