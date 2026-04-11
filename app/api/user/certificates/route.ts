import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

export async function GET(request: NextRequest) {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)
    if (!cookie?.value) {
        return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }

    try {
        const session = decodeSession(cookie.value)
        if (!session) return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })

        const adminToken = process.env.MOODLE_ADMIN_TOKEN!

        const courses = await moodleService.getUserCourses(session.token, session.userId)

        const allCertInstances = await Promise.all(
            courses.map(async (course) => {
                try {
                    const contents = await moodleService.getCourseContents(session.token, course.id)
                    return contents
                        .flatMap(s => s.modules)
                        .filter(m => m.modname === 'customcert')
                        .map(m => ({ courseId: course.id, courseName: course.fullname, customcertId: m.instance, cmid: m.id, moduleName: m.name }))
                } catch {
                    return []
                }
            })
        )
        const certInstances = allCertInstances.flat()
        const certIdToCourse = new Map(certInstances.map(c => [c.customcertId, c]))

        const result = await moodleService.getIssuedCertificates(adminToken, session.userId)
        const issues = Array.isArray(result) ? result : (result?.issues ?? [])

        const certificates = (issues as any[]).map((item) => {
            const courseInfo = certIdToCourse.get(item.issue.customcertid)
            return {
                id: item.issue.id,
                name: item.template.name ?? courseInfo?.courseName ?? 'Certificate',
                courseName: courseInfo?.courseName ?? item.template.name ?? 'Unknown Course',
                dateEarned: new Date(item.issue.timecreated * 1000).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                }),
                timestamp: item.issue.timecreated,
                downloadUrl: `/api/user/certificates/${item.issue.id}/download`,
            }
        })

        return NextResponse.json({ certificates })
    } catch (err) {
        console.error('Certificate fetch failed:', err)
        return NextResponse.json({ error: 'Failed to fetch certificates.' }, { status: 500 })
    }
}
