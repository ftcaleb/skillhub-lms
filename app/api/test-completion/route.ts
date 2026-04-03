import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url)
        const userIdStr = url.searchParams.get('userId') || '13'
        const userId = parseInt(userIdStr, 10)

        // use admin token from env
        const adminToken = process.env.MOODLE_ADMIN_TOKEN
        if (!adminToken) throw new Error('No admin token')

        const courses = await moodleService.getUserCourses(adminToken, userId)
        
        let results = []
        for (const course of courses) {
            try {
                const status = await moodleService.getCourseCompletionStatus(adminToken, course.id, userId)
                results.push({ courseId: course.id, status })
            } catch (err) {
                results.push({ courseId: course.id, error: err instanceof Error ? err.message : String(err) })
            }
        }

        return NextResponse.json({ courses, completionStatuses: results })
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
