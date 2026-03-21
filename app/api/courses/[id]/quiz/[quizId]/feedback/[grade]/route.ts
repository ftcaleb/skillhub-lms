import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

/**
 * GET /api/courses/[id]/quiz/[quizId]/feedback/[grade]
 * Get feedback for a quiz grade.
 *
 * Returns: MoodleQuizFeedback
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; quizId: string; grade: string }> },
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
        const { quizId, grade } = await params
        const quiz_id = parseInt(quizId, 10)
        const grade_num = parseFloat(grade)
        if (isNaN(quiz_id) || isNaN(grade_num)) {
            return NextResponse.json({ error: 'Invalid quiz ID or grade.' }, { status: 400 })
        }

        // Call Moodle API
        const feedback = await moodleService.getQuizFeedbackForGrade(session.token, quiz_id, grade_num)

        return NextResponse.json(feedback)
    } catch (error) {
        console.error('GET QUIZ FEEDBACK ERROR:', error)
        return NextResponse.json({ error: 'Failed to get quiz feedback.' }, { status: 500 })
    }
}