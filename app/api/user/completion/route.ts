import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

export async function GET(request: NextRequest) {
    try {
        const cookie = request.cookies.get(SESSION_COOKIE_NAME)
        if (!cookie?.value) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
        }

        const session = decodeSession(cookie.value)
        if (!session) {
            return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
        }

        const url = new URL(request.url)
        const userIdStr = url.searchParams.get('userId')
        const userId = userIdStr ? parseInt(userIdStr, 10) : session.userId

        // 1. Get user courses
        const courses = await moodleService.getUserCourses(session.token, userId)

        let hasCompletedAnyCourse = false
        let completedAt: string | null = null

        // 2. Check completion status for each course
        for (const course of courses) {
            try {
                const status = await moodleService.getCourseCompletionStatus(session.token, course.id, userId)
                
                if (status?.completionstatus?.completed) {
                    hasCompletedAnyCourse = true
                    
                    if (status.completionstatus.timecompleted) {
                        const date = new Date(status.completionstatus.timecompleted * 1000)
                        completedAt = date.toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        })
                    } else {
                        completedAt = "Recently"
                    }
                    break
                }
            } catch (err) {
                // If API fails (e.g. "No completion criteria set"), fallback to 100% progress
                if (course.progress === 100) {
                    hasCompletedAnyCourse = true
                    completedAt = "Completed"
                    break
                }
                console.warn(`Could not fetch completion status for course ${course.id}:`, err)
            }
        }

        return NextResponse.json({
            hasCompletedAnyCourse,
            completedAt
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch course completion status.'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
