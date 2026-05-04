import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PROTECTED_PREFIXES = ['/dashboard', '/client', '/admin', '/booking', '/chat'];

// Middleware Next.js : protège les routes nécessitant une session Supabase.
// Le contrôle de rôle fin (COACH/ADMIN) est fait côté serveur Express et
// dans les pages elles-mêmes (via /auth/me).
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isProtected = PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p));
  if (!isProtected) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirect = new URL('/sign-in', request.url);
    redirect.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(redirect);
  }
  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/client/:path*',
    '/admin/:path*',
    '/booking/:path*',
    '/chat/:path*',
  ],
};
