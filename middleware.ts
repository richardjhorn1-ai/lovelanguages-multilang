import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './lib/supabase-middleware';

export async function middleware(request: NextRequest) {
  // Host-based redirect: story.lovelanguages.io → /story/
  // (The one conditional redirect from vercel.json that couldn't go in next.config.js)
  if (request.headers.get('host')?.startsWith('story.')) {
    return NextResponse.redirect(new URL('/story/', request.url), 301);
  }

  // Refresh Supabase auth session (updates cookies on every request)
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public folder assets (images, sw.js, manifest, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest|js|css|woff|woff2|ttf|eot)$).*)',
  ],
};
