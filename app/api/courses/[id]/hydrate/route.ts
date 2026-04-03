import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'
import { applyMoodleContentFilters } from '@/lib/moodle/contentFilter'
import type {
    HydratedCourse,
    HydratedMoodleModule,
    MoodlePageDetail,
    MoodleQuizDetail,
    MoodleResourceDetail,
    MoodleUrlDetail,
} from '@/lib/moodle/types'

// Next.js 15: params is a Promise in Route Handlers
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        // 1. Validate session
        const cookie = request.cookies.get(SESSION_COOKIE_NAME)
        if (!cookie?.value) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
        }

        const session = decodeSession(cookie.value)
        if (!session) {
            return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
        }

        // 2. Parse course ID
        const { id } = await params
        const courseId = parseInt(id, 10)
        if (isNaN(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID.' }, { status: 400 })
        }

        // 3. Fetch the base course object (for metadata)
        const courses = await moodleService.getUserCourses(session.token, session.userId)
        const course = courses.find((c) => c.id === courseId)
        if (!course) {
            return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
        }

        // 4. Fetch course structure (sections + modules)
        const sections = await moodleService.getCourseContents(session.token, courseId)

        // 5. Identify which module types are present in this course
        const moduleTypes = new Set<string>()
        sections.forEach((section) => {
            section.modules.forEach((mod) => {
                moduleTypes.add(mod.modname)
            })
        })

        // 6. Fetch module details only for module types present in the course (N+1 optimization)
        let pageDetailsByCourseModule: Map<number, MoodlePageDetail> = new Map()
        let pageDetailsByInstance: Map<number, MoodlePageDetail> = new Map()
        let quizDetails: Map<number, MoodleQuizDetail> = new Map()
        let resourceDetails: Map<number, MoodleResourceDetail> = new Map()
        let urlDetails: Map<number, MoodleUrlDetail> = new Map()

        if (moduleTypes.has('page')) {
            const pages = await moodleService.getPagesByCourseId(session.token, courseId)
            console.log('RAW PAGE CONTENT SAMPLE', pages[0]?.content?.slice(0, 300))
            console.log('RAW PAGE INTRO SAMPLE', pages[0]?.intro?.slice(0, 300))
            console.log('RAW PAGE OBJECT SAMPLE', JSON.stringify(pages[0] ?? {}, null, 2))
            pages.forEach((page) => {
                pageDetailsByCourseModule.set(page.coursemodule, page)
                pageDetailsByInstance.set(page.id, page)
            })
        }

        if (moduleTypes.has('quiz')) {
            const quizzes = await moodleService.getQuizzesByCourseId(session.token, courseId)
            quizzes.forEach((quiz) => {
                quizDetails.set(quiz.coursemodule, quiz)
            })
        }

        if (moduleTypes.has('resource')) {
            const resources = await moodleService.getResourcesByCourseId(session.token, courseId)
            resources.forEach((resource) => {
                resourceDetails.set(resource.coursemodule, resource)
            })
        }

        if (moduleTypes.has('url')) {
            const urls = await moodleService.getUrlsByCourseId(session.token, courseId)
            urls.forEach((url) => {
                urlDetails.set(url.coursemodule, url)
            })
        }

        // 7. Hydrate the module tree by attaching the detail payloads
        const hydratedSections = sections.map((section) => ({
            ...section,
            modules: section.modules.map((mod) => {
                const hydrated: HydratedMoodleModule = { ...mod }

                // Attach the appropriate detail payload based on modname and coursemodule ID
                if (mod.modname === 'page') {
                    const detail = pageDetailsByCourseModule.get(mod.id)
                        ?? pageDetailsByInstance.get(mod.instance)
                        ?? pageDetailsByInstance.get(mod.id)
                    if (detail) {
                        const filteredContent = applyMoodleContentFilters(
                            detail.content ?? '',
                            session.token,
                            process.env.MOODLE_URL ?? '',
                        )
                        const filteredIntro = applyMoodleContentFilters(
                            detail.intro ?? '',
                            session.token,
                            process.env.MOODLE_URL ?? '',
                        )
                        hydrated.pageDetail = {
                            ...detail,
                            content: filteredContent,
                            intro: filteredIntro,
                        }
                    }
                }

                if (mod.modname === 'quiz') {
                    const detail = quizDetails.get(mod.id)
                    if (detail) hydrated.quizDetail = detail
                }

                if (mod.modname === 'resource') {
                    const detail = resourceDetails.get(mod.id)
                    if (detail) hydrated.resourceDetail = detail
                }

                if (mod.modname === 'url') {
                    const detail = urlDetails.get(mod.id)
                    if (detail) hydrated.urlDetail = detail
                }

                return hydrated
            }),
        }))

        // 8. Build and return the hydrated course object
        const hydratedCourse: HydratedCourse = {
            ...course,
            sections: hydratedSections,
        }

        return NextResponse.json(hydratedCourse)
    } catch (error: unknown) {
        console.error('COURSE HYDRATION ERROR:')
        console.error(error)
        const message = error instanceof Error ? error.message : 'Failed to hydrate course.'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
