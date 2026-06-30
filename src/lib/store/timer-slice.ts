import { StateCreator } from 'zustand';
import type { TimerSlice } from './timer-slice-types';

export type { TimerSlice };

export const createTimerSlice: StateCreator<TimerSlice, [], [], TimerSlice> = (set, get) => ({
  timer: {
    isActive: false,
    timeRemaining: 900, // 15 minutes default
    totalDuration: 900,
    isPaused: false,
  },
  timerSettings: {
    defaultDuration: 900, // 15 minutes
    warningThreshold: 60, // 1 minute
  },

  startTimer: (durationInSeconds?: number) => {
    const duration = durationInSeconds || get().timerSettings.defaultDuration;
    set({
      timer: {
        isActive: true,
        timeRemaining: duration,
        totalDuration: duration,
        isPaused: false,
      },
    });
  },

  pauseTimer: () => {
    set((state) => ({
      timer: {
        ...state.timer,
        isPaused: true,
      },
    }));
  },

  resumeTimer: () => {
    set((state) => ({
      timer: {
        ...state.timer,
        isPaused: false,
      },
    }));
  },

  stopTimer: () => {
    set({
      timer: {
        isActive: false,
        timeRemaining: get().timerSettings.defaultDuration,
        totalDuration: get().timerSettings.defaultDuration,
        isPaused: false,
      },
    });
  },

  tickTimer: () => {
    const { timer } = get();
    if (!timer.isActive || timer.isPaused || timer.timeRemaining <= 0) return;

    set({
      timer: {
        ...timer,
        timeRemaining: Math.max(0, timer.timeRemaining - 1),
      },
    });
  },

  setTimeRemaining: (timeRemaining: number) => {
    set((state) => ({
      timer: {
        ...state.timer,
        timeRemaining: Math.max(0, Math.min(timeRemaining, state.timerSettings.defaultDuration)),
      },
    }));
  },

  setTimerSettings: (settings: Partial<TimerSlice['timerSettings']>) => {
    set((state) => ({
      timerSettings: {
        ...state.timerSettings,
        ...settings,
      },
    }));
  },

  getFormattedTime: () => {
    const { timeRemaining } = get().timer;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  isTimeWarning: () => {
    const { timeRemaining } = get().timer;
    return timeRemaining <= get().timerSettings.warningThreshold;
  },
});
