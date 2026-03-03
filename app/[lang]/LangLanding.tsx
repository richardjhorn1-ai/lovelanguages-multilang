'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { supabase } from '../../services/supabase';

// Dynamic import with ssr: false — Landing uses window/browser APIs
// that aren't available during static generation
const Landing = dynamic(() => import('../../components/Landing'), {
  ssr: false,
  loading: () => <div style={{ padding: '2rem', textAlign: 'center' }}>Loading landing page...</div>,
});

/**
 * Client component for language landing pages.
 * Redirects authenticated users to / (they don't need the landing page).
 */
export default function LangLanding() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/');
    });
  }, [router]);

  if (!mounted) return <div style={{ padding: '2rem', textAlign: 'center' }}>Initializing...</div>;

  return <Landing />;
}
