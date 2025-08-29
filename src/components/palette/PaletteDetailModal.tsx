'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, Download, Share2, Save, Palette, Sparkles, TrendingUp, Users, Copy, Check } from 'lucide-react';
import { usePaletteAI } from '@/hooks/usePaletteAI';

interface Color {
  hex: string;
  rgb?: { r: number; g: number; b: number };
  hsl?: { h: number; s: number; l: number };
  name?: string;
}

interface PaletteData {
  id: number;
  name: string;
  description: string;
  colors: string[];
}

interface PaletteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  palette: PaletteData | null;
}

export function PaletteDetailModal({ isOpen, onClose, palette }: PaletteDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-analysis' | 'collaborate' | 'export'>('overview');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  
  const {
    isAnalyzing,
    analysis,
    analyzePalette,
    resetAnalysis
  } = usePaletteAI();

  useEffect(() => {
    if (isOpen && palette) {
      // Reset states when modal opens
      setActiveTab('overview');
      setCopiedColor(null);
      resetAnalysis();
    }
  }, [isOpen, palette, resetAnalysis]);

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const runAiAnalysis = async () => {
    if (!palette) return;
    await analyzePalette(palette.colors);
  };

  const exportPalette = (format: 'css' | 'json' | 'scss' | 'adobe') => {
    if (!palette) return;

    let content = '';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${palette.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;

    switch (format) {
      case 'css':
        content = `:root {\n${palette.colors.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n')}\n}`;
        downloadFile(content, `${filename}.css`, 'text/css');
        break;
      case 'json':
        content = JSON.stringify({
          name: palette.name,
          colors: palette.colors,
          metadata: {
            created: timestamp,
            source: 'ChromaVault'
          }
        }, null, 2);
        downloadFile(content, `${filename}.json`, 'application/json');
        break;
      case 'scss':
        content = palette.colors.map((c, i) => `$color-${i + 1}: ${c};`).join('\n');
        downloadFile(content, `${filename}.scss`, 'text/scss');
        break;
      case 'adobe':
        // Adobe Swatch Exchange format would require more complex implementation
        alert('Adobe Swatch 형식은 준비 중입니다.');
        break;
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!palette) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative w-full max-w-7xl max-h-[90vh] overflow-hidden rounded-xl"
            style={{ backgroundColor: '#111', border: '2px solid #222' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid #222' }}>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{palette.name}</h2>
                <p className="text-gray-400">{palette.description}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-4" style={{ borderBottom: '1px solid #222' }}>
              {[
                { id: 'overview', label: 'Overview', icon: Palette },
                { id: 'ai-analysis', label: 'AI 분석', icon: Sparkles },
                { id: 'collaborate', label: '협업', icon: Users },
                { id: 'export', label: '내보내기', icon: Download }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === id ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Large Color Display */}
                  <div className="grid grid-cols-3 gap-4">
                    {palette.colors.map((color, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative group"
                      >
                        <div
                          className="h-32 rounded-lg cursor-pointer transition-transform hover:scale-105"
                          style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
                          onClick={() => copyToClipboard(color)}
                        >
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {copiedColor === color ? (
                              <Check className="text-white" size={32} />
                            ) : (
                              <Copy className="text-white" size={32} />
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-white font-mono text-sm">{color}</p>
                          <p className="text-gray-500 text-xs">Click to copy</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Color Combinations */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">색상 조합 프리뷰</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-lg" style={{ backgroundColor: '#0a0a0a' }}>
                        <div className="flex items-center gap-3 mb-4">
                          {palette.colors.map((color, i) => (
                            <div
                              key={i}
                              className="w-12 h-12 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <p className="text-gray-400 text-sm">원형 배치</p>
                      </div>
                      <div className="p-6 rounded-lg" style={{ backgroundColor: '#0a0a0a' }}>
                        <div className="space-y-2">
                          {palette.colors.map((color, i) => (
                            <div
                              key={i}
                              className="h-4 rounded"
                              style={{ backgroundColor: color, width: `${100 - i * 20}%` }}
                            />
                          ))}
                        </div>
                        <p className="text-gray-400 text-sm mt-4">계단식 배치</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai-analysis' && (
                <div className="space-y-6">
                  {!analysis ? (
                    <div className="text-center py-12">
                      <Sparkles className="mx-auto text-gray-500 mb-4" size={48} />
                      <h3 className="text-xl font-semibold text-white mb-2">AI 색상 분석</h3>
                      <p className="text-gray-400 mb-6">인공지능이 팔레트를 분석하여 인사이트를 제공합니다</p>
                      <button
                        onClick={runAiAnalysis}
                        disabled={isAnalyzing}
                        className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {isAnalyzing ? '분석 중...' : '분석 시작'}
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      {/* Harmony Score */}
                      <div className="p-6 rounded-lg" style={{ backgroundColor: '#0a0a0a' }}>
                        <h4 className="text-lg font-semibold text-white mb-4">색상 조화도</h4>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${analysis.harmony.score}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              />
                            </div>
                          </div>
                          <span className="text-2xl font-bold text-white">{analysis.harmony.score}%</span>
                        </div>
                      </div>

                      {/* Emotions & Industries */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-lg" style={{ backgroundColor: '#0a0a0a' }}>
                          <h4 className="text-lg font-semibold text-white mb-4">감정적 연상</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.emotions.map((emotion: string) => (
                              <span key={emotion} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                                {emotion}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="p-6 rounded-lg" style={{ backgroundColor: '#0a0a0a' }}>
                          <h4 className="text-lg font-semibold text-white mb-4">적합한 산업</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.industries.map((industry: string) => (
                              <span key={industry} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                                {industry}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Suggestions */}
                      <div className="p-6 rounded-lg" style={{ backgroundColor: '#0a0a0a' }}>
                        <h4 className="text-lg font-semibold text-white mb-4">추천 색상 조합</h4>
                        <div className="space-y-4">
                          {analysis.suggestions.map((suggestion: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-gray-400 capitalize">{suggestion.type}</span>
                              <div className="flex gap-2">
                                {suggestion.colors.map((color: string) => (
                                  <div
                                    key={color}
                                    className="w-8 h-8 rounded cursor-pointer hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    onClick={() => copyToClipboard(color)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {activeTab === 'collaborate' && (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <Users className="mx-auto text-gray-500 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-white mb-2">실시간 협업</h3>
                    <p className="text-gray-400 mb-6">팀원들과 함께 팔레트를 편집하고 피드백을 공유하세요</p>
                    <div className="flex gap-4 justify-center">
                      <button className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                        협업 세션 시작
                      </button>
                      <button className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                        링크 공유
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'export' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white">내보내기 옵션</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { format: 'css', label: 'CSS Variables', desc: 'CSS 커스텀 속성으로 내보내기' },
                      { format: 'json', label: 'JSON', desc: 'JavaScript 객체로 내보내기' },
                      { format: 'scss', label: 'SCSS Variables', desc: 'Sass 변수로 내보내기' },
                      { format: 'adobe', label: 'Adobe Swatch', desc: 'Adobe 프로그램용 스와치' }
                    ].map(({ format, label, desc }) => (
                      <button
                        key={format}
                        onClick={() => exportPalette(format as any)}
                        className="p-6 rounded-lg text-left hover:bg-gray-900 transition-colors"
                        style={{ backgroundColor: '#0a0a0a', border: '1px solid #222' }}
                      >
                        <h4 className="text-lg font-semibold text-white mb-2">{label}</h4>
                        <p className="text-gray-400 text-sm">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-4 flex justify-between items-center" style={{ borderTop: '1px solid #222' }}>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                  <Save size={18} />
                  저장
                </button>
                <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                  <Share2 size={18} />
                  공유
                </button>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}