/**
 * Onboarding slice — tracks whether user has completed the onboarding tour.
 */
import type { StateCreator } from 'zustand';

export interface OnboardingSlice {
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
  resetOnboarding: () => void;
}

export const createOnboardingSlice: StateCreator<OnboardingSlice, [], [], OnboardingSlice> = (set) => ({
  onboardingCompleted: false,
  setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
  resetOnboarding: () => set({ onboardingCompleted: false }),
});
