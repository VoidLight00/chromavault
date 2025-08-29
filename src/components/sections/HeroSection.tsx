'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Sparkles, Palette, Zap } from 'lucide-react';

export function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        {/* Gradient Mesh */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, #667eea 0%, transparent 50%)`,
            transition: 'background 0.3s ease',
          }}
        />
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/10 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${10 + Math.random() * 20}s`,
              }}
            />
          ))}
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div 
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium">AI-Powered Color Intelligence</span>
        </div>

        {/* Main Heading */}
        <h1 
          className={`text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 transition-all duration-1000 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <span className="gradient-text">Discover Perfect</span>
          <br />
          <span className="chrome-text">Color Harmonies</span>
        </h1>

        {/* Description */}
        <p 
          className={`text-xl text-gray-400 max-w-3xl mx-auto mb-10 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          ChromaVault는 AI 기반 색상 분석과 심리학적 인사이트를 결합하여
          브랜드와 프로젝트에 완벽한 색상 팔레트를 제공합니다.
        </p>

        {/* CTA Buttons */}
        <div 
          className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <Button 
            variant="premium" 
            size="lg" 
            asChild
            className="group"
          >
            <Link href="/editor">
              팔레트 만들기
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            asChild
            className="border-white/20 hover:bg-white/10"
          >
            <Link href="/explore">
              팔레트 탐색하기
            </Link>
          </Button>
        </div>

        {/* Feature Cards */}
        <div 
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="glass-card p-6 rounded-xl hover:scale-105 transition-transform">
            <div className="w-12 h-12 rounded-lg animated-gradient flex items-center justify-center mb-4 mx-auto">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">스마트 색상 생성</h3>
            <p className="text-sm text-gray-400">
              AI가 트렌드와 색상 이론을 분석하여 최적의 조합을 제안합니다
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl hover:scale-105 transition-transform">
            <div className="w-12 h-12 rounded-lg animated-gradient flex items-center justify-center mb-4 mx-auto">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">실시간 협업</h3>
            <p className="text-sm text-gray-400">
              팀원들과 실시간으로 색상 팔레트를 공유하고 편집하세요
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl hover:scale-105 transition-transform">
            <div className="w-12 h-12 rounded-lg animated-gradient flex items-center justify-center mb-4 mx-auto">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">색상 심리학</h3>
            <p className="text-sm text-gray-400">
              색상이 전달하는 감정과 메시지를 과학적으로 분석합니다
            </p>
          </div>
        </div>

        {/* Stats */}
        <div 
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div>
            <div className="text-3xl font-bold gradient-text">10K+</div>
            <div className="text-sm text-gray-400 mt-1">활성 사용자</div>
          </div>
          <div>
            <div className="text-3xl font-bold gradient-text">50K+</div>
            <div className="text-sm text-gray-400 mt-1">생성된 팔레트</div>
          </div>
          <div>
            <div className="text-3xl font-bold gradient-text">99%</div>
            <div className="text-sm text-gray-400 mt-1">만족도</div>
          </div>
          <div>
            <div className="text-3xl font-bold gradient-text">24/7</div>
            <div className="text-sm text-gray-400 mt-1">AI 지원</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center">
          <div className="w-1 h-3 bg-white/40 rounded-full mt-2 animate-scroll" />
        </div>
      </div>
    </section>
  );
}