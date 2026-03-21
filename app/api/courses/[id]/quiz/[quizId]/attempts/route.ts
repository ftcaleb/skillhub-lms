import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

/**
 * GET /api/courses/[id]/quiz/[quizId]/attempts
 * Get all attempts for the current user on this quiz.
 *
 * Returns:
 *   {
 *     attempts: Array<{
 *       id: number
 *       state: string
 *       grade: number | null
 *       timestart: number
 *       timefinish: number | null
 *     }>
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
        // TEMP: Return empty attempts array until Moodle API is fixed
        const result = { attempts: [] }
        
        // TODO: Fix Moodle API call
        // const result = await moodleService.getUserAttempts(session.token, quiz_id, 0)

        // Map the response to the expected format
        const attempts = result.attempts.map((a: any) => ({
            id: a.id,
            state: a.state,
            grade: a.sumgrades, // Use sumgrades instead of grade
            timestart: a.timestart,
            timefinish: a.timefinish,
        }))

        return NextResponse.json({ attempts })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get user attempts.'
        console.error('GET USER ATTEMPTS ERROR:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}