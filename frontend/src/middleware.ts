import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proteção server-side das rotas do dashboard.
 * Verifica a existência do cookie 'token' antes de servir qualquer HTML.
 * Nota: não valida a assinatura JWT (isso o backend faz em cada request de API).
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');

  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    // Guarda a URL original para redirecionar de volta após login
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
