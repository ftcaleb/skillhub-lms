'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface ProgressBarProps {
    percentage: number
    completed: number
    total: number
    height?: number
    showLabel?: boolean
}

export function ProgressBar({
    percentage,
    completed,
    total,
    height = 10,
    showLabel = true,
}: ProgressBarProps) {
    const shouldReduceMotion = useReducedMotion()

    return (
        <div>
            {showLabel && (
                <div className="flex items-center justify-between mb-2.5">
                    <span
                        className="text-sm font-medium"
                        style={{
                            color: 'var(--text-primary)',
                            fontFamily: "'Sora', sans-serif",
                        }}
                    >
                        Module {completed} of {total}
                    </span>
                    <span
                        className="text-sm font-bold tabular-nums"
                        style={{
                            color: 'var(--glow-primary)',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    >
                        {percentage}%
                    </span>
                </div>
            )}
            <div
                className="rounded-full overflow-hidden"
                style={{
                    height: `${height}px`,
                    background: 'var(--bg-overlay)',
                }}
            >
                <motion.div
                    className="h-full rounded-full"
                    style={{
                        background: 'linear-gradient(90deg, var(--glow-primary), var(--glow-purple))',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={
                        shouldReduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 60, damping: 15, mass: 1 }
                    }
                />
            </div>
        </div>
    )
}
