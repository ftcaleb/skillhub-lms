import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

/**
 * GET /api/courses/[id]/quiz/[quizId]/attempt/[attemptId]/page/[page]
 * Fetch questions for a specific page of a quiz attempt.
 *
 * Returns:
 *   {
 *     attempt: MoodleQuizAttempt
 *     messages: string[]
 *     questions: MoodleAttemptQuestion[]
 *     warnings: MoodleWarning[]
 *   }
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; quizId: string; attemptId: string; page: string }> },
) {
    try {
        // Validate session from httpOnly cookie
        const cookie = request.cookies.get(SESSION_COOKIE_NAME)
        if (!cookie?.value) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
        }

        const session = decodeSession(cookie.value)
        if (!session) {
            return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
        }

        // Parse params
        const { attemptId, page } = await params
        const attempt_id = parseInt(attemptId, 10)
        const page_num = parseInt(page, 10)

        if (isNaN(attempt_id)) {
            return NextResponse.json({ error: 'Invalid attempt ID.' }, { status: 400 })
        }
        if (isNaN(page_num) || page_num < 0) {
            return NextResponse.json({ error: 'Invalid page number.' }, { status: 400 })
        }

        // Call Moodle API
        const result = await moodleService.getAttemptData(session.token, attempt_id, page_num)

        return NextResponse.json(result)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch attempt data.'
        console.error('GET ATTEMPT DATA ERROR:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
