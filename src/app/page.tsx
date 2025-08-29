'use client';

import { useState } from 'react';
import { PaletteDetailModal } from '@/components/palette/PaletteDetailModal';
import { HeroSection } from '@/components/sections/HeroSection';

export default function HomePage() {
  const [selectedPalette, setSelectedPalette] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const palettes = [
    { id: 1, name: 'Luxury Gold', description: '금빛 럭셔리와 로열 블루, 마젠타의 고급스러운 조합', colors: ['#FFD700', '#4169E1', '#FF1493'] },
    { id: 2, name: 'Neon Cyber', description: '사이버펑크 네온 - 시안, 마젠타, 옐로우', colors: ['#00FFFF', '#FF00FF', '#FFFF00'] },
    { id: 3, name: 'Royal Elegance', description: '왕실의 품격 - 보라, 토마토 레드, 터콰이즈', colors: ['#9370DB', '#FF6347', '#20B2AA'] },
    { id: 4, name: 'Nordic Aurora', description: '북유럽 오로라 - 아이스 블루, 민트, 핫 핑크', colors: ['#00D4FF', '#00FF88', '#FF0080'] },
    { id: 5, name: 'Monochrome Accent', description: '모노크롬 액센트 - 화이트, 레드, 그레이', colors: ['#FFFFFF', '#FF3366', '#666666'] },
    { id: 6, name: 'Ocean Depths', description: '심해의 신비 - 딥 블루, 터콰이즈, 코랄', colors: ['#0077BE', '#40E0D0', '#FF7F50'] },
    { id: 7, name: 'Sunset Gradient', description: '석양 그라데이션 - 레드, 오렌지, 퍼플', colors: ['#FF512F', '#F09819', '#764BA2'] },
    { id: 8, name: 'Terminal Green', description: '터미널 그린 - 네온 그린, 오렌지, 스카이 블루', colors: ['#00FF00', '#FFA500', '#00BFFF'] },
    { id: 9, name: 'Pastel Dream', description: '파스텔 드림 - 베이비 핑크, 라벤더, 스카이', colors: ['#FFB6C1', '#B19CD9', '#87CEEB'] },
    { id: 10, name: 'Electric Voltage', description: '일렉트릭 볼티지 - 옐로우, 시안, 마젠타', colors: ['#FCFF00', '#00F5FF', '#FF00AA'] },
    { id: 11, name: 'Minimal Contrast', description: '미니멀 컨트라스트 - 화이트, 블루, 앰버', colors: ['#F5F5F5', '#2196F3', '#FFC107'] },
    { id: 12, name: 'Gradient Master', description: '그라데이션 마스터 - 퍼플, 핑크, 블루', colors: ['#667eea', '#f093fb', '#4facfe'] },
  ];

  const handlePaletteClick = (id: number) => {
    setSelectedPalette(id);
  };

  const copyCode = () => {
    const palette = palettes.find(p => p.id === selectedPalette);
    if (!palette) return;

    const code = `// ${palette.name} Color Palette
const colorPalette = {
    primary: "${palette.colors[0]}",
    secondary: "${palette.colors[1]}",
    accent: "${palette.colors[2]}"
};`;

    navigator.clipboard.writeText(code).then(() => {
      const button = document.getElementById('copyButton') as HTMLButtonElement;
      if (button) {
        button.textContent = 'COPIED!';
        button.style.background = '#00FF00';
        button.style.color = '#000';
        setTimeout(() => {
          button.textContent = 'COPY CODE';
          button.style.background = '#333';
          button.style.color = '#fff';
        }, 2000);
      }
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#ffffff',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
    }}>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Palettes Section */}
      <div style={{ padding: '40px 20px', maxWidth: '1600px', margin: '0 auto' }}>
        <h1 className="gradient-text" style={{
          fontSize: '48px',
          fontWeight: 900,
          textAlign: 'center',
          marginBottom: '20px',
          textTransform: 'uppercase',
          letterSpacing: '-2px'
        }}>
          Premium Color Palettes
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '18px',
          marginBottom: '60px',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          ChromaVault - 완벽한 색상 조합을 찾고, 저장하고, 공유하세요
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '40px',
          marginBottom: '60px'
        }}>
          {palettes.map(palette => (
            <div
              key={palette.id}
              onClick={() => handlePaletteClick(palette.id)}
              className={`glass-card glass-card-hover palette-card ${selectedPalette === palette.id ? 'gradient-border' : ''}`}
              style={{
                padding: '30px',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                transform: selectedPalette === palette.id ? 'translateY(-5px)' : 'none',
                boxShadow: selectedPalette === palette.id ? '0 10px 40px rgba(0, 0, 0, 0.5)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedPalette !== palette.id) {
                  e.currentTarget.style.borderColor = '#444';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPalette !== palette.id) {
                  e.currentTarget.style.borderColor = '#222';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{
                fontSize: '14px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '10px'
              }}>
                Palette {String(palette.id).padStart(2, '0')}
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {palette.name}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#999',
                marginBottom: '30px',
                lineHeight: '1.6'
              }}>
                {palette.description}
              </div>
              
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px'
              }}>
                {palette.colors.map((color, index) => (
                  <div
                    key={index}
                    className="color-sample"
                    style={{
                      flex: 1,
                      height: '80px',
                      borderRadius: '8px',
                      background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      const span = e.currentTarget.querySelector('span');
                      if (span) (span as HTMLElement).style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      const span = e.currentTarget.querySelector('span');
                      if (span) (span as HTMLElement).style.opacity = '0';
                    }}
                  >
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'white',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease'
                    }}>
                      {color}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px'
              }}>
                {palette.colors.map((color, index) => (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: '4px',
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#0a0a0a'
                    }}
                  >
                    <div style={{
                      height: '100%',
                      width: selectedPalette === palette.id ? '100%' : '80%',
                      background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                ))}
              </div>

              <button
                style={{
                  width: '100%',
                  padding: '15px',
                  background: selectedPalette === palette.id ? '#fff' : 'transparent',
                  border: selectedPalette === palette.id ? '2px solid #fff' : '2px solid #333',
                  color: selectedPalette === palette.id ? '#000' : '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: '20px'
                }}
                onMouseEnter={(e) => {
                  if (selectedPalette !== palette.id) {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#000';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPalette !== palette.id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePaletteClick(palette.id);
                  setIsModalOpen(true);
                }}
              >
                SELECT PALETTE
              </button>
            </div>
          ))}
        </div>

        {selectedPalette && (
          <div style={{
            background: '#1a1a1a',
            border: '2px solid #333',
            borderRadius: '8px',
            padding: '30px',
            marginTop: '60px'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '20px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Selected Color Palette
            </div>
            <div style={{
              background: '#0a0a0a',
              padding: '20px',
              borderRadius: '4px',
              fontFamily: "'SF Mono', monospace",
              fontSize: '14px',
              lineHeight: '1.6',
              overflowX: 'auto'
            }}>
              <pre style={{ margin: 0 }}>
{`// ${palettes.find(p => p.id === selectedPalette)?.name} Color Palette
const colorPalette = {
    primary: "${palettes.find(p => p.id === selectedPalette)?.colors[0]}",
    secondary: "${palettes.find(p => p.id === selectedPalette)?.colors[1]}",
    accent: "${palettes.find(p => p.id === selectedPalette)?.colors[2]}"
};`}
              </pre>
            </div>
            <button
              id="copyButton"
              onClick={copyCode}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                background: '#333',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#444'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#333'}
            >
              COPY CODE
            </button>
          </div>
        )}
      </div>

      {/* Palette Detail Modal */}
      <PaletteDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        palette={selectedPalette ? palettes.find(p => p.id === selectedPalette) || null : null}
      />
    </div>
  );
}