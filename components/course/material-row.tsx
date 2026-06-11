'use client'

import Link from 'next/link'
import { BookOpen, PlayCircle, HelpCircle, FileText, Link2, ChevronRight, Folder } from 'lucide-react'
import { CompletionPill } from '@/components/course/completion-pill'
import type { HydratedMoodleModule } from '@/lib/moodle/types'
import { cn } from '@/lib/utils'

interface MaterialRowProps {
    module: HydratedMoodleModule
    courseId: number
    isUpNext?: boolean
}

const iconMap: Record<string, { icon: typeof BookOpen; color: string }> = {
    page:     { icon: BookOpen,    color: 'var(--glow-primary)' },
    resource: { icon: FileText,    color: 'var(--glow-primary)' },
    url:      { icon: PlayCircle,  color: 'var(--glow-purple)' },
    video:    { icon: PlayCircle,  color: 'var(--glow-purple)' },
    quiz:     { icon: HelpCircle,  color: 'var(--glow-accent)' },
    assign:   { icon: FileText,    color: 'var(--glow-accent)' },
    folder:   { icon: Folder,      color: 'var(--glow-accent)' },
    forum:    { icon: Link2,       color: 'var(--glow-primary)' },
}

function getModuleIcon(modname: string) {
    return iconMap[modname] ?? { icon: BookOpen, color: 'var(--text-muted)' }
}

export function MaterialRow({ module, courseId, isUpNext = false }: MaterialRowProps) {
    const { icon: Icon, color } = getModuleIcon(module.modname)
    const isCompleted = (module.completiondata?.state ?? 0) >= 1

    return (
        <div
            className="group relative flex items-center gap-3 sm:gap-4 rounded-xl transition-all"
            style={{
                background: isUpNext ? 'var(--track-upnext-bg)' : 'transparent',
                borderLeft: isUpNext ? '3px solid var(--track-upnext-border)' : '3px solid transparent',
                padding: '12px 16px',
            }}
        >
            {/* Up next badge */}
            {isUpNext && (
                <span
                    className="absolute -top-2 left-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                        background: 'var(--track-upnext-bg)',
                        border: '1px solid var(--track-upnext-border)',
                        color: 'var(--track-upnext-text)',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    Up next
                </span>
            )}

            {/* Module icon */}
            <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
                style={{
                    background: isCompleted
                        ? 'rgba(16, 185, 129, 0.1)'
                        : `color-mix(in srgb, ${color} 12%, transparent)`,
                }}
            >
                <Icon
                    className="h-4 w-4"
                    style={{ color: isCompleted ? 'var(--completion-done)' : color }}
                />
            </div>

            <Link
                href={`/dashboard/courses/${courseId}/materials/${module.id}`}
                className={cn(
                    "flex-1 min-w-0 text-sm font-medium truncate transition-colors",
                    isCompleted 
                        ? "line-through text-[var(--text-muted)] decoration-[var(--text-muted)]" 
                        : "no-underline text-[var(--text-primary)]"
                )}
                style={{
                    fontFamily: "'DM Sans', sans-serif",
                }}
                prefetch={true}
            >
                {module.name}
            </Link>

            {/* Completion pill — stopPropagation handled inside */}
            <CompletionPill module={module} courseId={courseId} variant="pill" />

            {/* Chevron */}
            <ChevronRight
                className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
            />
        </div>
    )
}
