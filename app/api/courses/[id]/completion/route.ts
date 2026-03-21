import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

/**
 * GET /api/courses/[id]/completion
 * Get completion status for course activities.
 *
 * Returns: MoodleActivitiesCompletionStatus
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
        const completion = await moodleService.getActivitiesCompletionStatus(session.token, course_id)

        return NextResponse.json(completion)
    } catch (error) {
        console.error('GET COMPLETION STATUS ERROR:', error)
        return NextResponse.json({ error: 'Failed to get completion status.' }, { status: 500 })
    }
}

/**
 * POST /api/courses/[id]/completion
 * Update completion status for an activity.
 *
 * Body: { cmid: number, completed: boolean }
 * Returns: { status: boolean }
 */
export async function POST(
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

        // Parse body
        const body = await request.json()
        const { cmid, completed } = body
        if (typeof cmid !== 'number' || typeof completed !== 'boolean') {
            return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
        }

        // Call Moodle API
        await moodleService.updateActivityCompletionStatusManually(session.token, cmid, completed ? 1 : 0)

        return NextResponse.json({ status: true })
    } catch (error) {
        console.error('UPDATE COMPLETION STATUS ERROR:', error)
        return NextResponse.json({ error: 'Failed to update completion status.' }, { status: 500 })
    }
}