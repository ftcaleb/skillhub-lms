import { NextRequest, NextResponse } from 'next/server'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

const MOODLE_URL = process.env.MOODLE_URL?.replace(/\/$/, '') ?? ''
const MOODLE_HOST = (() => {
    try { return new URL(MOODLE_URL).hostname } catch { return '' }
})()

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

        // Safety check: only proxy URLs from the configured Moodle host (ignore port differences)
        let parsedFileUrl: URL
        try {
            parsedFileUrl = new URL(fileUrl)
        } catch {
            return NextResponse.json({ error: 'Invalid URL.' }, { status: 400 })
        }

        if (MOODLE_HOST && parsedFileUrl.hostname !== MOODLE_HOST) {
            return NextResponse.json({ error: 'Forbidden: external URL.' }, { status: 403 })
        }

        // Force the correct port from MOODLE_URL so the fetch always hits the right server
        try {
            const moodleUrlParsed = new URL(MOODLE_URL)
            parsedFileUrl.port = moodleUrlParsed.port
        } catch { /* ignore */ }

        // Rewrite pluginfile.php → webservice/pluginfile.php for WS token auth
        if (
            parsedFileUrl.pathname.includes('/pluginfile.php') &&
            !parsedFileUrl.pathname.includes('/webservice/pluginfile.php')
        ) {
            parsedFileUrl.pathname = parsedFileUrl.pathname.replace(
                '/pluginfile.php',
                '/webservice/pluginfile.php',
            )
        }
        parsedFileUrl.searchParams.set('token', session.token)

        const upstream = await fetch(parsedFileUrl.toString(), { cache: 'no-store' })
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
