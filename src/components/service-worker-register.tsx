'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker for PWA offline support.
 * Only runs in the browser (client-side).
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('[SW] Registered:', registration.scope);
            }
          })
          .catch((error) => {
            console.error('[SW] Registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}
