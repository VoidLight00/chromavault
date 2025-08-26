import { create } from 'zustand';
import { Palette, Color, PaletteSearchFilter } from '@/types';

interface PaletteState {
  palettes: Palette[];
  currentPalette: Palette | null;
  searchFilter: PaletteSearchFilter;
  isLoading: boolean;
  error: string | null;
  
  // Editor state
  editorColors: Color[];
  selectedColorIndex: number | null;
  isEditing: boolean;
}

interface PaletteActions {
  setPalettes: (palettes: Palette[]) => void;
  setCurrentPalette: (palette: Palette | null) => void;
  setSearchFilter: (filter: Partial<PaletteSearchFilter>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Editor actions
  setEditorColors: (colors: Color[]) => void;
  addColor: (color: Color) => void;
  updateColor: (index: number, color: Color) => void;
  removeColor: (index: number) => void;
  reorderColors: (startIndex: number, endIndex: number) => void;
  selectColor: (index: number | null) => void;
  setEditing: (editing: boolean) => void;
  clearEditor: () => void;
}

type PaletteStore = PaletteState & PaletteActions;

export const usePaletteStore = create<PaletteStore>((set, get) => ({
  palettes: [],
  currentPalette: null,
  searchFilter: {},
  isLoading: false,
  error: null,
  
  // Editor state
  editorColors: [],
  selectedColorIndex: null,
  isEditing: false,

  setPalettes: (palettes) => set({ palettes }),
  
  setCurrentPalette: (palette) => set({ currentPalette: palette }),
  
  setSearchFilter: (filter) => 
    set((state) => ({ searchFilter: { ...state.searchFilter, ...filter } })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  // Editor actions
  setEditorColors: (editorColors) => set({ editorColors }),
  
  addColor: (color) => 
    set((state) => ({ 
      editorColors: [...state.editorColors, color] 
    })),
  
  updateColor: (index, color) => 
    set((state) => ({
      editorColors: state.editorColors.map((c, i) => i === index ? color : c)
    })),
  
  removeColor: (index) => 
    set((state) => ({
      editorColors: state.editorColors.filter((_, i) => i !== index),
      selectedColorIndex: state.selectedColorIndex === index ? null : state.selectedColorIndex
    })),
  
  reorderColors: (startIndex, endIndex) => 
    set((state) => {
      const colors = [...state.editorColors];
      const [removed] = colors.splice(startIndex, 1);
      colors.splice(endIndex, 0, removed);
      return { editorColors: colors };
    }),
  
  selectColor: (selectedColorIndex) => set({ selectedColorIndex }),
  
  setEditing: (isEditing) => set({ isEditing }),
  
  clearEditor: () => set({ 
    editorColors: [], 
    selectedColorIndex: null, 
    isEditing: false 
  }),
}));