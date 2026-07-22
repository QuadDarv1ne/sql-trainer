import { describe, it, expect, beforeEach } from 'vitest';
import { useSQLTrainerStore } from '@/lib/store';

describe('store — timer slice', () => {
  beforeEach(() => {
    // Reset timer to default state
    useSQLTrainerStore.getState().stopTimer();
    useSQLTrainerStore.getState().setTimerSettings({
      defaultDuration: 900,
      warningThreshold: 60,
    });
  });

  describe('startTimer', () => {
    it('should start timer with default duration', () => {
      useSQLTrainerStore.getState().startTimer();
      const timer = useSQLTrainerStore.getState().timer;
      expect(timer.isActive).toBe(true);
      expect(timer.timeRemaining).toBe(900);
      expect(timer.totalDuration).toBe(900);
      expect(timer.isPaused).toBe(false);
    });

    it('should start timer with custom duration', () => {
      useSQLTrainerStore.getState().startTimer(300);
      const timer = useSQLTrainerStore.getState().timer;
      expect(timer.isActive).toBe(true);
      expect(timer.timeRemaining).toBe(300);
      expect(timer.totalDuration).toBe(300);
    });
  });

  describe('pauseTimer / resumeTimer', () => {
    it('should pause an active timer', () => {
      useSQLTrainerStore.getState().startTimer(300);
      useSQLTrainerStore.getState().pauseTimer();
      expect(useSQLTrainerStore.getState().timer.isPaused).toBe(true);
      expect(useSQLTrainerStore.getState().timer.isActive).toBe(true);
    });

    it('should resume a paused timer', () => {
      useSQLTrainerStore.getState().startTimer(300);
      useSQLTrainerStore.getState().pauseTimer();
      useSQLTrainerStore.getState().resumeTimer();
      expect(useSQLTrainerStore.getState().timer.isPaused).toBe(false);
    });
  });

  describe('stopTimer', () => {
    it('should stop timer and reset to default duration', () => {
      useSQLTrainerStore.getState().startTimer(300);
      useSQLTrainerStore.getState().stopTimer();
      const timer = useSQLTrainerStore.getState().timer;
      expect(timer.isActive).toBe(false);
      expect(timer.timeRemaining).toBe(900);
      expect(timer.isPaused).toBe(false);
    });
  });

  describe('tickTimer', () => {
    it('should decrement timeRemaining by 1', () => {
      useSQLTrainerStore.getState().startTimer(300);
      useSQLTrainerStore.getState().tickTimer();
      expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(299);
    });

    it('should not tick when paused', () => {
      useSQLTrainerStore.getState().startTimer(300);
      useSQLTrainerStore.getState().pauseTimer();
      useSQLTrainerStore.getState().tickTimer();
      expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(300);
    });

    it('should not tick when inactive', () => {
      useSQLTrainerStore.getState().tickTimer();
      expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(900);
    });

    it('should not go below 0', () => {
      useSQLTrainerStore.getState().startTimer(1);
      useSQLTrainerStore.getState().tickTimer();
      expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(0);
      // Ticking again should stay at 0
      useSQLTrainerStore.getState().tickTimer();
      expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(0);
    });
  });

  describe('setTimeRemaining', () => {
    it('should set timeRemaining to given value', () => {
      useSQLTrainerStore.getState().startTimer(900);
      useSQLTrainerStore.getState().setTimeRemaining(120);
      expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(120);
    });

    it('should clamp to 0 minimum', () => {
      useSQLTrainerStore.getState().startTimer(900);
      useSQLTrainerStore.getState().setTimeRemaining(-10);
      expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(0);
    });

    it('should clamp to defaultDuration maximum', () => {
      useSQLTrainerStore.getState().startTimer(900);
      useSQLTrainerStore.getState().setTimeRemaining(9999);
      expect(useSQLTrainerStore.getState().timer.timeRemaining).toBe(900);
    });
  });

  describe('setTimerSettings', () => {
    it('should update defaultDuration', () => {
      useSQLTrainerStore.getState().setTimerSettings({ defaultDuration: 600 });
      expect(useSQLTrainerStore.getState().timerSettings.defaultDuration).toBe(600);
    });

    it('should update warningThreshold', () => {
      useSQLTrainerStore.getState().setTimerSettings({ warningThreshold: 30 });
      expect(useSQLTrainerStore.getState().timerSettings.warningThreshold).toBe(30);
    });

    it('should merge partial settings', () => {
      useSQLTrainerStore.getState().setTimerSettings({ defaultDuration: 1200 });
      const settings = useSQLTrainerStore.getState().timerSettings;
      expect(settings.defaultDuration).toBe(1200);
      expect(settings.warningThreshold).toBe(60); // unchanged
    });
  });

  describe('getFormattedTime', () => {
    it('should format remaining 0 seconds as 00:00', () => {
      useSQLTrainerStore.getState().startTimer(1);
      useSQLTrainerStore.getState().tickTimer();
      expect(useSQLTrainerStore.getState().getFormattedTime()).toBe('00:00');
    });

    it('should format 900 seconds as 15:00', () => {
      useSQLTrainerStore.getState().startTimer(900);
      expect(useSQLTrainerStore.getState().getFormattedTime()).toBe('15:00');
    });

    it('should format 65 seconds as 01:05', () => {
      useSQLTrainerStore.getState().startTimer(65);
      expect(useSQLTrainerStore.getState().getFormattedTime()).toBe('01:05');
    });

    it('should pad single digits', () => {
      useSQLTrainerStore.getState().startTimer(5);
      expect(useSQLTrainerStore.getState().getFormattedTime()).toBe('00:05');
    });
  });

  describe('isTimeWarning', () => {
    it('should return false when time is above threshold', () => {
      useSQLTrainerStore.getState().startTimer(300);
      expect(useSQLTrainerStore.getState().isTimeWarning()).toBe(false);
    });

    it('should return true when time is at threshold', () => {
      useSQLTrainerStore.getState().startTimer(60);
      expect(useSQLTrainerStore.getState().isTimeWarning()).toBe(true);
    });

    it('should return true when time is below threshold', () => {
      useSQLTrainerStore.getState().startTimer(10);
      expect(useSQLTrainerStore.getState().isTimeWarning()).toBe(true);
    });

    it('should respect custom warningThreshold', () => {
      useSQLTrainerStore.getState().setTimerSettings({ warningThreshold: 30 });
      useSQLTrainerStore.getState().startTimer(45);
      expect(useSQLTrainerStore.getState().isTimeWarning()).toBe(false);
      useSQLTrainerStore.getState().startTimer(25);
      expect(useSQLTrainerStore.getState().isTimeWarning()).toBe(true);
    });
  });
});
