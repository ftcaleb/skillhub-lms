import type { Metadata } from 'next'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'
import { cookies } from 'next/headers'
import { CourseTrackPage } from './course-track-page'

interface PageProps {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params
    const courseId = parseInt(id, 10)

    try {
        const cookieStore = await cookies()
        const cookie = cookieStore.get(SESSION_COOKIE_NAME)
        if (!cookie?.value) {
            return { title: 'Course · SkillHub' }
        }

        const session = decodeSession(cookie.value)
        if (!session) {
            return { title: 'Course · SkillHub' }
        }

        const courses = await moodleService.getUserCourses(session.token, session.userId)
        const course = courses.find((c) => c.id === courseId)

        if (course) {
            return {
                title: `${course.displayname || course.fullname} · SkillHub`,
                description: course.summary?.replace(/<[^>]*>/g, '').slice(0, 160) || undefined,
            }
        }
    } catch {
        // Fallback
    }

    return { title: 'Course · SkillHub' }
}

export default async function Page({ params }: PageProps) {
    const { id } = await params
    const courseId = parseInt(id, 10)
    return <CourseTrackPage courseId={courseId} />
}
