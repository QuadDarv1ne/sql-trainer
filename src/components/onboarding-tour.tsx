'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { useSQLTrainerStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Play,
  Search,
  BookOpen,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightElement?: string; // CSS selector for element to highlight
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: t('onboarding.welcome.title'),
    description: t('onboarding.welcome.description'),
    icon: <Play className="h-6 w-6" />,
  },
  {
    id: 'editor',
    title: t('onboarding.editor.title'),
    description: t('onboarding.editor.description'),
    icon: <ChevronRight className="h-6 w-6" />,
    highlightElement: '[data-tour="sql-editor"]',
  },
  {
    id: 'execute',
    title: t('onboarding.execute.title'),
    description: t('onboarding.execute.description'),
    icon: <Play className="h-6 w-6" />,
    highlightElement: '[data-tour="action-bar"]',
  },
  {
    id: 'verify',
    title: t('onboarding.verify.title'),
    description: t('onboarding.verify.description'),
    icon: <CheckCircle2 className="h-6 w-6" />,
    highlightElement: '[data-tour="results"]',
  },
  {
    id: 'reference',
    title: t('onboarding.reference.title'),
    description: t('onboarding.reference.description'),
    icon: <BookOpen className="h-6 w-6" />,
    highlightElement: '[data-tour="reference"]',
  },
  {
    id: 'progress',
    title: t('onboarding.progress.title'),
    description: t('onboarding.progress.description'),
    icon: <TrendingUp className="h-6 w-6" />,
    highlightElement: '[data-tour="sidebar"]',
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

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    setIsVisible(false);
    setOnboardingCompleted(true);
    onComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setOnboardingCompleted(true);
    onComplete();
  };

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
  }, [currentStep, isLastStep, isFirstStep]);

  if (!isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg"
        >
          <Card className="shadow-2xl border-2 border-emerald-500/20">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    {step.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('onboarding.stepCounter', { current: String(currentStep + 1), total: String(ONBOARDING_STEPS.length) })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSkip}
                  aria-label={t('onboarding.skip')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Progress bar */}
              <div className="mt-4 flex gap-1">
                {ONBOARDING_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      index <= currentStep
                        ? 'bg-emerald-500'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </CardContent>

            <CardFooter className="flex justify-between gap-2">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="text-xs"
              >
                {t('onboarding.skip')}
              </Button>

              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    className="text-xs"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {t('onboarding.prev')}
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                >
                  {isLastStep ? (
                    <>
                      {t('onboarding.complete')}
                      <CheckCircle2 className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      {t('onboarding.next')}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
