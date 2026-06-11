import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

export async function GET(request: NextRequest) {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)
    if (!cookie?.value) {
        return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }

    try {
        const session = decodeSession(cookie.value)
        if (!session) {
            return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
        }

        const courses = await moodleService.getUserCourses(session.token, session.userId)

        const items = courses.map((course) => ({
            type: 'course' as const,
            courseId: course.id,
            title: course.displayname || course.fullname,
        }))

        return new NextResponse(JSON.stringify({ items }), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'private, max-age=60',
            },
        })
    } catch (err) {
        console.error('Search index generation failed')
        return NextResponse.json({ error: 'Failed to generate search index.' }, { status: 500 })
    }
}
