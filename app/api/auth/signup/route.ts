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
        const { username, password, firstname, lastname, email } = body as {
            username?: string
            password?: string
            firstname?: string
            lastname?: string
            email?: string
        }

        if (!username || !password || !firstname || !lastname || !email) {
            return NextResponse.json(
                { error: 'All fields (username, password, firstname, lastname, email) are required.' },
                { status: 400 },
            )
        }

        // Step 1: Create the user using the ADMIN token (users cannot self-create)
        await moodleService.createUser({
            username: username.trim().toLowerCase(),
            password,
            firstname: firstname.trim(),
            lastname: lastname.trim(),
            email: email.trim().toLowerCase(),
            auth: 'manual',
        })

        // Step 2: Immediately authenticate as the new user to obtain their token
        const token = await moodleService.login(username.trim().toLowerCase(), password)
        const siteInfo = await moodleService.getSiteInfo(token)

        // Step 3: Set HTTP-only session cookie (include email since site_info won't provide it later)
        const sessionValue = encodeSession({
            token,
            userId: siteInfo.userid,
            username: siteInfo.username,
            email: email.trim().toLowerCase(),
        })

        const response = NextResponse.json({ ok: true, fullname: siteInfo.fullname })
        response.cookies.set(SESSION_COOKIE_NAME, sessionValue, SESSION_COOKIE_OPTIONS)
        return response
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Signup failed.'
        const status = message.includes('already exists') ? 409 : 400
        return NextResponse.json({ error: message }, { status })
    }
}
