'use client'

import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import { ProgressBar } from '@/components/course/progress-bar'
import type { HydratedMoodleModule, HydratedMoodleSection } from '@/lib/moodle/types'

interface ReaderSidebarProps {
    section: HydratedMoodleSection
    currentCmid: number
    courseId: number
    allModulesInSection: HydratedMoodleModule[]
}

function isCompleted(mod: HydratedMoodleModule): boolean {
    return (mod.completiondata?.state ?? 0) >= 1
}

export function ReaderSidebar({
    section,
    currentCmid,
    courseId,
    allModulesInSection,
}: ReaderSidebarProps) {
    const navigableModules = allModulesInSection.filter(
        (m) => m.modname !== 'label' && m.modname !== 'customcert',
    )
    const completedCount = navigableModules.filter(isCompleted).length
    const totalCount = navigableModules.length
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    return (
        <aside
            className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-[88px] self-start rounded-[var(--surface-radius,16px)]"
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-ambient, 0 4px 20px rgba(0, 0, 0, 0.25))',
                padding: '20px',
            }}
        >
            {/* Module Progress Panel */}
            <div className="pb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <p
                    className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-3"
                    style={{
                        color: 'var(--text-muted)',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    Module Progress
                </p>

                <div className="flex items-center justify-between mb-2">
                    <span
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}
                    >
                        {section.name}
                    </span>
                    <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                        style={{
                            background: 'var(--track-level-bg)',
                            border: '1px solid var(--track-level-border)',
                            color: 'var(--glow-primary)',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    >
                        {completedCount}/{totalCount}
                    </span>
                </div>

                <ProgressBar
                    percentage={percentage}
                    completed={completedCount}
                    total={totalCount}
                    height={6}
                    showLabel={false}
                />
            </div>

            {/* Roadmap Panel */}
            <div className="pt-5">
                <p
                    className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-3"
                    style={{
                        color: 'var(--text-muted)',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    Roadmap
                </p>

                <nav aria-label="Section roadmap">
                    <ul className="flex flex-col gap-1">
                        {navigableModules.map((mod) => {
                            const isCurrent = mod.id === currentCmid
                            const isDone = isCompleted(mod)

                            return (
                                <li key={mod.id}>
                                    <Link
                                        href={`/dashboard/courses/${courseId}/materials/${mod.id}`}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors"
                                        style={{
                                            background: isCurrent
                                                ? 'color-mix(in srgb, var(--glow-primary) 10%, transparent)'
                                                : 'transparent',
                                            borderLeft: isCurrent
                                                ? '2px solid var(--glow-primary)'
                                                : '2px solid transparent',
                                        }}
                                        aria-current={isCurrent ? 'step' : undefined}
                                        prefetch={true}
                                    >
                                        {isDone ? (
                                            <CheckCircle2
                                                className="h-3.5 w-3.5 shrink-0"
                                                style={{ color: 'var(--completion-done)' }}
                                            />
                                        ) : (
                                            <Circle
                                                className="h-3.5 w-3.5 shrink-0"
                                                style={{
                                                    color: isCurrent
                                                        ? 'var(--glow-primary)'
                                                        : 'var(--completion-pending)',
                                                }}
                                            />
                                        )}
                                        <span
                                            className="text-xs truncate leading-snug"
                                            style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                color: isCurrent
                                                    ? 'var(--glow-primary)'
                                                    : isDone
                                                    ? 'var(--text-secondary)'
                                                    : 'var(--text-primary)',
                                                fontWeight: isCurrent ? 600 : 400,
                                            }}
                                        >
                                            {mod.name}
                                        </span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>
            </div>
        </aside>
    )
}
