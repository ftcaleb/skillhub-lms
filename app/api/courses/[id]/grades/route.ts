import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

/**
 * GET /api/courses/[id]/grades
 * Get grade items for a course.
 *
 * Returns: MoodleGradeItemsResponse
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        // Validate session
        const cookie = request.cookies.get(SESSION_COOKIE_NAME)
        if (!cookie?.value) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
        }

        const session = decodeSession(cookie.value)
        if (!session) {
            return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
        }

        // Parse params
        const { id } = await params
        const course_id = parseInt(id, 10)
        if (isNaN(course_id)) {
            return NextResponse.json({ error: 'Invalid course ID.' }, { status: 400 })
        }

        // Call Moodle API
        const grades = await moodleService.getGradeItems(session.token, course_id, session.userId)

        return NextResponse.json(grades)
    } catch (error) {
        console.error('GET GRADE ITEMS ERROR:', error)
        return NextResponse.json({ error: 'Failed to get grade items.' }, { status: 500 })
    }
}