import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

/**
 * POST /api/courses/[id]/certificate/issue
 * Manually issue a certificate for the logged-in user.
 * 
 * Logic: Hardcodes customcertId = 1 as per requirements.
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

        // Parse params (though course ID is for routing consistency, we focus on session and hardcoded cert ID)
        const { id } = await params
        const course_id = parseInt(id, 10)
        if (isNaN(course_id)) {
            return NextResponse.json({ error: 'Invalid course ID.' }, { status: 400 })
        }

        // Call Moodle API - hardcoded customcertid = 1
        const result = await moodleService.issueCertificate(1, session.userId)

        return NextResponse.json({ 
            success: true, 
            issueid: result.issueid, 
            created: result.created 
        })
    } catch (error) {
        console.error('GENERATE CERTIFICATE ERROR:', error)
        return NextResponse.json({ error: 'Failed to generate certificate.' }, { status: 500 })
    }
}
