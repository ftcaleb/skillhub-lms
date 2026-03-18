import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

/**
 * POST /api/courses/[id]/quiz/[quizId]/attempt
 * Start a new quiz attempt or resume an existing one.
 *
 * Request body:
 *   {
 *     forcenew?: boolean  // If true, start a new attempt even if one is in progress
 *   }
 *
 * Returns:
 *   {
 *     attempt: MoodleQuizAttempt
 *     warnings: MoodleWarning[]
 *   }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; quizId: string }> },
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
        const { quizId } = await params
        const quiz_id = parseInt(quizId, 10)
        if (isNaN(quiz_id)) {
            return NextResponse.json({ error: 'Invalid quiz ID.' }, { status: 400 })
        }

        // Parse request body
        const body = (await request.json().catch(() => ({}))) as { forcenew?: boolean }
        const forcenew = body.forcenew ? 1 : 0

        // Call Moodle API
        const result = await moodleService.startQuizAttempt(session.token, quiz_id, forcenew)

        return NextResponse.json(result)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start quiz attempt.'
        console.error('START QUIZ ATTEMPT ERROR:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
