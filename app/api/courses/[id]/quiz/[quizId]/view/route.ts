import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

/**
 * POST /api/courses/[id]/quiz/[quizId]/view
 * Log that the user viewed the quiz (for completion tracking).
 *
 * Returns: { status: boolean }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; quizId: string }> },
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
        const { quizId } = await params
        const quiz_id = parseInt(quizId, 10)
        if (isNaN(quiz_id)) {
            return NextResponse.json({ error: 'Invalid quiz ID.' }, { status: 400 })
        }

        // Call Moodle API (fire-and-forget)
        await moodleService.viewQuiz(session.token, quiz_id)

        return NextResponse.json({ status: true })
    } catch (error) {
        // Fire-and-forget, so don't fail the request
        console.warn('VIEW QUIZ LOG FAILED:', error)
        return NextResponse.json({ status: false })
    }
}