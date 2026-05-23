/**
 * UI slice — manages panel visibility and sidebar state.
 */
import type { StateCreator } from 'zustand';

export interface UISlice {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  referenceOpen: boolean;
  setReferenceOpen: (open: boolean) => void;
  // Progressive hints: null = no hints revealed, 1/2/3 = highest revealed level
  hintLevel: 0 | 1 | 2 | 3;
  setHintLevel: (level: 0 | 1 | 2 | 3) => void;
  totalHintPenalty: number;
  setTotalHintPenalty: (penalty: number) => void;
  solutionVisible: boolean;
  setSolutionVisible: (visible: boolean) => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  referenceOpen: false,
  setReferenceOpen: (open) => set({ referenceOpen: open }),
  hintLevel: 0,
  setHintLevel: (level) => set({ hintLevel: level }),
  totalHintPenalty: 0,
  setTotalHintPenalty: (penalty) => set({ totalHintPenalty: penalty }),
  solutionVisible: false,
  setSolutionVisible: (visible) => set({ solutionVisible: visible }),
});
