import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  const pathname = req.nextUrl.pathname;
  // Protect dashboard and api routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
