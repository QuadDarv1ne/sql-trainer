/**
 * Server component that reads the CSRF token from cookies and renders it as a meta tag.
 */
import { cookies } from 'next/headers';

export async function CsrfTokenMeta() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get('csrf-token-raw')?.value ?? '';

  return <meta name="csrf-token" content={rawToken} />;
}
