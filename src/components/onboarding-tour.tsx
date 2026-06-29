'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { useSQLTrainerStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, X, Check } from 'lucide-react';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: t('onboarding.welcome.title'),
    description: t('onboarding.welcome.description'),
    icon: '👋',
  },
  {
    id: 'editor',
    title: t('onboarding.editor.title'),
    description: t('onboarding.editor.description'),
    icon: '✏️',
  },
  {
    id: 'schema',
    title: t('onboarding.schema.title'),
    description: t('onboarding.schema.description'),
    icon: '🗄️',
  },
  {
    id: 'tasks',
    title: t('onboarding.tasks.title'),
    description: t('onboarding.tasks.description'),
    icon: '📋',
  },
  {
    id: 'progress',
    title: t('onboarding.progress.title'),
    description: t('onboarding.progress.description'),
    icon: '📊',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const { setOnboardingCompleted } = useSQLTrainerStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    setOnboardingCompleted(true);
    onComplete();
  }, [onComplete, setOnboardingCompleted]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length - 1));
    }
  }, [isLastStep, handleComplete]);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    setOnboardingCompleted(true);
    onComplete();
  }, [onComplete, setOnboardingCompleted]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
      if (e.key === 'ArrowRight' && !isLastStep) {
        handleNext();
      }
      if (e.key === 'ArrowLeft' && !isFirstStep) {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip, handleNext, handlePrev, isLastStep, isFirstStep]);

  if (!isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]"
      >
        <Card className="shadow-2xl border-2 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">{step.icon}</span>
                {step.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="h-8 w-8"
                aria-label={t('onboarding.skip')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{step.description}</p>
            <div className="flex gap-1 mt-4">
              {ONBOARDING_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i === currentStep ? 'bg-emerald-500' : i < currentStep ? 'bg-emerald-300' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-4">
            <Button variant="ghost" size="sm" onClick={handlePrev} disabled={isFirstStep}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('onboarding.prev')}
            </Button>
            {isLastStep ? (
              <Button size="sm" onClick={handleComplete} className="bg-emerald-600 hover:bg-emerald-700">
                <Check className="mr-1 h-4 w-4" />
                {t('onboarding.complete')}
              </Button>
            ) : (
              <Button size="sm" onClick={handleNext} variant="default">
                {t('onboarding.next')}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
