import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)
    if (!cookie?.value) {
        return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }

    const session = decodeSession(cookie.value)
    if (!session) {
        return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
    }

    const { id } = await params
    const issueId = parseInt(id)
    if (isNaN(issueId)) {
        return NextResponse.json({ error: 'Invalid certificate ID.' }, { status: 400 })
    }

    const adminToken = process.env.MOODLE_ADMIN_TOKEN!

    const result = await moodleService.fetchWS(adminToken, 'mod_customcert_list_issues', {
        userid: session.userId,
        includepdf: 1,
    }) as Array<{ issue: { id: number; customcertid: number }; pdf: { content: string | null; name: string | null } }>

    const match = result.find(r => r.issue.id === issueId)

    if (!match || !match.pdf.content) {
        return NextResponse.json({ error: 'Certificate PDF not found.' }, { status: 404 })
    }

    const pdfBuffer = Buffer.from(match.pdf.content, 'base64')

    return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="certificate.pdf"`,
        },
    })
}
