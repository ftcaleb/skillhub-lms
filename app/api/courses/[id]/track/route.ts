import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'
import { applyMoodleContentFilters } from '@/lib/moodle/contentFilter'
import type {
    MoodleCourse,
    HydratedMoodleModule,
    MoodlePageDetail,
    MoodleQuizDetail,
    MoodleResourceDetail,
    MoodleUrlDetail,
    HydratedMoodleSection,
} from '@/lib/moodle/types'

/**
 * GET /api/courses/[id]/track
 *
 * Unified endpoint for the Course Track page.
 * Returns course metadata, hydrated sections (with module details),
 * and overall completion stats — all in ONE payload.
 *
 * Completion truth: derived from completiondata on each module
 * returned by core_course_get_contents. No separate
 * getActivitiesCompletionStatus call.
 */
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

        // 3. Fetch course metadata + sections in parallel
        const [courses, sections] = await Promise.all([
            moodleService.getUserCourses(session.token, session.userId),
            moodleService.getCourseContents(session.token, courseId),
        ])

        const course = courses.find((c) => c.id === courseId)
        if (!course) {
            return NextResponse.json(
                { error: 'Course not found or you are not enrolled.' },
                { status: 404 },
            )
        }

        // 4. Identify which module types need detail fetching
        const moduleTypes = new Set<string>()
        sections.forEach((section) => {
            section.modules.forEach((mod) => {
                moduleTypes.add(mod.modname)
            })
        })

        // 5. Fetch module details in parallel
        const [pages, quizzes, resources, urls] = await Promise.all([
            moduleTypes.has('page')
                ? moodleService.getPagesByCourseId(session.token, courseId)
                : Promise.resolve([]),
            moduleTypes.has('quiz')
                ? moodleService.getQuizzesByCourseId(session.token, courseId)
                : Promise.resolve([]),
            moduleTypes.has('resource')
                ? moodleService.getResourcesByCourseId(session.token, courseId)
                : Promise.resolve([]),
            moduleTypes.has('url')
                ? moodleService.getUrlsByCourseId(session.token, courseId)
                : Promise.resolve([]),
        ])

        // Build lookup maps
        const pagesByCM = new Map<number, MoodlePageDetail>()
        const pagesByInstance = new Map<number, MoodlePageDetail>()
        for (const page of pages) {
            pagesByCM.set(page.coursemodule, page)
            pagesByInstance.set(page.id, page)
        }
        const quizMap = new Map<number, MoodleQuizDetail>()
        for (const quiz of quizzes) quizMap.set(quiz.coursemodule, quiz)
        const resourceMap = new Map<number, MoodleResourceDetail>()
        for (const res of resources) resourceMap.set(res.coursemodule, res)
        const urlMap = new Map<number, MoodleUrlDetail>()
        for (const url of urls) urlMap.set(url.coursemodule, url)

        // 6. Hydrate modules + compute completion from completiondata
        let totalTracked = 0
        let totalCompleted = 0

        const hydratedSections: HydratedMoodleSection[] = sections.map((section) => ({
            ...section,
            modules: section.modules.map((mod) => {
                const hydrated: HydratedMoodleModule = { ...mod }

                // Track completion from module.completiondata (single source of truth)
                if (mod.modname !== 'label' && mod.modname !== 'customcert') {
                    totalTracked++
                    if (mod.completiondata && mod.completiondata.state >= 1) {
                        totalCompleted++
                    }
                }

                // Attach detail payloads
                if (mod.modname === 'page') {
                    const detail = pagesByCM.get(mod.id)
                        ?? pagesByInstance.get(mod.instance)
                        ?? pagesByInstance.get(mod.id)
                    if (detail) {
                        hydrated.pageDetail = {
                            ...detail,
                            content: applyMoodleContentFilters(
                                detail.content ?? '',
                                session.token,
                                process.env.MOODLE_URL ?? '',
                            ),
                            intro: applyMoodleContentFilters(
                                detail.intro ?? '',
                                session.token,
                                process.env.MOODLE_URL ?? '',
                            ),
                        }
                    }
                }

                if (mod.modname === 'quiz') {
                    const detail = quizMap.get(mod.id)
                    if (detail) hydrated.quizDetail = detail
                }

                if (mod.modname === 'resource') {
                    const detail = resourceMap.get(mod.id)
                    if (detail) hydrated.resourceDetail = detail
                }

                if (mod.modname === 'url') {
                    const detail = urlMap.get(mod.id)
                    if (detail) hydrated.urlDetail = detail
                }

                return hydrated
            }),
        }))

        // 7. Build response
        return NextResponse.json({
            course,
            sections: hydratedSections,
            completion: {
                total: totalTracked,
                completed: totalCompleted,
                percentage: totalTracked > 0
                    ? Math.round((totalCompleted / totalTracked) * 100)
                    : 0,
            },
        })
    } catch (error: unknown) {
        console.error('COURSE TRACK ERROR:', error)
        const message = error instanceof Error ? error.message : 'Failed to load course track.'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
