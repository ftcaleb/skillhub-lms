'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, BookOpen, AlertCircle, RefreshCw, Award, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCourseData } from '@/components/course/course-data-context'
import { ProgressBar } from '@/components/course/progress-bar'
import { LevelCard } from '@/components/course/level-card'
import { TrackSkeleton } from '@/components/course/track-skeleton'
import { SanitizedHTML } from '@/components/sanitized-html'
import { Sparkles } from '@/components/ui/sparkles'
import { MovingBorder } from '@/components/ui/moving-border'
import type { HydratedMoodleModule, HydratedMoodleSection } from '@/lib/moodle/types'

interface CourseTrackViewProps {
    courseId: number
}

/** Find the first incomplete module across all sections */
function findFirstIncompleteCmid(sections: HydratedMoodleSection[]): number | null {
    for (const section of sections) {
        for (const mod of section.modules) {
            if (mod.modname === 'label' || mod.modname === 'customcert') continue
            if (!mod.completiondata || mod.completiondata.state < 1) {
                return mod.id
            }
        }
    }
    return null
}

/** Find the section containing a given cmid */
function findSectionForCmid(sections: HydratedMoodleSection[], cmid: number): number | null {
    for (const section of sections) {
        if (section.modules.some((m) => m.id === cmid)) {
            return section.id
        }
    }
    return null
}

/** Find the section containing the first incomplete material */
function findSmartDefaultSection(sections: HydratedMoodleSection[]): number | null {
    const cmid = findFirstIncompleteCmid(sections)
    if (!cmid) return sections[0]?.id ?? null
    return findSectionForCmid(sections, cmid)
}

export function CourseTrackView({ courseId }: CourseTrackViewProps) {
    const router = useRouter()
    const shouldReduceMotion = useReducedMotion()
    const {
        course,
        sections,
        completion,
        loading,
        error,
        fetchTrackData,
        flatModules,
    } = useCourseData()

    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())
    const [hasAppliedDefaults, setHasAppliedDefaults] = useState(false)

    // Certificate state
    const [certIssuing, setCertIssuing] = useState(false)
    const [certIssued, setCertIssued] = useState(false)
    const [certDownloadUrl, setCertDownloadUrl] = useState<string | null>(null)
    const [certError, setCertError] = useState<string | null>(null)

    // Fetch on mount
    useEffect(() => {
        fetchTrackData(courseId)
    }, [courseId, fetchTrackData])

    // Apply expanded section defaults: hash > smart default
    useEffect(() => {
        if (loading || hasAppliedDefaults || sections.length === 0) return

        const hash = window.location.hash
        const hashSectionMatch = hash.match(/^#section-(\d+)$/)

        if (hashSectionMatch) {
            const sectionId = parseInt(hashSectionMatch[1], 10)
            setExpandedSections(new Set([sectionId]))
            // Scroll into view after render
            requestAnimationFrame(() => {
                document.getElementById(`section-${sectionId}`)?.scrollIntoView({
                    behavior: shouldReduceMotion ? 'auto' : 'smooth',
                    block: 'start',
                })
            })
        } else {
            const smartDefault = findSmartDefaultSection(sections)
            if (smartDefault !== null) {
                setExpandedSections(new Set([smartDefault]))
            }
        }

        setHasAppliedDefaults(true)
    }, [loading, sections, hasAppliedDefaults, shouldReduceMotion])

    // Certificate auto-issue at 100%
    useEffect(() => {
        if (completion.percentage !== 100 || loading || error || completion.total === 0) return

        const issueThenFetch = async () => {
            setCertIssuing(true)
            setCertError(null)
            try {
                await fetch(`/api/courses/${courseId}/certificate/issue`, { method: 'POST' })
                const res = await fetch('/api/user/certificates')
                const data = await res.json()
                const cert = (data.certificates ?? [])[0]
                if (cert?.downloadUrl) {
                    setCertDownloadUrl(cert.downloadUrl)
                    setCertIssued(true)
                } else {
                    setCertError('Certificate issued but download link not found.')
                }
            } catch {
                setCertError('Failed to generate certificate.')
            } finally {
                setCertIssuing(false)
            }
        }

        issueThenFetch()
    }, [completion.percentage, loading, error, completion.total, courseId])

    const toggleSection = useCallback((sectionId: number) => {
        setExpandedSections((prev) => {
            const next = new Set(prev)
            if (next.has(sectionId)) next.delete(sectionId)
            else next.add(sectionId)
            return next
        })
    }, [])

    const firstIncompleteCmid = useMemo(
        () => findFirstIncompleteCmid(sections),
        [sections],
    )

    // Redirect on auth failure
    useEffect(() => {
        if (error === 'Not authenticated.') {
            router.push('/login')
        }
    }, [error, router])

    // Loading state
    if (loading) return <TrackSkeleton />

    // Error state
    if (error && error !== 'Not authenticated.') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                    <AlertCircle className="h-6 w-6" style={{ color: '#ef4444' }} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold" style={{ fontFamily: "'Sora', sans-serif", color: 'var(--text-primary)' }}>
                        Unable to Load Course
                    </h2>
                    <p className="text-sm mt-1 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                        {error}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard/courses')}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Courses
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

    if (!course) return null

    const visibleSections = sections.filter(
        (s) => s.modules.some((m) => m.modname !== 'label' && m.modname !== 'customcert'),
    )

    let levelCounter = 0

    return (
        <div className="mx-auto w-full max-w-[1280px] px-4 py-8 flex flex-col gap-6">
            {/* ── Hero Section ──────────────────────────────────────────────── */}
            <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-4 pb-6"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
                <button
                    className="w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    style={{ color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--text-primary)'
                        e.currentTarget.style.background = 'var(--bg-overlay)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-muted)'
                        e.currentTarget.style.background = 'transparent'
                    }}
                    onClick={() => router.push('/dashboard/courses')}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Courses
                </button>

                <div className="flex flex-col gap-2">
                    <h1
                        className="text-balance"
                        style={{
                            fontFamily: "'Sora', sans-serif",
                            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.15,
                        }}
                    >
                        {course.displayname || course.fullname}
                    </h1>

                    {/* Course code badge */}
                    <span
                        className="inline-flex w-fit items-center rounded-full px-3 py-1"
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.75rem',
                            color: 'var(--glow-accent)',
                            fontWeight: 500,
                            background: 'rgba(249, 115, 22, 0.08)',
                            border: '1px solid rgba(249, 115, 22, 0.15)',
                        }}
                    >
                        {course.shortname}
                    </span>

                    {course.summary && (
                        <div className="mt-1 max-w-2xl">
                            <SanitizedHTML
                                html={course.summary}
                                className="text-sm leading-relaxed [&_p]:mb-1 [&_a]:underline"
                                stripImages
                            />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ── Progress Bar ──────────────────────────────────────────────── */}
            {completion.total > 0 && (
                <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="px-5 py-4"
                    style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--surface-radius, 16px)',
                        boxShadow: 'var(--shadow-ambient, 0 4px 20px rgba(0, 0, 0, 0.25))',
                    }}
                >
                    <ProgressBar
                        percentage={completion.percentage}
                        completed={completion.completed}
                        total={completion.total}
                    />
                </motion.div>
            )}

            {/* ── Certificate Banner ───────────────────────────────────────── */}
            {completion.percentage === 100 && completion.total > 0 && (
                <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="px-5 py-5 flex items-center justify-between"
                    style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: 'var(--surface-radius, 16px)',
                        boxShadow: 'var(--shadow-ambient, 0 4px 20px rgba(0, 0, 0, 0.25))',
                    }}
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                        >
                            <Sparkles sparkleCount={6}>
                                <Award className="h-6 w-6" style={{ color: 'var(--glow-green)' }} />
                            </Sparkles>
                        </div>
                        <div>
                            <h3
                                className="text-lg font-bold"
                                style={{ fontFamily: "'Sora', sans-serif", color: 'var(--text-primary)' }}
                            >
                                Course Complete 🎉
                            </h3>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Your certificate is ready to download.
                            </p>
                            {certError && (
                                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{certError}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {certIssuing ? (
                            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--glow-primary)' }} />
                                <span>Generating...</span>
                            </div>
                        ) : certDownloadUrl ? (
                            <MovingBorder
                                as="a"
                                href={certDownloadUrl}
                                download
                                duration={1800}
                                containerClassName="rounded-lg"
                                borderClassName="bg-[radial-gradient(circle,#0ea5e9,#10b981,transparent_70%)]"
                                className="px-5 py-2 text-sm font-semibold text-white"
                                style={{ background: 'var(--glow-primary)' }}
                            >
                                Download Certificate
                            </MovingBorder>
                        ) : null}
                    </div>
                </motion.div>
            )}

            {/* ── Tab Row (future: Course / Grades / Leaderboard) ──────────── */}
            <div
                className="flex items-center gap-1"
                role="tablist"
                aria-label="Course sections"
            >
                <button
                    role="tab"
                    aria-selected={true}
                    className="relative rounded-lg px-4 py-2 text-xs font-medium transition-all"
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: 'var(--glow-primary)',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-glow)',
                        boxShadow: 'var(--shadow-glow-sm)',
                    }}
                >
                    Course
                </button>
                {/* Future tabs: Grades, Leaderboard — add here without layout rework */}
            </div>

            {/* ── Level Cards ──────────────────────────────────────────────── */}
            {visibleSections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <BookOpen className="h-10 w-10 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No content available</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        This course has no visible sections or modules.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {visibleSections.map((section, i) => {
                        levelCounter++
                        return (
                            <motion.div
                                key={section.id}
                                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                            >
                                <LevelCard
                                    section={section}
                                    level={levelCounter}
                                    expanded={expandedSections.has(section.id)}
                                    onToggle={() => toggleSection(section.id)}
                                    courseId={courseId}
                                    firstIncompleteCmid={firstIncompleteCmid}
                                />
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
