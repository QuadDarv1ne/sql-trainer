import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/landing-page';

export default async function PublicHomePage() {
  const session = await auth();

  // Redirect authenticated users to the workspace
  if (session) {
    redirect('/app');
  }

  return <LandingPage />;
}
