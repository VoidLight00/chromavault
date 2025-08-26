'use client';

import React from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Share2, 
  Shuffle, 
  Palette,
  Eye,
  EyeOff,
  Copy,
  Undo,
  Redo,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorSwatch } from '@/components/color/color-swatch';
import { ColorPicker, QuickColorPicker } from '@/components/color/color-picker';
import { Color } from '@/types';
import { 
  generateRandomColor, 
  generateComplementaryColor,
  generateAnalogousColors,
  generateTriadicColors 
} from '@/lib/utils/color-utils';
import { cn, copyToClipboard, downloadFile } from '@/lib/utils';
import { usePaletteStore } from '@/lib/stores/palette-store';
import { useUIStore } from '@/lib/stores/ui-store';

const harmonies = [
  { 
    type: 'complementary', 
    name: '보색 조합', 
    description: '대비가 강한 조화로운 색상' 
  },
  { 
    type: 'analogous', 
    name: '유사 색상', 
    description: '인접한 색상들의 자연스러운 조합' 
  },
  { 
    type: 'triadic', 
    name: '삼각 배색', 
    description: '균형잡힌 세 가지 색상' 
  },
];

export default function EditorPage() {
  const { 
    editorColors, 
    selectedColorIndex, 
    setEditorColors,
    addColor,
    updateColor,
    removeColor,
    reorderColors,
    selectColor,
    clearEditor 
  } = usePaletteStore();
  
  const { showToast } = useUIStore();
  
  const [paletteName, setPaletteName] = React.useState('');
  const [paletteDescription, setPaletteDescription] = React.useState('');
  const [showPreview, setShowPreview] = React.useState(false);
  const [history, setHistory] = React.useState<Color[][]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);

  // Initialize with some colors if empty
  React.useEffect(() => {
    if (editorColors.length === 0) {
      const initialColors = Array.from({ length: 4 }, () => generateRandomColor());
      setEditorColors(initialColors);
      setHistory([initialColors]);
      setHistoryIndex(0);
    }
  }, [editorColors, setEditorColors]);

  const saveToHistory = (colors: Color[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...colors]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleAddColor = () => {
    if (editorColors.length >= 10) {
      showToast('최대 10개의 색상까지 추가할 수 있습니다', 'warning');
      return;
    }
    
    const newColor = generateRandomColor();
    const newColors = [...editorColors, newColor];
    setEditorColors(newColors);
    saveToHistory(newColors);
  };

  const handleRemoveColor = (index: number) => {
    if (editorColors.length <= 2) {
      showToast('최소 2개의 색상이 필요합니다', 'warning');
      return;
    }
    
    const newColors = editorColors.filter((_, i) => i !== index);
    setEditorColors(newColors);
    saveToHistory(newColors);
  };

  const handleColorChange = (index: number, newColor: Color) => {
    const newColors = [...editorColors];
    newColors[index] = newColor;
    setEditorColors(newColors);
    saveToHistory(newColors);
  };

  const handleGenerateHarmony = (type: string) => {
    if (editorColors.length === 0) return;
    
    const baseColor = editorColors[selectedColorIndex || 0];
    let newColors: Color[] = [];
    
    switch (type) {
      case 'complementary':
        newColors = [baseColor, generateComplementaryColor(baseColor.hex)];
        break;
      case 'analogous':
        newColors = generateAnalogousColors(baseColor.hex, 5);
        break;
      case 'triadic':
        newColors = generateTriadicColors(baseColor.hex);
        break;
      default:
        newColors = Array.from({ length: editorColors.length }, () => generateRandomColor());
    }
    
    setEditorColors(newColors);
    saveToHistory(newColors);
    showToast(`${harmonies.find(h => h.type === type)?.name} 생성 완료`, 'success');
  };

  const handleRandomize = () => {
    const newColors = Array.from({ length: editorColors.length }, () => generateRandomColor());
    setEditorColors(newColors);
    saveToHistory(newColors);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setEditorColors(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setEditorColors(history[historyIndex + 1]);
    }
  };

  const handleSave = () => {
    if (!paletteName.trim()) {
      showToast('팔레트 이름을 입력해주세요', 'error');
      return;
    }
    
    // Here you would save to your backend
    showToast('팔레트가 저장되었습니다', 'success');
  };

  const handleExport = (format: 'json' | 'css' | 'scss' | 'aco') => {
    let content = '';
    let filename = `${paletteName || 'palette'}.${format}`;
    
    switch (format) {
      case 'json':
        content = JSON.stringify({
          name: paletteName,
          description: paletteDescription,
          colors: editorColors.map(c => ({
            hex: c.hex,
            rgb: c.rgb,
            hsl: c.hsl,
          }))
        }, null, 2);
        break;
      case 'css':
        content = `:root {\n${editorColors.map((c, i) => 
          `  --color-${i + 1}: ${c.hex};`
        ).join('\n')}\n}`;
        break;
      case 'scss':
        content = editorColors.map((c, i) => 
          `$color-${i + 1}: ${c.hex};`
        ).join('\n');
        break;
    }
    
    downloadFile(content, filename);
    showToast(`${format.toUpperCase()} 파일이 다운로드되었습니다`, 'success');
  };

  const handleShare = async () => {
    const colorsText = editorColors.map(c => c.hex).join(', ');
    const shareText = `${paletteName || '내 팔레트'}: ${colorsText}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: paletteName || '색상 팔레트',
          text: shareText,
        });
      } catch (err) {
        copyToClipboard(shareText);
        showToast('팔레트 정보가 클립보드에 복사되었습니다', 'success');
      }
    } else {
      copyToClipboard(shareText);
      showToast('팔레트 정보가 클립보드에 복사되었습니다', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">팔레트 에디터</h1>
              <p className="text-muted-foreground mt-1">
                색상을 조합하여 완벽한 팔레트를 만들어보세요
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPreview ? '미리보기 끄기' : '미리보기'}
              </Button>
              
              <Button
                onClick={handleSave}
                className="gap-2"
              >
                <Save size={16} />
                저장
              </Button>
            </div>
          </div>

          {/* Palette Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">팔레트 이름</label>
              <input
                type="text"
                value={paletteName}
                onChange={(e) => setPaletteName(e.target.value)}
                placeholder="예: 여름 바다"
                className="w-full p-3 border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">설명 (선택사항)</label>
              <input
                type="text"
                value={paletteDescription}
                onChange={(e) => setPaletteDescription(e.target.value)}
                placeholder="팔레트에 대한 간단한 설명"
                className="w-full p-3 border rounded-lg bg-background"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="xl:col-span-2 space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-4 bg-card rounded-lg border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="gap-2"
              >
                <Undo size={16} />
                실행 취소
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="gap-2"
              >
                <Redo size={16} />
                다시 실행
              </Button>
              
              <div className="h-6 w-px bg-border mx-2" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddColor}
                className="gap-2"
              >
                <Plus size={16} />
                색상 추가
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomize}
                className="gap-2"
              >
                <Shuffle size={16} />
                랜덤
              </Button>
              
              <div className="h-6 w-px bg-border mx-2" />
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 size={16} />
                </Button>
                
                <div className="relative">
                  <Button variant="outline" size="sm">
                    <Download size={16} />
                  </Button>
                  {/* Export dropdown would go here */}
                </div>
              </div>
            </div>

            {/* Color Palette */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">색상 팔레트</h3>
              
              {/* Large Preview */}
              {showPreview && (
                <div className="mb-6 h-32 rounded-lg overflow-hidden flex">
                  {editorColors.map((color, index) => (
                    <div
                      key={index}
                      className="flex-1 transition-all duration-300"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              )}
              
              {/* Color Swatches */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {editorColors.map((color, index) => (
                  <div key={index} className="space-y-3">
                    <div 
                      className={cn(
                        'relative',
                        selectedColorIndex === index && 'ring-2 ring-primary ring-offset-2 rounded-lg'
                      )}
                    >
                      <ColorSwatch
                        color={color}
                        size="xl"
                        onClick={() => selectColor(index)}
                        className="w-full"
                      />
                      
                      {editorColors.length > 2 && (
                        <button
                          onClick={() => handleRemoveColor(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    
                    <ColorPicker
                      color={color}
                      onChange={(newColor) => handleColorChange(index, newColor)}
                      trigger={
                        <Button variant="outline" size="sm" className="w-full">
                          <Palette size={14} />
                        </Button>
                      }
                    />
                  </div>
                ))}
                
                {/* Add Color Button */}
                {editorColors.length < 10 && (
                  <button
                    onClick={handleAddColor}
                    className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-primary transition-colors"
                  >
                    <Plus size={24} className="text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Color Harmonies */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">색상 조화</h3>
              <div className="space-y-3">
                {harmonies.map((harmony) => (
                  <button
                    key={harmony.type}
                    onClick={() => handleGenerateHarmony(harmony.type)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{harmony.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {harmony.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Colors */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">빠른 색상 선택</h3>
              <QuickColorPicker
                onChange={(color) => {
                  if (selectedColorIndex !== null) {
                    handleColorChange(selectedColorIndex, color);
                  } else {
                    addColor(color);
                  }
                }}
              />
            </div>

            {/* Color Info */}
            {selectedColorIndex !== null && editorColors[selectedColorIndex] && (
              <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">색상 정보</h3>
                <div className="space-y-3">
                  {(() => {
                    const color = editorColors[selectedColorIndex];
                    return (
                      <>
                        <div>
                          <label className="text-sm font-medium">HEX</label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 p-2 bg-muted rounded text-sm">
                              {color.hex.toUpperCase()}
                            </code>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(color.hex)}
                            >
                              <Copy size={14} />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">RGB</label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 p-2 bg-muted rounded text-sm">
                              {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
                            </code>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`)}
                            >
                              <Copy size={14} />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">HSL</label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 p-2 bg-muted rounded text-sm">
                              {Math.round(color.hsl.h)}°, {Math.round(color.hsl.s)}%, {Math.round(color.hsl.l)}%
                            </code>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(`hsl(${Math.round(color.hsl.h)}, ${Math.round(color.hsl.s)}%, ${Math.round(color.hsl.l)}%)`)}
                            >
                              <Copy size={14} />
                            </Button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}