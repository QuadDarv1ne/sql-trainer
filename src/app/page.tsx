import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/landing-page';
import { getLocaleFromCookies } from '@/lib/i18n';

export default async function PublicHomePage() {
  const session = await auth();

  // Redirect authenticated users to the workspace
  if (session) {
    redirect('/app');
  }

  const cookieStore = await cookies();
  const locale = getLocaleFromCookies(cookieStore.toString());

  return <LandingPage locale={locale} />;
}
