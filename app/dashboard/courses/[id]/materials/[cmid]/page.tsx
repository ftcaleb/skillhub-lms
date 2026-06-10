import type { Metadata } from 'next'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'
import { cookies } from 'next/headers'
import { MaterialReaderPage } from './material-reader-page'

interface PageProps {
    params: Promise<{ id: string; cmid: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id, cmid } = await params
    const courseId = parseInt(id, 10)
    const moduleCmid = parseInt(cmid, 10)

    try {
        const cookieStore = await cookies()
        const cookie = cookieStore.get(SESSION_COOKIE_NAME)
        if (!cookie?.value) {
            return { title: 'Material · SkillHub' }
        }

        const session = decodeSession(cookie.value)
        if (!session) {
            return { title: 'Material · SkillHub' }
        }

        const courses = await moodleService.getUserCourses(session.token, session.userId)
        const course = courses.find((c) => c.id === courseId)

        if (course) {
            const sections = await moodleService.getCourseContents(session.token, courseId)
            let moduleName = 'Material'
            for (const section of sections) {
                const mod = section.modules.find((m) => m.id === moduleCmid)
                if (mod) {
                    moduleName = mod.name
                    break
                }
            }
            return {
                title: `${moduleName} · ${course.displayname || course.fullname} · SkillHub`,
            }
        }
    } catch {
        // Fallback on error
    }

    return { title: 'Material · SkillHub' }
}

export default async function Page({ params }: PageProps) {
    const { id, cmid } = await params
    const courseId = parseInt(id, 10)
    const moduleCmid = parseInt(cmid, 10)
    return <MaterialReaderPage courseId={courseId} cmid={moduleCmid} />
}
