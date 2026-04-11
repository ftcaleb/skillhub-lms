import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

export async function POST(request: NextRequest) {
    try {
        const cookie = request.cookies.get(SESSION_COOKIE_NAME)
        if (!cookie?.value) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
        }

        const session = decodeSession(cookie.value)
        if (!session) {
            return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
        }

        const body = await request.json()
        const { firstname, lastname } = body

        if (!firstname && !lastname) {
            return NextResponse.json({ error: 'No fields provided to update.' }, { status: 400 })
        }

        // Send update to Moodle
        await moodleService.updateUsers(session.token, [
            {
                id: session.userId,
                firstname,
                lastname,
            }
        ])

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Profile update error:', err)
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const cookie = request.cookies.get(SESSION_COOKIE_NAME)
        if (!cookie?.value) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
        
        const session = decodeSession(cookie.value)
        if (!session) return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })

        const users = await moodleService.getUsersByField(session.token, 'id', [session.userId])
        if (!users || users.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        return NextResponse.json({
            firstaccess: (users[0] as any).firstaccess || (users[0] as any).timecreated || null,
        })
    } catch (err: any) {
        console.error('Profile fetch error:', err)
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
    }
}
