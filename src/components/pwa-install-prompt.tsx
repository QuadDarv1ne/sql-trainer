'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, X } from 'lucide-react';
import { t } from '@/lib/i18n';
import { logger } from '@/lib/logger';

const DISMISSED_STORAGE_KEY = 'sql-trainer-pwa-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA Install Prompt — shows a dialog once when the app is installable.
 * After dismissal, shows a floating button on the right side.
 */
export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISSED_STORAGE_KEY) === 'true';

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (!wasDismissed) {
        setShowDialog(true);
      } else {
        setShowFloating(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[PWA] User response: ${outcome}`);
    }

    setDeferredPrompt(null);
    setShowDialog(false);
    setShowFloating(false);
  };

  const handleDismiss = () => {
    setShowDialog(false);
    localStorage.setItem(DISMISSED_STORAGE_KEY, 'true');
    // Show floating button after dismissal
    setShowFloating(true);
  };

  const handleFloatingClick = () => {
    setShowDialog(true);
    setShowFloating(false);
  };

  const handleFloatingDismiss = () => {
    setShowFloating(false);
  };

  if (!deferredPrompt) return null;

  return (
    <>
      {/* Install dialog */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleDismiss();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              {t('pwa.install.title')}
            </DialogTitle>
            <DialogDescription>{t('pwa.install.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleDismiss}>
              {t('action.close')}
            </Button>
            <Button onClick={handleInstall} className="bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              {t('pwa.install.button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating button — shown after first dismissal */}
      {showFloating && !showDialog && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Button
            onClick={handleFloatingClick}
            size="sm"
            className="h-10 w-10 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white p-0"
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleFloatingDismiss}
            variant="ghost"
            size="sm"
            className="h-6 w-6 rounded-full p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </>
  );
}
