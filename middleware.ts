import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/moodle/session'

/**
 * Session guard middleware.
 * Protects /dashboard. If the moodle_session cookie is absent, redirect to /login.
 *
 * The public routes /login and /signup are explicitly excluded.
 * Token validity is NOT re-checked on every request (that would add a Moodle
 * round-trip per page load). The downstream API routes validate the token as needed.
 */
export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Always allow public paths through
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next()
    }

    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT:
         * - _next/static, _next/image (Next.js internals)
         * - favicon.ico, public assets
         * - API routes (they self-validate)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
