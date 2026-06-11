'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCourseData } from '@/components/course/course-data-context'
import { ReaderNav } from '@/components/course/reader-nav'
import { ReaderContent } from '@/components/course/reader-content'
import { ReaderSidebar } from '@/components/course/reader-sidebar'
import { ReaderSkeleton } from '@/components/course/reader-skeleton'
import { CompletionPill } from '@/components/course/completion-pill'

interface MaterialReaderViewProps {
    courseId: number
    cmid: number
}

export function MaterialReaderView({ courseId, cmid }: MaterialReaderViewProps) {
    const router = useRouter()
    const shouldReduceMotion = useReducedMotion()
    const {
        course,
        sections,
        loading,
        error,
        fetchTrackData,
        flatModules,
        isHydrated,
    } = useCourseData()

    // Fetch track data on mount / parameters change
    useEffect(() => {
        fetchTrackData(courseId)
    }, [courseId, fetchTrackData])

    // Redirect on auth failure
    useEffect(() => {
        if (error === 'Not authenticated.') {
            router.push('/login')
        }
    }, [error, router])

    // Derive modules and indexes once hydrated
    const { currentModule, prevModule, nextModule, currentIndex } = useMemo(() => {
        if (!isHydrated || flatModules.length === 0) {
            return { currentModule: null, prevModule: null, nextModule: null, currentIndex: -1 }
        }
        const index = flatModules.findIndex((m) => m.id === cmid)
        if (index === -1) {
            return { currentModule: null, prevModule: null, nextModule: null, currentIndex: -1 }
        }
        return {
            currentModule: flatModules[index],
            prevModule: index > 0 ? flatModules[index - 1] : null,
            nextModule: index < flatModules.length - 1 ? flatModules[index + 1] : null,
            currentIndex: index,
        }
    }, [flatModules, cmid, isHydrated])

    const currentSection = useMemo(() => {
        if (!currentModule || sections.length === 0) return null
        return sections.find((s) => s.modules.some((m) => m.id === cmid)) ?? null
    }, [currentModule, sections, cmid])

    const isLastInSection = useMemo(() => {
        if (!currentSection) return false
        const navigable = currentSection.modules.filter(
            (m) => m.modname !== 'label' && m.modname !== 'customcert'
        )
        const lastNavigable = navigable[navigable.length - 1]
        return lastNavigable?.id === cmid
    }, [currentSection, cmid])

    // Loading State
    if (loading && !isHydrated) {
        return <ReaderSkeleton />
    }

    // Error State
    if (error && error !== 'Not authenticated.') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                    <AlertCircle className="h-6 w-6" style={{ color: '#ef4444' }} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold" style={{ fontFamily: "'Sora', sans-serif", color: 'var(--text-primary)' }}>
                        Unable to Load Material
                    </h2>
                    <p className="text-sm mt-1 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                        {error}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/courses/${courseId}`)}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Course Track
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchTrackData(courseId)}
                        className="gap-2"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    // Not Found State
    if (isHydrated && !currentModule) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                    <AlertCircle className="h-6 w-6" style={{ color: '#ef4444' }} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold" style={{ fontFamily: "'Sora', sans-serif", color: 'var(--text-primary)' }}>
                        Material Not Found
                    </h2>
                    <p className="text-sm mt-1 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                        This material does not exist or you do not have permission to view it.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/courses/${courseId}`)}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Course Track
                </Button>
            </div>
        )
    }

    if (!currentModule) return null

    return (
        <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto w-full max-w-[1280px] px-8 sm:px-12 md:px-16 py-8 flex flex-col gap-6 min-h-[calc(100vh-6rem)] pb-12"
        >
            {/* Top Navigation Row */}
            <ReaderNav
                courseId={courseId}
                currentModule={currentModule}
                prevModule={prevModule}
                nextModule={nextModule}
                currentSectionId={currentSection?.id ?? null}
                isLastInSection={isLastInSection}
            />

            {/* Core Reader Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start w-full">
                {/* Main Content Area - Content Surface Card */}
                <main
                    className="w-full flex flex-col"
                    style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--surface-radius, 16px)',
                        padding: 'var(--card-padding, clamp(16px, 5vw, 48px))',
                        boxShadow: 'var(--shadow-ambient, 0 4px 20px rgba(0, 0, 0, 0.25))',
                    }}
                >
                    {/* Header */}
                    <div className="flex flex-col gap-2 mb-6">
                        <span
                            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                            style={{
                                color: 'var(--text-muted)',
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            SECTION · LEARNING MATERIAL
                        </span>

                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <h1
                                style={{
                                    fontFamily: "'Sora', sans-serif",
                                    fontSize: 'clamp(1.6rem, 3vw, 2.25rem)',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    letterSpacing: '-0.02em',
                                    lineHeight: 1.2,
                                }}
                            >
                                {currentModule.name}
                            </h1>

                            <CompletionPill
                                module={currentModule}
                                courseId={courseId}
                                variant="badge"
                            />
                        </div>
                    </div>

                    {/* Header Divider */}
                    <div
                        className="w-full mb-6"
                        style={{ borderTop: '1px solid var(--border-subtle)' }}
                    />

                    {/* Content Body */}
                    <div className="w-full max-w-[72ch]">
                        <ReaderContent
                            module={currentModule}
                            courseId={courseId}
                            onCompletionUpdated={() => fetchTrackData(courseId)}
                        />
                    </div>
                </main>

                {/* Sidebar Roadmap Navigation */}
                {currentSection && (
                    <ReaderSidebar
                        section={currentSection}
                        currentCmid={cmid}
                        courseId={courseId}
                        allModulesInSection={currentSection.modules}
                    />
                )}
            </div>
        </motion.div>
    )
}
