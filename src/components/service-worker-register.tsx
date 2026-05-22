'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

/**
 * Registers the service worker for PWA offline support.
 * Only runs in the browser (client-side).
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handler = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('[SW] Registered:', registration.scope);
            }
          })
          .catch((error) => {
            logger.error('SW registration failed:', error);
          });
      };
      window.addEventListener('load', handler);
      return () => window.removeEventListener('load', handler);
    }
  }, []);

  return null;
}
