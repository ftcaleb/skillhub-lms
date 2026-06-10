'use client'

import { useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useCourseData } from '@/components/course/course-data-context'
import type { HydratedMoodleModule } from '@/lib/moodle/types'

interface CompletionPillProps {
    module: HydratedMoodleModule
    courseId: number
    /** 'pill' for inline buttons, 'badge' for reader top badge */
    variant?: 'pill' | 'badge'
}

export function CompletionPill({ module, courseId, variant = 'pill' }: CompletionPillProps) {
    const { toggleCompletion } = useCourseData()
    const [isLoading, setIsLoading] = useState(false)
    const shouldReduceMotion = useReducedMotion()

    const completionData = module.completiondata
    if (!completionData?.hascompletion) return null
    if (completionData.isautomatic) {
        // Show read-only status for automatic completions
        const isDone = completionData.state >= 1
        if (!isDone) return null
        return (
            <span
                className="inline-flex items-center gap-1.5 text-xs font-medium shrink-0"
                style={{ color: 'var(--completion-done)' }}
            >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed
            </span>
        )
    }

    const isDone = completionData.state >= 1

    const handleClick = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        if (isLoading) return

        setIsLoading(true)
        try {
            await toggleCompletion(module.id, courseId)
        } finally {
            setIsLoading(false)
        }
    }, [isLoading, module.id, courseId, toggleCompletion])

    if (variant === 'badge') {
        return (
            <button
                type="button"
                onClick={handleClick}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
                style={{
                    background: isDone ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)',
                    border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
                    color: isDone ? 'var(--completion-done)' : 'var(--text-secondary)',
                    cursor: isLoading ? 'wait' : 'pointer',
                }}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isDone ? (
                    <motion.span
                        key="done"
                        initial={shouldReduceMotion ? false : { scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2"
                    >
                        <CheckCircle2 className="h-4 w-4 completion-pop" />
                        Marked as done
                    </motion.span>
                ) : (
                    'Mark as done'
                )}
            </button>
        )
    }

    // pill variant (used in material rows on track page)
    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0"
            style={{
                background: isDone ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
                color: isDone ? 'var(--completion-done)' : 'var(--text-secondary)',
                cursor: isLoading ? 'wait' : 'pointer',
            }}
        >
            {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : isDone ? (
                <motion.span
                    key="done"
                    initial={shouldReduceMotion ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1.5"
                >
                    <CheckCircle2 className="h-3 w-3 completion-pop" />
                    Done
                </motion.span>
            ) : (
                'Mark done'
            )}
        </button>
    )
}
