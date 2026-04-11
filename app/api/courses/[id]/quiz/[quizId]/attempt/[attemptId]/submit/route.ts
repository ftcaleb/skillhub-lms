import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

/**
 * POST /api/courses/[id]/quiz/[quizId]/attempt/[attemptId]/submit
 * Submit answers for the current page or finish the entire attempt.
 *
 * Request body:
 *   {
 *     data: Array<{ name: string; value: string }>  // Answer slot values
 *     finishattempt: boolean
 *     timeup?: boolean  // Set to true if time limit was reached
 *   }
 *
 * Returns:
 *   {
 *     state: string
 *     warnings: MoodleWarning[]
 *   }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; quizId: string; attemptId: string }> },
) {
    try {
        const cookie = request.cookies.get(SESSION_COOKIE_NAME)
        if (!cookie?.value) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
        }
        const session = decodeSession(cookie.value)
        if (!session) {
            return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
        }

        const { id: courseId, attemptId } = await params
        const attempt_id = parseInt(attemptId, 10)
        if (isNaN(attempt_id)) {
            return NextResponse.json({ error: 'Invalid attempt ID.' }, { status: 400 })
        }

        const body = (await request.json()) as {
            data?: Array<{ name: string; value: string }>
            finishattempt?: boolean
            timeup?: boolean
        }
        const answerData = body.data ?? []
        const finishattempt = body.finishattempt ? 1 : 0
        const timeup = body.timeup ? 1 : 0

        const result = await moodleService.processAttempt(
            session.token,
            attempt_id,
            answerData,
            finishattempt,
            timeup,
        )

        // After final submission, trigger certificate issuance silently
        if (finishattempt === 1) {
            try {
                console.log('Certificate block entered for user', session.userId)
                await moodleService.issueCertificate(1, session.userId)
                console.log('Certificate issued successfully for user', session.userId)
            } catch (certErr) {
                console.error('Certificate trigger failed:', certErr)
            }
        }

        return NextResponse.json(result)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to process attempt.'

        if (message.includes('Message was not sent')) {
            console.warn('Ignored Moodle messaging error after successful submission:', message)
            return NextResponse.json({ state: 'finished', warnings: [] })
        }

        console.error('PROCESS ATTEMPT ERROR:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
