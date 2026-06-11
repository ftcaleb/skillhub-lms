'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown, Lock } from 'lucide-react'
import { SectionRing } from '@/components/course/section-ring'
import { MaterialRow } from '@/components/course/material-row'
import type { HydratedMoodleModule, HydratedMoodleSection } from '@/lib/moodle/types'

interface LevelCardProps {
    section: HydratedMoodleSection
    level: number
    expanded: boolean
    onToggle: () => void
    courseId: number
    /** cmid of the first incomplete material across all sections (for "Up next") */
    firstIncompleteCmid: number | null
    /** Future: if true, the section is locked */
    locked?: boolean
}

function getNavigableModules(section: HydratedMoodleSection): HydratedMoodleModule[] {
    return section.modules.filter(
        (m) => m.modname !== 'label' && m.modname !== 'customcert',
    )
}

function getSectionMeta(modules: HydratedMoodleModule[]): string {
    const count = modules.length
    const hasQuiz = modules.some((m) => m.modname === 'quiz')
    const parts: string[] = [`${count} item${count !== 1 ? 's' : ''}`]
    if (hasQuiz) parts.push('includes quiz')
    return parts.join(' · ')
}

export function LevelCard({
    section,
    level,
    expanded,
    onToggle,
    courseId,
    firstIncompleteCmid,
    locked = false,
}: LevelCardProps) {
    const shouldReduceMotion = useReducedMotion()
    const navigableModules = getNavigableModules(section)
    const completedCount = navigableModules.filter(
        (m) => (m.completiondata?.state ?? 0) >= 1,
    ).length
    const meta = getSectionMeta(navigableModules)

    if (navigableModules.length === 0) return null

    return (
        <div
            id={`section-${section.id}`}
            className="overflow-hidden transition-shadow"
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--surface-radius, 16px)',
                opacity: locked ? 0.5 : 1,
                boxShadow: 'var(--shadow-ambient, 0 4px 20px rgba(0, 0, 0, 0.25))',
            }}
        >
            {/* Header */}
            <button
                onClick={locked ? undefined : onToggle}
                disabled={locked}
                className="w-full flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-5 sm:py-6 text-left transition-all"
                style={{
                    background: 'transparent',
                    cursor: locked ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                    if (!locked) e.currentTarget.style.background = 'var(--bg-elevated)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                }}
                aria-expanded={expanded}
                aria-controls={`section-content-${section.id}`}
            >
                {/* Level chip */}
                <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                    style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        background: locked ? 'var(--bg-overlay)' : 'var(--track-level-bg)',
                        border: `1px solid ${locked ? 'var(--border-subtle)' : 'var(--track-level-border)'}`,
                        color: locked ? 'var(--text-muted)' : 'var(--glow-primary)',
                    }}
                >
                    {locked ? <Lock className="h-3.5 w-3.5" /> : `L${level}`}
                </span>

                {/* Section info */}
                <div className="flex-1 min-w-0">
                    <p
                        className="text-sm sm:text-base font-semibold truncate"
                        style={{
                            fontFamily: "'Sora', sans-serif",
                            color: 'var(--text-primary)',
                        }}
                    >
                        {section.name || `Section ${section.section + 1}`}
                    </p>
                    <p
                        className="text-xs mt-0.5"
                        style={{
                            fontFamily: "'DM Sans', sans-serif",
                            color: 'var(--text-muted)',
                        }}
                    >
                        {meta}
                    </p>
                </div>

                {/* Completion ring */}
                <SectionRing completed={completedCount} total={navigableModules.length} />

                {/* Chevron */}
                <ChevronDown
                    className="h-4 w-4 shrink-0 transition-transform"
                    style={{
                        color: 'var(--text-muted)',
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transitionDuration: 'var(--duration-normal)',
                    }}
                />
            </button>

            {/* Content */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        id={`section-content-${section.id}`}
                        role="region"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={
                            shouldReduceMotion
                                ? { duration: 0 }
                                : { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }
                        }
                        className="overflow-hidden"
                    >
                        <div
                            className="px-6 sm:px-8 pb-6 pt-3 flex flex-col gap-2"
                            style={{ borderTop: '1px solid var(--border-subtle)' }}
                        >
                            {navigableModules.map((mod) => (
                                <MaterialRow
                                    key={mod.id}
                                    module={mod}
                                    courseId={courseId}
                                    isUpNext={mod.id === firstIncompleteCmid}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
