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

        const courses = await moodleService.getUserCourses(session.token, session.userId)
        return NextResponse.json(courses)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch courses.'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
