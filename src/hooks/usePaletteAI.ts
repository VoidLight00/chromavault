import { useState, useCallback } from 'react';
import { colorAnalyzer } from '@/lib/ai/colorAnalyzer';
import { colorExtractor } from '@/lib/ai/colorExtractor';
import { paletteGenerator, PaletteMood, PaletteStyle } from '@/lib/ai/paletteGenerator';

export interface AIAnalysisResult {
  harmony: {
    score: number;
    type: string;
    description: string;
  };
  accessibility: {
    aa: boolean;
    aaa: boolean;
    contrast: number;
  };
  emotions: string[];
  industries: string[];
  suggestions: Array<{
    type: string;
    colors: string[];
    harmony: number;
  }>;
}

export function usePaletteAI() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [generatedPalette, setGeneratedPalette] = useState<any>(null);

  // Analyze a palette of colors
  const analyzePalette = useCallback(async (colors: string[]) => {
    setIsAnalyzing(true);
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const harmony = colorAnalyzer.analyzeHarmony(colors);
      const emotions = colorAnalyzer.analyzeEmotions(colors);
      const industries = colorAnalyzer.analyzeIndustryRelevance(colors);
      
      // Check accessibility against white and black backgrounds
      const accessibilityWhite = colorAnalyzer.checkAccessibility(colors[0], '#FFFFFF');
      const accessibilityBlack = colorAnalyzer.checkAccessibility(colors[0], '#000000');
      const betterAccessibility = accessibilityWhite.contrast > accessibilityBlack.contrast 
        ? accessibilityWhite 
        : accessibilityBlack;

      // Get suggestions for the primary color
      const suggestions = colorAnalyzer.generateSuggestions(colors[0]);

      const result: AIAnalysisResult = {
        harmony: {
          score: harmony.score,
          type: harmony.type,
          description: harmony.description,
        },
        accessibility: betterAccessibility,
        emotions: emotions.emotions,
        industries: industries.industries,
        suggestions,
      };

      setAnalysis(result);
      return result;
    } catch (error) {
      console.error('Error analyzing palette:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Extract colors from an image
  const extractColorsFromImage = useCallback(async (file: File) => {
    setIsExtracting(true);
    try {
      const extracted = await colorExtractor.extractFromImage(file, {
        maxColors: 5,
        quality: 10,
      });
      
      const colors = extracted.map(c => c.hex);
      setExtractedColors(colors);
      return colors;
    } catch (error) {
      console.error('Error extracting colors:', error);
      throw error;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  // Generate a palette based on mood
  const generateFromMood = useCallback(async (mood: PaletteMood, count: number = 5) => {
    setIsGenerating(true);
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const palette = paletteGenerator.generateFromMood(mood, count);
      setGeneratedPalette(palette);
      return palette;
    } catch (error) {
      console.error('Error generating palette:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Generate a palette based on a base color
  const generateFromColor = useCallback(async (baseColor: string, style: PaletteStyle = 'analogous', count: number = 5) => {
    setIsGenerating(true);
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const palette = paletteGenerator.generateFromColor(baseColor, style, count);
      setGeneratedPalette(palette);
      return palette;
    } catch (error) {
      console.error('Error generating palette:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Get trending palettes
  const getTrendingPalettes = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate several trendy palettes
      const palettes = [
        paletteGenerator.generateFromColor('#FF6B6B', 'trendy', 5),
        paletteGenerator.generateFromColor('#4ECDC4', 'trendy', 5),
        paletteGenerator.generateFromColor('#667EEA', 'trendy', 5),
      ];
      
      return palettes;
    } catch (error) {
      console.error('Error getting trending palettes:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Generate accessible color combinations
  const generateAccessibleColors = useCallback(async (baseColor: string) => {
    try {
      const suggestions = colorAnalyzer.generateSuggestions(baseColor);
      const accessibleCombos = [];

      for (const suggestion of suggestions) {
        const combo = {
          ...suggestion,
          accessibility: suggestion.colors.map(color => ({
            color,
            onWhite: colorAnalyzer.checkAccessibility(color, '#FFFFFF'),
            onBlack: colorAnalyzer.checkAccessibility(color, '#000000'),
          })),
        };
        accessibleCombos.push(combo);
      }

      return accessibleCombos;
    } catch (error) {
      console.error('Error generating accessible colors:', error);
      throw error;
    }
  }, []);

  return {
    // States
    isAnalyzing,
    isGenerating,
    isExtracting,
    analysis,
    extractedColors,
    generatedPalette,
    
    // Actions
    analyzePalette,
    extractColorsFromImage,
    generateFromMood,
    generateFromColor,
    getTrendingPalettes,
    generateAccessibleColors,
    
    // Reset functions
    resetAnalysis: () => setAnalysis(null),
    resetExtractedColors: () => setExtractedColors([]),
    resetGeneratedPalette: () => setGeneratedPalette(null),
  };
}