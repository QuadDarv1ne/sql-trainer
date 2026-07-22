import { describe, it, expect } from 'vitest';
import { REMINDER_INTERVALS, NOTIFICATION_CHANNELS } from '@/lib/notification-config';

describe('notification-config', () => {
  describe('REMINDER_INTERVALS', () => {
    it('should have 6 reminder intervals', () => {
      expect(REMINDER_INTERVALS).toHaveLength(6);
    });

    it('should have correct first interval (30 min)', () => {
      expect(REMINDER_INTERVALS[0]).toEqual({ label: '30 min', value: 1800000 });
    });

    it('should have correct last interval (3 days)', () => {
      expect(REMINDER_INTERVALS[5]).toEqual({ label: '3 days', value: 259200000 });
    });

    it('should have increasing values', () => {
      for (let i = 1; i < REMINDER_INTERVALS.length; i++) {
        expect(REMINDER_INTERVALS[i].value).toBeGreaterThan(REMINDER_INTERVALS[i - 1].value);
      }
    });

    it('each interval should have label and value', () => {
      for (const interval of REMINDER_INTERVALS) {
        expect(typeof interval.label).toBe('string');
        expect(typeof interval.value).toBe('number');
        expect(interval.value).toBeGreaterThan(0);
      }
    });
  });

  describe('NOTIFICATION_CHANNELS', () => {
    it('should have 3 notification channels', () => {
      expect(NOTIFICATION_CHANNELS).toHaveLength(3);
    });

    it('should include in_app channel', () => {
      expect(NOTIFICATION_CHANNELS.find((c) => c.id === 'in_app')).toBeDefined();
    });

    it('should include push channel', () => {
      expect(NOTIFICATION_CHANNELS.find((c) => c.id === 'push')).toBeDefined();
    });

    it('should include email channel', () => {
      expect(NOTIFICATION_CHANNELS.find((c) => c.id === 'email')).toBeDefined();
    });

    it('each channel should have id and label', () => {
      for (const channel of NOTIFICATION_CHANNELS) {
        expect(typeof channel.id).toBe('string');
        expect(typeof channel.label).toBe('string');
      }
    });
  });
});
