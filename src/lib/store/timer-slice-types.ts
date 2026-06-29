export interface TimerSlice {
  // Timer state
  timer: {
    isActive: boolean;
    timeRemaining: number;
    totalDuration: number;
    isPaused: boolean;
  };
  
  // Timer settings
  timerSettings: {
    defaultDuration: number;
    warningThreshold: number;
  };
  
  // Timer actions
  startTimer: (durationInSeconds?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tickTimer: () => void;
  setTimeRemaining: (timeRemaining: number) => void;
  setTimerSettings: (settings: Partial<TimerSlice['timerSettings']>) => void;
  
  // Helper functions
  getFormattedTime: () => string;
  isTimeWarning: () => boolean;
}
