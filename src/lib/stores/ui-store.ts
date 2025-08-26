import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  searchQuery: string;
  activeModal: string | null;
  toast: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null;
}

interface UIActions {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  hideToast: () => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      mobileMenuOpen: false,
      searchQuery: '',
      activeModal: null,
      toast: null,

      setTheme: (theme) => set({ theme }),
      
      toggleSidebar: () => 
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      
      toggleMobileMenu: () => 
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      
      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
      
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      
      openModal: (activeModal) => set({ activeModal }),
      
      closeModal: () => set({ activeModal: null }),
      
      showToast: (message, type) => 
        set({ 
          toast: { 
            id: Math.random().toString(36).slice(2), 
            message, 
            type 
          } 
        }),
      
      hideToast: () => set({ toast: null }),
    }),
    {
      name: 'chromavault-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);