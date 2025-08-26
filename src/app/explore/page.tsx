'use client';

import React from 'react';
import { Filter, TrendingUp, Clock, Heart, Star, Users, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/layout/search-bar';
import { PaletteCard } from '@/components/palette/palette-card';
import { Palette } from '@/types';
import { cn } from '@/lib/utils';

// Mock data
const trendingPalettes: Palette[] = [
  {
    id: '1',
    name: 'Aurora Borealis',
    description: '북극광에서 영감을 받은 신비로운 색상들',
    colors: [
      { id: '1', hex: '#1a1a2e', rgb: { r: 26, g: 26, b: 46 }, hsl: { h: 240, s: 28, l: 14 } },
      { id: '2', hex: '#16213e', rgb: { r: 22, g: 33, b: 62 }, hsl: { h: 224, s: 48, l: 16 } },
      { id: '3', hex: '#0f4c75', rgb: { r: 15, g: 76, b: 117 }, hsl: { h: 204, s: 77, l: 26 } },
      { id: '4', hex: '#3282b8', rgb: { r: 50, g: 130, b: 184 }, hsl: { h: 204, s: 57, l: 46 } },
      { id: '5', hex: '#bbe1fa', rgb: { r: 187, g: 225, b: 250 }, hsl: { h: 204, s: 79, l: 86 } },
    ],
    tags: ['aurora', 'night', 'blue', 'mystical'],
    isPublic: true,
    userId: 'user1',
    createdAt: '2024-08-20T10:00:00Z',
    updatedAt: '2024-08-20T10:00:00Z',
    likesCount: 324,
    viewsCount: 1205,
  },
  {
    id: '2',
    name: 'Tropical Sunset',
    description: '열대 지역의 황홀한 노을',
    colors: [
      { id: '1', hex: '#ff6b35', rgb: { r: 255, g: 107, b: 53 }, hsl: { h: 16, s: 100, l: 60 } },
      { id: '2', hex: '#f7931e', rgb: { r: 247, g: 147, b: 30 }, hsl: { h: 32, s: 93, l: 54 } },
      { id: '3', hex: '#ffb347', rgb: { r: 255, g: 179, b: 71 }, hsl: { h: 35, s: 100, l: 64 } },
      { id: '4', hex: '#ffcc5c', rgb: { r: 255, g: 204, b: 92 }, hsl: { h: 41, s: 100, l: 68 } },
      { id: '5', hex: '#ffe66d', rgb: { r: 255, g: 230, b: 109 }, hsl: { h: 50, s: 100, l: 71 } },
    ],
    tags: ['tropical', 'sunset', 'warm', 'orange'],
    isPublic: true,
    userId: 'user2',
    createdAt: '2024-08-19T15:30:00Z',
    updatedAt: '2024-08-19T15:30:00Z',
    likesCount: 289,
    viewsCount: 956,
  },
  {
    id: '3',
    name: 'Forest Whisper',
    description: '숲 속의 조용한 속삭임',
    colors: [
      { id: '1', hex: '#2d5016', rgb: { r: 45, g: 80, b: 22 }, hsl: { h: 96, s: 57, l: 20 } },
      { id: '2', hex: '#3e6b1f', rgb: { r: 62, g: 107, b: 31 }, hsl: { h: 95, s: 55, l: 27 } },
      { id: '3', hex: '#55872e', rgb: { r: 85, g: 135, b: 46 }, hsl: { h: 94, s: 49, l: 35 } },
      { id: '4', hex: '#6ba33f', rgb: { r: 107, g: 163, b: 63 }, hsl: { h: 94, s: 44, l: 44 } },
      { id: '5', hex: '#8bc34a', rgb: { r: 139, g: 195, b: 74 }, hsl: { h: 88, s: 51, l: 53 } },
    ],
    tags: ['forest', 'nature', 'green', 'earthy'],
    isPublic: true,
    userId: 'user3',
    createdAt: '2024-08-18T12:00:00Z',
    updatedAt: '2024-08-18T12:00:00Z',
    likesCount: 156,
    viewsCount: 542,
  },
];

const popularTags = [
  { name: 'blue', count: 1234 },
  { name: 'sunset', count: 987 },
  { name: 'nature', count: 876 },
  { name: 'minimal', count: 654 },
  { name: 'vibrant', count: 543 },
  { name: 'warm', count: 432 },
  { name: 'cool', count: 321 },
  { name: 'gradient', count: 298 },
];

const categories = [
  { id: 'trending', name: '인기', icon: TrendingUp },
  { id: 'recent', name: '최신', icon: Clock },
  { id: 'liked', name: '좋아요 많은', icon: Heart },
  { id: 'featured', name: '추천', icon: Star },
];

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = React.useState('trending');
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [palettes, setPalettes] = React.useState(trendingPalettes);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    // Here you would fetch palettes based on category
    setPalettes(trendingPalettes); // Mock data for now
  };

  const handleTagSelect = (tagName: string) => {
    setSelectedTag(selectedTag === tagName ? null : tagName);
    // Here you would filter palettes by tag
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">팔레트 탐색</h1>
            <p className="text-muted-foreground">
              전 세계 크리에이터들이 만든 아름다운 색상 조합을 발견해보세요
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar
              placeholder="팔레트, 색상, 태그 검색..."
              showFilter
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full border transition-colors',
                    activeCategory === category.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-accent border-border'
                  )}
                >
                  <Icon size={16} />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Popular Tags */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Tag size={18} />
                인기 태그
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => handleTagSelect(tag.name)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full border transition-colors',
                      selectedTag === tag.name
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-accent border-border'
                    )}
                  >
                    #{tag.name}
                    <span className="ml-1 text-xs opacity-70">
                      {tag.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users size={18} />
                커뮤니티 통계
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">총 팔레트</span>
                  <span className="font-semibold">12,345</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">활성 사용자</span>
                  <span className="font-semibold">3,456</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">오늘 생성</span>
                  <span className="font-semibold">89</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">총 좋아요</span>
                  <span className="font-semibold">45,678</span>
                </div>
              </div>
            </div>

            {/* Color of the Day */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">오늘의 색상</h3>
              <div className="space-y-3">
                <div 
                  className="w-full h-24 rounded-lg"
                  style={{ backgroundColor: '#FF6B6B' }}
                />
                <div className="text-center">
                  <h4 className="font-semibold">Coral Pink</h4>
                  <p className="text-sm text-muted-foreground">#FF6B6B</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    따뜻하고 생동감 넘치는 산호 핑크색
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Active Filters */}
            {(selectedTag || activeCategory !== 'trending') && (
              <div className="mb-6 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">필터:</span>
                {activeCategory !== 'trending' && (
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {categories.find(c => c.id === activeCategory)?.name}
                  </span>
                )}
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                  >
                    #{selectedTag} ×
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveCategory('trending');
                    setSelectedTag(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  모든 필터 제거
                </button>
              </div>
            )}

            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {palettes.length}개의 팔레트를 찾았습니다
              </p>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">정렬:</span>
                <select className="text-sm border rounded px-2 py-1 bg-background">
                  <option value="popular">인기순</option>
                  <option value="recent">최신순</option>
                  <option value="likes">좋아요순</option>
                  <option value="views">조회순</option>
                </select>
              </div>
            </div>

            {/* Palettes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {palettes.map((palette) => (
                <PaletteCard
                  key={palette.id}
                  palette={palette}
                  showActions
                />
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                더 많은 팔레트 보기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}