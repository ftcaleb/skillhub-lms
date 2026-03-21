import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

/**
 * GET /api/courses/[id]/quiz/[quizId]/access
 * Get access information for attempting this quiz.
 *
 * Returns:
 *   {
 *     accessrules: string[]
 *     activerulenames: string[]
 *     preventnewattemptreasons: string[]
 *     canattempt: boolean
 *     canpreview: boolean
 *     canreviewmyattempts: boolean
 *     isfinished: boolean
 *   }
 */
export async function GET(
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

        // Call Moodle API
        // TEMP: Return hardcoded access info until Moodle API is fixed
        const result = {
            accessrules: [],
            activerulenames: [],
            preventnewattemptreasons: [],
            canattempt: true,
            canpreview: false,
            canreviewmyattempts: true,
            isfinished: false,
        }
        
        // const result = await moodleService.getAttemptAccessInformation(session.token, quiz_id, 0)

        return NextResponse.json(result)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get access information.'
        console.error('GET ATTEMPT ACCESS INFO ERROR:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}