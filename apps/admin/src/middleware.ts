import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('admin_token')?.value
    const { pathname } = request.nextUrl

    console.log(`[Middleware] Pathname: ${pathname}, Token: ${!!token}`)

    // Ignore static assets and API routes if needed (though API routes might need protection too, usually handled by backend)
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') // file extension
    ) {
        return NextResponse.next()
    }

    // If user is logged in and tries to access login page, redirect to dashboard
    if (token && pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // If user is NOT logged in and tries to access protected routes, redirect to login
    if (!token && pathname !== '/login') {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
