import { notFound } from 'next/navigation';
import { SUPPORTED_LANGUAGE_CODES } from '../../constants/language-config';
import LangLanding from './LangLanding';

/**
 * Language landing pages: /pl/, /es/, /fr/, etc.
 * Server component — generateStaticParams limits [lang] to valid codes only,
 * preventing conflicts with /api/* and other top-level routes.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return SUPPORTED_LANGUAGE_CODES.map((lang: string) => ({ lang }));
}

export default async function LangPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!SUPPORTED_LANGUAGE_CODES.includes(lang as any)) {
    notFound();
  }

  return <LangLanding />;
}
