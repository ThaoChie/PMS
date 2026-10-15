import { create } from 'zustand';
import type { Screen } from '../types';

interface UIState {
  isSidebarCollapsed: boolean;
  currentScreen: Screen;
  selectedIssueId: string | null;
  showCreateIssue: boolean;
  showCreateProject: boolean;
  showQuickSearch: boolean;

  toggleSidebar: () => void;
  setCurrentScreen: (screen: Screen) => void;
  setSelectedIssueId: (id: string | null) => void;
  setShowCreateIssue: (show: boolean) => void;
  setShowCreateProject: (show: boolean) => void;
  setShowQuickSearch: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  currentScreen: 'board',
  selectedIssueId: null,
  showCreateIssue: false,
  showCreateProject: false,
  showQuickSearch: false,

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setCurrentScreen: (currentScreen) => set({ currentScreen, selectedIssueId: null }),
  setSelectedIssueId: (selectedIssueId) => set({ selectedIssueId }),
  setShowCreateIssue: (showCreateIssue) => set({ showCreateIssue }),
  setShowCreateProject: (showCreateProject) => set({ showCreateProject }),
  setShowQuickSearch: (showQuickSearch) => set({ showQuickSearch }),
}));
