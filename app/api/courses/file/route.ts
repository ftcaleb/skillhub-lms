import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

const MOODLE_URL = process.env.MOODLE_URL?.replace(/\/$/, '') ?? ''

/**
 * File proxy route: /api/courses/file?url=ENCODED_MOODLE_FILE_URL
 *
 * Moodle pluginfile.php URLs require a valid WS token appended as a query param.
 * Since the token lives in an HTTP-only cookie (invisible to client JS), we proxy
 * the file server-side: inject the token, fetch from Moodle, stream back.
 */
export async function GET(request: NextRequest) {
    try {
        const cookie = request.cookies.get(SESSION_COOKIE_NAME)
        if (!cookie?.value) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
        }

        const session = decodeSession(cookie.value)
        if (!session) {
            return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
        }

        const rawUrl = request.nextUrl.searchParams.get('url')
        if (!rawUrl) {
            return NextResponse.json({ error: 'Missing url parameter.' }, { status: 400 })
        }

        const fileUrl = decodeURIComponent(rawUrl)

        // Safety check: only proxy URLs from the configured Moodle host
        if (MOODLE_URL && !fileUrl.startsWith(MOODLE_URL)) {
            return NextResponse.json({ error: 'Forbidden: external URL.' }, { status: 403 })
        }

        // Rewrite pluginfile.php → webservice/pluginfile.php for WS token auth.
        // Moodle serves files via /pluginfile.php but requires the /webservice/
        // prefix when using a web-service token instead of a browser session.
        const authedUrl = new URL(fileUrl)
        if (
            authedUrl.pathname.includes('/pluginfile.php') &&
            !authedUrl.pathname.includes('/webservice/pluginfile.php')
        ) {
            authedUrl.pathname = authedUrl.pathname.replace(
                '/pluginfile.php',
                '/webservice/pluginfile.php',
            )
        }
        authedUrl.searchParams.set('token', session.token)

        const upstream = await fetch(authedUrl.toString(), { cache: 'no-store' })
        if (!upstream.ok) {
            return NextResponse.json(
                { error: `Moodle returned HTTP ${upstream.status}` },
                { status: upstream.status },
            )
        }

        const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
        const contentDisposition = upstream.headers.get('content-disposition') ?? ''

        return new NextResponse(upstream.body, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': contentDisposition,
                'Cache-Control': 'private, max-age=3600',
            },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'File proxy error.'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
