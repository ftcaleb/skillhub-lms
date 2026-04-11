import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

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

        // Validate the token against Moodle and return live user data
        const siteInfo = await moodleService.getSiteInfo(session.token)

        // Fetch join date (non-fatal)
        let timecreated: number | null = null
        try {
            const adminToken = process.env.MOODLE_ADMIN_TOKEN!
            const users = await moodleService.getUsersByField(adminToken, 'id', [siteInfo.userid])
            console.log('User record from Moodle:', JSON.stringify(users[0], null, 2))
            timecreated = (users[0] as any)?.firstaccess ?? (users[0] as any)?.timecreated ?? null
        } catch (err) {
            console.error('Failed to fetch user timecreated:', err)
        }

        return NextResponse.json({
            userid: siteInfo.userid,
            fullname: siteInfo.fullname,
            firstname: siteInfo.firstname,
            lastname: siteInfo.lastname,
            username: siteInfo.username,
            userpictureurl: siteInfo.userpictureurl,
            sitename: siteInfo.sitename,
            timecreated,
            // Email comes from the session cookie (stored at signup) if available
            email: session.email ?? null,
        })
    } catch {
        // Token may be expired or revoked — tell the client to re-authenticate
        return NextResponse.json({ error: 'Session expired or invalid.' }, { status: 401 })
    }
}
