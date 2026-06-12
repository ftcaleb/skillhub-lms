'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { BookOpen } from 'lucide-react'

interface GhostCourseCardProps {
  index: number
}

export function GhostCourseCard({ index }: GhostCourseCardProps) {
  const reducedMotion = useReducedMotion() ?? false

  const transitionProps = reducedMotion
    ? { duration: 0 }
    : { duration: 0.4, delay: index * 0.08, ease: 'easeOut' as const }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionProps}
      aria-label="Course being prepared"
      className="relative flex flex-col overflow-hidden rounded-2xl border"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Sweep overlay (the signature) */}
      {!reducedMotion && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
        >
          <div
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.07), transparent)',
              width: '40%',
              height: '100%',
              animation: 'ghost-sweep 3.8s ease-in-out infinite',
              animationDelay: `${index * 0.6}s`,
            }}
          />
        </div>
      )}

      {/* Thumbnail area */}
      <div
        aria-hidden="true"
        className="relative aspect-[16/9] overflow-hidden"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.6) 100%)',
          }}
        >
          <BookOpen
            className="h-12 w-12"
            style={{ color: 'var(--text-muted)', opacity: 0.15 }}
          />
        </div>

        {/* Bottom scrim overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 40%, var(--bg-surface) 100%)',
          }}
        />

        {/* Top-left skeleton pill */}
        <div className="absolute top-3 left-3">
          <div
            className="skeleton rounded-md"
            style={{
              width: 44,
              height: 20,
            }}
          />
        </div>

        {/* Top-right preparing status badge */}
        <div className="absolute top-3 right-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1"
            style={{
              background: 'rgba(6,13,24,0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.6rem',
              letterSpacing: '0.08em',
              color: 'var(--text-secondary)',
            }}
          >
            <span
              className={reducedMotion ? '' : 'animate-pulse'}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--glow-accent)',
                boxShadow: '0 0 8px var(--glow-accent)',
              }}
            />
            PREPARING
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        aria-hidden="true"
        className="flex flex-1 flex-col gap-3"
        style={{ padding: '16px 20px 16px' }}
      >
        {/* Title placeholder */}
        <div className="flex flex-col gap-2">
          <div className="h-4 w-3/4 rounded skeleton" />
          <div className="h-4 w-1/2 rounded skeleton" />
        </div>

        {/* Summary placeholder */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="h-3 w-full rounded skeleton" />
          <div className="h-3 w-2/3 rounded skeleton" />
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-4 mt-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {/* Circular progress ring silhouette */}
          <div
            className="h-11 w-11 rounded-full"
            style={{ border: '2px solid var(--border-subtle)' }}
          />

          {/* Button silhouette */}
          <div
            className="h-9 w-24 rounded-lg"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          />
        </div>
      </div>
    </motion.article>
  )
}
