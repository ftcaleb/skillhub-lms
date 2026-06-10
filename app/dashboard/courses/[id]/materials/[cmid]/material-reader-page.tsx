'use client'

import { MaterialReaderView } from '@/components/course/material-reader-view'

interface MaterialReaderPageProps {
    courseId: number
    cmid: number
}

export function MaterialReaderPage({ courseId, cmid }: MaterialReaderPageProps) {
    if (isNaN(courseId) || isNaN(cmid)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Invalid course or material ID.
                </p>
            </div>
        )
    }

    return <MaterialReaderView courseId={courseId} cmid={cmid} />
}
