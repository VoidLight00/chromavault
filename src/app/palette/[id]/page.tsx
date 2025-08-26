'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Heart, 
  Eye, 
  Share2, 
  Download, 
  Copy, 
  Edit, 
  Flag, 
  User,
  Calendar,
  Tag,
  ArrowLeft,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorSwatch } from '@/components/color/color-swatch';
import { PaletteCard } from '@/components/palette/palette-card';
import { Palette, Color } from '@/types';
import { cn, formatRelativeTime, copyToClipboard, downloadFile } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/ui-store';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

// Mock data
const mockPalette: Palette = {
  id: '1',
  name: 'Ocean Breeze',
  description: '바다의 시원함과 바람의 자유로움을 담은 팔레트입니다. 평온함과 신선함을 동시에 표현하며, 웹사이트나 앱의 메인 컬러로 사용하기에 완벽합니다.',
  colors: [
    { 
      id: '1', 
      hex: '#0EA5E9', 
      rgb: { r: 14, g: 165, b: 233 }, 
      hsl: { h: 199, s: 89, l: 48 },
      name: 'Ocean Blue'
    },
    { 
      id: '2', 
      hex: '#06B6D4', 
      rgb: { r: 6, g: 182, b: 212 }, 
      hsl: { h: 188, s: 94, l: 43 },
      name: 'Cyan Wave'
    },
    { 
      id: '3', 
      hex: '#0891B2', 
      rgb: { r: 8, g: 145, b: 178 }, 
      hsl: { h: 192, s: 91, l: 36 },
      name: 'Deep Teal'
    },
    { 
      id: '4', 
      hex: '#0E7490', 
      rgb: { r: 14, g: 116, b: 144 }, 
      hsl: { h: 193, s: 82, l: 31 },
      name: 'Dark Cyan'
    },
    { 
      id: '5', 
      hex: '#155E75', 
      rgb: { r: 21, g: 94, b: 117 }, 
      hsl: { h: 194, s: 69, l: 27 },
      name: 'Navy Teal'
    },
  ],
  tags: ['blue', 'ocean', 'cool', 'professional', 'modern'],
  isPublic: true,
  userId: 'user1',
  createdAt: '2024-08-20T10:00:00Z',
  updatedAt: '2024-08-20T10:00:00Z',
  likesCount: 142,
  viewsCount: 567,
};

const relatedPalettes: Palette[] = [
  {
    id: '2',
    name: 'Sky Gradient',
    description: '하늘의 그라데이션',
    colors: [
      { id: '1', hex: '#87CEEB', rgb: { r: 135, g: 206, b: 235 }, hsl: { h: 197, s: 71, l: 73 } },
      { id: '2', hex: '#4682B4', rgb: { r: 70, g: 130, b: 180 }, hsl: { h: 207, s: 44, l: 49 } },
      { id: '3', hex: '#1E90FF', rgb: { r: 30, g: 144, b: 255 }, hsl: { h: 210, s: 100, l: 56 } },
    ],
    tags: ['sky', 'blue', 'gradient'],
    isPublic: true,
    userId: 'user2',
    createdAt: '2024-08-19T15:30:00Z',
    updatedAt: '2024-08-19T15:30:00Z',
    likesCount: 89,
    viewsCount: 234,
  },
  {
    id: '3',
    name: 'Aqua Fresh',
    description: '상쾌한 아쿠아 톤',
    colors: [
      { id: '1', hex: '#00CED1', rgb: { r: 0, g: 206, b: 209 }, hsl: { h: 181, s: 100, l: 41 } },
      { id: '2', hex: '#20B2AA', rgb: { r: 32, g: 178, b: 170 }, hsl: { h: 177, s: 70, l: 41 } },
      { id: '3', hex: '#48D1CC', rgb: { r: 72, g: 209, b: 204 }, hsl: { h: 178, s: 60, l: 55 } },
    ],
    tags: ['aqua', 'fresh', 'turquoise'],
    isPublic: true,
    userId: 'user3',
    createdAt: '2024-08-18T12:00:00Z',
    updatedAt: '2024-08-18T12:00:00Z',
    likesCount: 67,
    viewsCount: 198,
  },
];

export default function PaletteDetailPage() {
  const params = useParams();
  const { showToast } = useUIStore();
  const [isLiked, setIsLiked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(mockPalette.likesCount);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    showToast(isLiked ? '좋아요가 취소되었습니다' : '좋아요를 추가했습니다', 'success');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: mockPalette.name,
          text: mockPalette.description,
          url,
        });
      } catch (err) {
        copyToClipboard(url);
        showToast('링크가 클립보드에 복사되었습니다', 'success');
      }
    } else {
      copyToClipboard(url);
      showToast('링크가 클립보드에 복사되었습니다', 'success');
    }
  };

  const handleCopyColors = async () => {
    const colorsText = mockPalette.colors.map(c => c.hex).join(', ');
    const success = await copyToClipboard(colorsText);
    if (success) {
      showToast('색상 코드가 복사되었습니다', 'success');
    }
  };

  const handleExport = (format: 'css' | 'scss' | 'json') => {
    let content = '';
    let filename = `${mockPalette.name.toLowerCase().replace(/\s+/g, '-')}.${format}`;
    
    switch (format) {
      case 'css':
        content = `:root {\n${mockPalette.colors.map((c, i) => 
          `  --color-${i + 1}: ${c.hex}; /* ${c.name || `Color ${i + 1}`} */`
        ).join('\n')}\n}`;
        break;
      case 'scss':
        content = mockPalette.colors.map((c, i) => 
          `$color-${i + 1}: ${c.hex}; // ${c.name || `Color ${i + 1}`}`
        ).join('\n');
        break;
      case 'json':
        content = JSON.stringify({
          name: mockPalette.name,
          colors: mockPalette.colors.map(c => ({
            name: c.name,
            hex: c.hex,
            rgb: c.rgb,
            hsl: c.hsl,
          }))
        }, null, 2);
        break;
    }
    
    downloadFile(content, filename);
    showToast(`${format.toUpperCase()} 파일이 다운로드되었습니다`, 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/explore">
              <ArrowLeft size={16} />
              탐색으로 돌아가기
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Palette Header */}
            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{mockPalette.name}</h1>
                  <p className="text-muted-foreground leading-relaxed">
                    {mockPalette.description}
                  </p>
                </div>
                
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="bg-popover border rounded-md shadow-md p-1 min-w-[160px]">
                      <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer">
                        <Edit size={14} />
                        복제하여 편집
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer">
                        <Flag size={14} />
                        신고
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {mockPalette.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore?tag=${tag}`}
                    className="px-3 py-1 bg-secondary rounded-full text-sm hover:bg-accent transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  variant={isLiked ? 'default' : 'outline'}
                  onClick={handleLike}
                  className="gap-2"
                >
                  <Heart 
                    size={16} 
                    className={isLiked ? 'fill-current' : ''} 
                  />
                  {likesCount}
                </Button>
                
                <Button variant="outline" onClick={handleShare} className="gap-2">
                  <Share2 size={16} />
                  공유
                </Button>
                
                <Button variant="outline" onClick={handleCopyColors} className="gap-2">
                  <Copy size={16} />
                  복사
                </Button>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Download size={16} />
                      내보내기
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="bg-popover border rounded-md shadow-md p-1 min-w-[160px]">
                      <DropdownMenu.Item 
                        className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                        onClick={() => handleExport('css')}
                      >
                        CSS 변수
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                        onClick={() => handleExport('scss')}
                      >
                        SCSS 변수
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent cursor-pointer"
                        onClick={() => handleExport('json')}
                      >
                        JSON 데이터
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>

                <Button asChild>
                  <Link href="/editor" className="gap-2">
                    <Edit size={16} />
                    복제하여 편집
                  </Link>
                </Button>
              </div>
            </div>

            {/* Color Palette Display */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-6">색상 팔레트</h2>
              
              {/* Large Preview */}
              <div className="mb-8 h-32 rounded-lg overflow-hidden flex shadow-sm">
                {mockPalette.colors.map((color, index) => (
                  <div
                    key={index}
                    className="flex-1 transition-all duration-300 hover:flex-[2] cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => copyToClipboard(color.hex)}
                  />
                ))}
              </div>

              {/* Color Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockPalette.colors.map((color, index) => (
                  <div key={index} className="bg-background rounded-lg p-4 border">
                    <ColorSwatch
                      color={color}
                      size="md"
                      showHex={false}
                      className="mb-3"
                    />
                    
                    <div className="space-y-2">
                      {color.name && (
                        <h3 className="font-medium">{color.name}</h3>
                      )}
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">HEX</span>
                          <button
                            onClick={() => copyToClipboard(color.hex)}
                            className="font-mono hover:text-primary transition-colors"
                          >
                            {color.hex.toUpperCase()}
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">RGB</span>
                          <button
                            onClick={() => copyToClipboard(`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`)}
                            className="font-mono hover:text-primary transition-colors"
                          >
                            {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">HSL</span>
                          <button
                            onClick={() => copyToClipboard(`hsl(${Math.round(color.hsl.h)}, ${Math.round(color.hsl.s)}%, ${Math.round(color.hsl.l)}%)`)}
                            className="font-mono hover:text-primary transition-colors"
                          >
                            {Math.round(color.hsl.h)}°, {Math.round(color.hsl.s)}%, {Math.round(color.hsl.l)}%
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Palettes */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-6">비슷한 팔레트</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedPalettes.map((palette) => (
                  <PaletteCard
                    key={palette.id}
                    palette={palette}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Creator Info */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User size={18} />
                제작자
              </h3>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">디자이너123</h4>
                  <p className="text-sm text-muted-foreground">Pro 멤버</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">팔레트</span>
                  <span>127개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">팔로워</span>
                  <span>1,234명</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">좋아요</span>
                  <span>5,678개</span>
                </div>
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                팔로우
              </Button>
            </div>

            {/* Palette Stats */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">팔레트 정보</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">생성일:</span>
                  <span>{formatRelativeTime(mockPalette.createdAt)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">조회수:</span>
                  <span>{mockPalette.viewsCount.toLocaleString()}회</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">좋아요:</span>
                  <span>{likesCount.toLocaleString()}개</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">태그:</span>
                  <span>{mockPalette.tags.length}개</span>
                </div>
              </div>
            </div>

            {/* Color Theory Info */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">색상 이론</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">색상 조화:</span>
                  <p className="text-muted-foreground mt-1">
                    단색 조화 (Monochromatic)
                  </p>
                </div>
                <div>
                  <span className="font-medium">색온도:</span>
                  <p className="text-muted-foreground mt-1">
                    차가운 톤 (Cool)
                  </p>
                </div>
                <div>
                  <span className="font-medium">활용 분야:</span>
                  <p className="text-muted-foreground mt-1">
                    웹 디자인, 브랜딩, UI/UX
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}