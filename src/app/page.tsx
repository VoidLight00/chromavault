'use client';

import React from 'react';
import Link from 'next/link';
import { PlusCircle, Palette, TrendingUp, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/layout/search-bar';
import { PaletteCardPremium } from '@/components/palette-card-premium';
import { ColorSwatch } from '@/components/color/color-swatch';
import { QuickColorPicker } from '@/components/color/color-picker';
import { generateRandomColor } from '@/lib/utils/color-utils';
import { Palette as PaletteType } from '@/types';

// Premium palette data
const featuredPalettes = [
  {
    id: '1',
    name: 'Neon Dreams',
    description: 'Cyberpunk-inspired neon colors with electric vibes',
    colors: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC'],
    tags: ['neon', 'cyberpunk', 'vibrant'],
    likes: 234,
    views: 1567,
    date: '2025-01-26',
    number: '001',
  },
  {
    id: '2',
    name: 'Midnight Aurora',
    description: 'Deep space colors with aurora borealis hints',
    colors: ['#003049', '#0077B6', '#00B4D8', '#90E0EF'],
    tags: ['dark', 'space', 'aurora'],
    likes: 189,
    views: 987,
    date: '2025-01-25',
    number: '002',
  },
  {
    id: '3',
    name: 'Tokyo Sunset',
    description: 'Urban sunset palette inspired by Tokyo skyline',
    colors: ['#FF4365', '#FBAF00', '#00D9FF', '#7B2CBF'],
    tags: ['sunset', 'urban', 'japan'],
    likes: 312,
    views: 2341,
    date: '2025-01-24',
    number: '003',
  },
];

export default function Home() {
  const [randomColors, setRandomColors] = React.useState<any[]>([]);

  React.useEffect(() => {
    setRandomColors(Array.from({ length: 8 }, () => generateRandomColor()));
  }, []);

  const handleColorSelect = (color: any) => {
    console.log('Selected color:', color);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-[3px] mb-6">
              ChromaVault
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              완벽한 색상 조합을 찾고, 저장하고, 공유하는 
              <br className="hidden md:block" />
              크리에이티브를 위한 컬러 팔레트 플랫폼
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-wide" asChild>
              <Link href="/editor" className="gap-2">
                <PlusCircle size={20} />
                Create Palette
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-[#333] text-white hover:bg-white hover:text-black font-bold uppercase tracking-wide" asChild>
              <Link href="/explore" className="gap-2">
                <Palette size={20} />
                Explore
              </Link>
            </Button>
          </div>

          {/* Quick Search */}
          <div className="max-w-2xl mx-auto">
            <SearchBar
              placeholder="원하는 팔레트를 검색해보세요..."
              className="mb-8"
            />
          </div>
        </div>
      </section>

      {/* Quick Color Inspiration */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white uppercase tracking-wide mb-4">Quick Inspiration</h2>
            <p className="text-gray-400">
              무작위 색상들로 새로운 영감을 얻어보세요
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {randomColors.map((color, index) => (
              <ColorSwatch
                key={index}
                color={color}
                size="lg"
                showHex={false}
                onClick={() => handleColorSelect(color)}
              />
            ))}
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setRandomColors(Array.from({ length: 8 }, () => generateRandomColor()))}
            >
              새 색상 생성
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Color Picker */}
      <section className="py-16 px-4 bg-[#111] border-y-2 border-[#222]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white uppercase tracking-wide mb-8">Color Picker</h2>
          <QuickColorPicker onChange={handleColorSelect} />
        </div>
      </section>

      {/* Featured Palettes */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white uppercase tracking-wide mb-2">Popular Palettes</h2>
              <p className="text-gray-400">
                Most loved color combinations from our community
              </p>
            </div>
            <Button variant="outline" className="border-[#333] text-white hover:bg-white hover:text-black uppercase tracking-wide" asChild>
              <Link href="/explore" className="gap-2">
                View All
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPalettes.map((palette) => (
              <PaletteCardPremium
                key={palette.id}
                {...palette}
              />
            ))}
            
            {/* Create New Palette Card */}
            <Link href="/editor">
              <div className="group bg-[#111] border-2 border-dashed border-[#333] rounded-xl p-8 hover:border-[#666] transition-all duration-300 hover:-translate-y-1 h-full flex flex-col items-center justify-center text-center min-h-[350px]">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                  <PlusCircle size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-wide text-white mb-2">Create New</h3>
                <p className="text-gray-400">
                  Design your own unique color palette
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-[#111] border-y-2 border-[#222]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white uppercase tracking-wide mb-4">Premium Features</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              전문적인 디자인 작업부터 개인 프로젝트까지, 
              모든 창작 활동을 위한 완벽한 도구를 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Intuitive Editor</h3>
              <p className="text-gray-400">
                드래그 앤 드롭으로 쉽게 색상을 조정하고, 
                실시간으로 조화로운 팔레트를 만들 수 있습니다
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Recommendations</h3>
              <p className="text-gray-400">
                색상 이론을 기반으로 완벽한 조합을 제안하고, 
                트렌드에 맞는 팔레트를 추천합니다
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Community Sharing</h3>
              <p className="text-gray-400">
                전세계 크리에이터들과 팔레트를 공유하고, 
                영감을 주고받을 수 있습니다
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wide mb-6">
            Start Creating Today
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join free and create unlimited color palettes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-wide" asChild>
              <Link href="/auth/signup">
                Get Started Free
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-[#333] text-white hover:bg-white hover:text-black font-bold uppercase tracking-wide" asChild>
              <Link href="/explore">
                Browse Palettes
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
