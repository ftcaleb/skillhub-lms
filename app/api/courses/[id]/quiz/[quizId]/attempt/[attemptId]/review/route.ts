import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

/**
 * GET /api/courses/[id]/quiz/[quizId]/attempt/[attemptId]/review
 * Get review of a finished attempt.
 *
 * Returns: MoodleAttemptReview
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; quizId: string; attemptId: string }> },
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
        const { attemptId } = await params
        const attempt_id = parseInt(attemptId, 10)
        if (isNaN(attempt_id)) {
            return NextResponse.json({ error: 'Invalid attempt ID.' }, { status: 400 })
        }

        // Call Moodle API
        const review = await moodleService.getAttemptReview(session.token, attempt_id)

        return NextResponse.json(review)
    } catch (error) {
        console.error('GET ATTEMPT REVIEW ERROR:', error)
        return NextResponse.json({ error: 'Failed to get attempt review.' }, { status: 500 })
    }
}