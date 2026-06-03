/**
 * Practice mode slice — manages shuffled practice sessions.
 */
import type { StateCreator } from 'zustand';
import { TRAINING_TASKS } from '@/lib/training-tasks';
import type { Difficulty } from '@/lib/training-tasks';

export interface PracticeModeState {
  active: boolean;
  taskOrder: string[];
  currentIndex: number;
  completedInSession: string[];
}

export interface PracticeModeSlice {
  practiceMode: PracticeModeState;
  startPracticeMode: (difficulty?: Difficulty | 'all') => void;
  stopPracticeMode: () => void;
  nextPracticeTask: () => void;
}

export const createPracticeModeSlice: StateCreator<PracticeModeSlice, [], [], PracticeModeSlice> = (set, get) => ({
  practiceMode: {
    active: false,
    taskOrder: [],
    currentIndex: 0,
    completedInSession: [],
  },
  startPracticeMode: (difficulty = 'all') => {
    let pool = TRAINING_TASKS;
    if (difficulty !== 'all') {
      pool = TRAINING_TASKS.filter((t) => t.difficulty === difficulty);
    }

    // Fisher-Yates shuffle
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    set({
      practiceMode: {
        active: true,
        taskOrder: shuffled.map((t) => t.id),
        currentIndex: 0,
        completedInSession: [],
      },
    });

    // Return the first task ID so caller can set it
    return shuffled[0]?.id ?? null;
  },
  stopPracticeMode: () => {
    set({
      practiceMode: {
        active: false,
        taskOrder: [],
        currentIndex: 0,
        completedInSession: [],
      },
    });
  },
  nextPracticeTask: () => {
    const { practiceMode } = get();
    if (!practiceMode.active) return;

    const nextIndex = practiceMode.currentIndex + 1;
    if (nextIndex >= practiceMode.taskOrder.length) {
      set({
        practiceMode: {
          ...practiceMode,
          active: false,
        },
      });
      return;
    }

    set({
      practiceMode: {
        ...practiceMode,
        currentIndex: nextIndex,
        completedInSession: [...practiceMode.completedInSession, practiceMode.taskOrder[practiceMode.currentIndex]],
      },
    });
  },
});
