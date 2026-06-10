'use client'

import { CourseTrackView } from '@/components/course/course-track-view'

interface CourseTrackPageProps {
    courseId: number
}

export function CourseTrackPage({ courseId }: CourseTrackPageProps) {
    if (isNaN(courseId)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Invalid course ID.
                </p>
            </div>
        )
    }

    return <CourseTrackView courseId={courseId} />
}
