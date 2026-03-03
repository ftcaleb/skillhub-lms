import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import {
    encodeSession,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_OPTIONS,
} from '@/lib/moodle/session'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { username, password } = body as { username?: string; password?: string }

        if (!username?.trim() || !password?.trim()) {
            return NextResponse.json(
                { error: 'Username and password are required.' },
                { status: 400 },
            )
        }

        // Step 1: exchange credentials for a user-scoped WS token
        const token = await moodleService.login(username.trim(), password)

        // Step 2: validate the token and get user metadata
        const siteInfo = await moodleService.getSiteInfo(token)

        // Step 3: encode session and set HTTP-only cookie
        const sessionValue = encodeSession({
            token,
            userId: siteInfo.userid,
            username: siteInfo.username,
        })

        const response = NextResponse.json({
            ok: true,
            fullname: siteInfo.fullname,
            username: siteInfo.username,
        })

        response.cookies.set(SESSION_COOKIE_NAME, sessionValue, SESSION_COOKIE_OPTIONS)
        return response
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed.'
        // Moodle returns specific messages for bad credentials — surface them.
        return NextResponse.json({ error: message }, { status: 401 })
    }
}
