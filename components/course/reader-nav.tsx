'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, CornerDownLeft } from 'lucide-react'
import type { HydratedMoodleModule } from '@/lib/moodle/types'

interface ReaderNavProps {
    courseId: number
    currentModule: HydratedMoodleModule
    prevModule: HydratedMoodleModule | null
    nextModule: HydratedMoodleModule | null
    currentSectionId: number | null
    isLastInSection: boolean
}

export function ReaderNav({
    courseId,
    currentModule,
    prevModule,
    nextModule,
    currentSectionId,
    isLastInSection,
}: ReaderNavProps) {
    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
            if ((e.target as HTMLElement).isContentEditable) return

            if (e.key === 'ArrowLeft' && prevModule) {
                window.location.href = `/dashboard/courses/${courseId}/materials/${prevModule.id}`
            }
            if (e.key === 'ArrowRight' && nextModule) {
                window.location.href = `/dashboard/courses/${courseId}/materials/${nextModule.id}`
            }
        },
        [courseId, prevModule, nextModule],
    )

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    return (
        <div className="flex items-center justify-between gap-4 w-full py-4 shrink-0">
            {/* Back to track */}
            <Link
                href={`/dashboard/courses/${courseId}${currentSectionId ? `#section-${currentSectionId}` : ''}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors shrink-0"
                style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)'
                    e.currentTarget.style.background = 'var(--bg-overlay)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)'
                    e.currentTarget.style.background = 'transparent'
                }}
            >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
            </Link>

            {/* Twin segmented control control for Prev / Next */}
            <div
                className="flex items-stretch rounded-[10px] overflow-hidden shrink-0"
                style={{
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                }}
            >
                {/* Previous Control */}
                {prevModule ? (
                    <Link
                        href={`/dashboard/courses/${courseId}/materials/${prevModule.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all"
                        style={{
                            color: 'var(--text-secondary)',
                            background: 'transparent',
                            fontFamily: "'DM Sans', sans-serif",
                            borderRight: '1px solid var(--border-subtle)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-elevated)'
                            e.currentTarget.style.color = 'var(--text-primary)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'var(--text-secondary)'
                        }}
                        title={prevModule.name}
                        prefetch={true}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Previous</span>
                    </Link>
                ) : (
                    <span
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium opacity-30 cursor-not-allowed"
                        style={{
                            color: 'var(--text-muted)',
                            background: 'transparent',
                            fontFamily: "'DM Sans', sans-serif",
                            borderRight: '1px solid var(--border-subtle)',
                        }}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Previous</span>
                    </span>
                )}

                {/* Next/Finish Control */}
                {nextModule ? (
                    <Link
                        href={`/dashboard/courses/${courseId}/materials/${nextModule.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all"
                        style={{
                            color: '#fff',
                            background: 'var(--glow-primary)',
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1'
                        }}
                        title={nextModule.name}
                        prefetch={true}
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                ) : (
                    <Link
                        href={`/dashboard/courses/${courseId}`}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all"
                        style={{
                            color: '#fff',
                            background: 'var(--glow-green)',
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1'
                        }}
                    >
                        <CornerDownLeft className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                            {isLastInSection ? 'Back to Track' : 'Finish'}
                        </span>
                    </Link>
                )}
            </div>
        </div>
    )
}
