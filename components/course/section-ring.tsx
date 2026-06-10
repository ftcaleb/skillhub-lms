'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface SectionRingProps {
    completed: number
    total: number
    size?: number
}

export function SectionRing({ completed, total, size = 36 }: SectionRingProps) {
    const shouldReduceMotion = useReducedMotion()
    const radius = (size - 6) / 2
    const circumference = 2 * Math.PI * radius
    const percentage = total > 0 ? completed / total : 0
    const strokeDasharray = `${percentage * circumference} ${circumference}`
    const isComplete = completed === total && total > 0

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
                {/* Background ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth="3"
                    stroke="var(--bg-overlay)"
                />
                {/* Progress ring */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke={isComplete ? 'var(--completion-done)' : 'var(--glow-primary)'}
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray }}
                    transition={
                        shouldReduceMotion
                            ? { duration: 0 }
                            : { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
                    }
                />
            </svg>
            <span
                className="absolute inset-0 flex items-center justify-center tabular-nums"
                style={{
                    fontSize: size < 40 ? '9px' : '11px',
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: isComplete ? 'var(--completion-done)' : 'var(--text-primary)',
                }}
            >
                {completed}/{total}
            </span>
        </div>
    )
}
