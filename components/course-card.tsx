'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Play, CheckCircle2, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { CircularProgress } from '@/components/circular-progress'
import { Button } from '@/components/ui/button'
import { SanitizedHTML } from '@/components/sanitized-html'
import type { MoodleCourse } from '@/lib/moodle/types'

interface MoodleCourseCardProps {
  course: MoodleCourse
  index: number
  onOpen?: () => void
}

function courseColor(shortname: string): string {
  const colors = [
    'text-blue-400 bg-blue-500/15 border-blue-500/20',
    'text-amber-400 bg-amber-500/15 border-amber-500/20',
    'text-emerald-400 bg-emerald-500/15 border-emerald-500/20',
    'text-cyan-400 bg-cyan-500/15 border-cyan-500/20',
    'text-violet-400 bg-violet-500/15 border-violet-500/20',
    'text-rose-400 bg-rose-500/15 border-rose-500/20',
    'text-orange-400 bg-orange-500/15 border-orange-500/20',
    'text-indigo-400 bg-indigo-500/15 border-indigo-500/20',
  ]
  let hash = 0
  for (let i = 0; i < shortname.length; i++) hash = shortname.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getCourseImage(course: MoodleCourse): string | null {
  const file = course.overviewfiles?.find((f) =>
    f.mimetype?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(f.filename),
  )
  return file ? `/api/courses/file?url=${encodeURIComponent(file.fileurl)}` : null
}

export function MoodleCourseCard({ course, index, onOpen }: MoodleCourseCardProps) {
  const [imgError, setImgError] = useState(false)
  const progress = course.progress ?? 0
  const isCompleted = progress >= 100
  const thumbnail = getCourseImage(course)
  const showThumbnail = thumbnail !== null && !imgError
  const accentClass = courseColor(course.shortname)
  const textColor = accentClass.split(' ')[0]

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'transition-all duration-300',
        onOpen && 'cursor-pointer',
      )}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.borderColor = 'var(--border-glow)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card), var(--shadow-glow-sm)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      onClick={onOpen}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={onOpen ? (e) => e.key === 'Enter' && onOpen() : undefined}
    >
      <CardSpotlight className="flex flex-col flex-1 h-full">
        {/* Thumbnail */}
        <div className="relative aspect-[16/9] overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
          {showThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail!}
              alt={`${course.displayname} thumbnail`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.6) 100%)' }}
            >
              <BookOpen className="h-12 w-12 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--bg-surface) 100%)' }} />
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center rounded-md px-2 py-1"
              style={{
                background: 'rgba(6,13,24,0.8)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.7rem',
                fontWeight: 500,
                color: 'var(--glow-accent)',
                letterSpacing: '0.04em',
              }}
            >
              {course.shortname}
            </span>
          </div>
          {isCompleted && (
            <div className="absolute top-3 right-3">
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: 'var(--glow-green)',
                }}
              >
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3" style={{ padding: '16px 20px 16px' }}>
          <div className="flex-1">
            <h3
              className="line-clamp-2 text-balance"
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '1.0625rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.4,
                marginBottom: '8px',
              }}
            >
              {course.displayname || course.fullname}
            </h3>
            {course.summary && (
              <div className="mt-1.5">
                <SanitizedHTML
                  html={course.summary}
                  className="line-clamp-2 [&_*]:text-inherit [&_p]:m-0 font-sans text-sm text-[var(--text-secondary)] leading-normal"
                  stripImages={true}
                />
              </div>
            )}
          </div>

          {course.lastaccess > 0 && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock className="h-3 w-3" />
              <span>
                Last accessed{' '}
                {new Date(course.lastaccess * 1000).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
            </div>
          )}

          {/* Progress + CTA */}
          <div
            className="flex items-center justify-between pt-4 mt-2"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            {course.hasprogress ? (
              <CircularProgress value={progress} size={44} strokeWidth={3.5} />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ border: '2px solid var(--border-subtle)' }}
              >
                <span className={cn('text-xs font-bold', textColor)}>
                  {course.shortname.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <button
              className="text-xs font-semibold rounded-lg px-4 py-2 transition-all duration-200"
              style={{
                background: isCompleted ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--glow-accent), #ea580c)',
                color: isCompleted ? 'var(--text-secondary)' : 'white',
                border: isCompleted ? '1px solid var(--border-subtle)' : 'none',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: '0.875rem',
                boxShadow: isCompleted ? 'none' : 'var(--glow-orange)',
              }}
              onMouseEnter={(e) => {
                if (!isCompleted) {
                  e.currentTarget.style.filter = 'brightness(1.1)'
                  e.currentTarget.style.transform = 'scale(1.02)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              onClick={(e) => {
                e.stopPropagation()
                onOpen?.()
              }}
            >
              {isCompleted ? (
                'Review'
              ) : (
                <span className="flex items-center gap-1.5">
                  <Play className="h-3 w-3" />
                  {progress > 0 ? 'Resume' : 'Start'}
                </span>
              )}
            </button>
          </div>

          {/* Progress strip */}
          <div
            className="h-[3px] w-full rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: isCompleted
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, var(--glow-accent), var(--glow-primary))',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
            />
          </div>
        </div>
      </CardSpotlight>
    </motion.article>
  )
}

export { MoodleCourseCard as CourseCard }