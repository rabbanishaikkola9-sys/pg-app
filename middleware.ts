import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/owner', roles: ['MANAGER'] },
  { prefix: '/renter', roles: ['TENANT'] },
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const match = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  if (!match) return NextResponse.next();

  const session = req.cookies.get('pg_session')?.value;
  const role = req.cookies.get('pg_role')?.value;

  if (!session || !role) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (!match.roles.includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'forbidden');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/owner/:path*', '/renter/:path*'],
};
