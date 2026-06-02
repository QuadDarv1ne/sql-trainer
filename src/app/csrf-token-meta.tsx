'use client';

import { useEffect } from 'react';

/**
 * Client component that reads the CSRF token from the cookie and renders it as a meta tag.
 * This avoids the "script tag inside React component" error from server components.
 */
export function CsrfTokenMeta() {
  useEffect(() => {
    // Read csrf-token-raw cookie and set it as a meta tag for safeFetch to use
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === 'csrf-token-raw' && value) {
        let meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'csrf-token');
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', decodeURIComponent(value));
        break;
      }
    }
  }, []);

  return null;
}
