/**
 * UI slice — manages panel visibility and sidebar state.
 */
import type { StateCreator } from 'zustand';

export interface UISlice {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  referenceOpen: boolean;
  setReferenceOpen: (open: boolean) => void;
  hintVisible: boolean;
  setHintVisible: (visible: boolean) => void;
  solutionVisible: boolean;
  setSolutionVisible: (visible: boolean) => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  referenceOpen: false,
  setReferenceOpen: (open) => set({ referenceOpen: open }),
  hintVisible: false,
  setHintVisible: (visible) => set({ hintVisible: visible }),
  solutionVisible: false,
  setSolutionVisible: (visible) => set({ solutionVisible: visible }),
});
