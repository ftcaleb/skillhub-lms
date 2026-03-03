'use client'

import { motion } from 'framer-motion'
import { Clock, Play, CheckCircle2, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CircularProgress } from '@/components/circular-progress'
import { Button } from '@/components/ui/button'
import { SanitizedHTML } from '@/components/sanitized-html'
import type { MoodleCourse } from '@/lib/moodle/types'

interface MoodleCourseCardProps {
  course: MoodleCourse
  index: number
  onOpen?: () => void
}

/** Derive a consistent accent color from the course shortname */
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

/** Get the best available course image URL from Moodle overviewfiles */
function getCourseImage(course: MoodleCourse): string | null {
  const file = course.overviewfiles?.find((f) =>
    f.mimetype?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(f.filename),
  )
  return file ? `/api/courses/file?url=${encodeURIComponent(file.fileurl)}` : null
}

export function MoodleCourseCard({ course, index, onOpen }: MoodleCourseCardProps) {
  const progress = course.progress ?? 0
  const isCompleted = progress >= 100
  const thumbnail = getCourseImage(course)
  const accentClass = courseColor(course.shortname)
  // Extract just the color portion (e.g. "text-blue-400") for the abbreviation
  const textColor = accentClass.split(' ')[0]

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card',
        'transition-all duration-300',
        'hover:border-primary/30 hover:shadow-[0_0_30px_-5px] hover:shadow-primary/10 hover:-translate-y-0.5',
        onOpen && 'cursor-pointer',
      )}
      onClick={onOpen}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={onOpen ? (e) => e.key === 'Enter' && onOpen() : undefined}
    >
      {/* Thumbnail / Color block */}
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={`${course.displayname} thumbnail`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              // If proxy fails, hide the img and show the fallback
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          /* Styled fallback: course initials on gradient background */
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.6) 100%)',
            }}
          >
            <BookOpen className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />

        {/* Shortname tag */}
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
              accentClass,
            )}
          >
            {course.shortname}
          </span>
        </div>

        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/25 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold leading-snug text-card-foreground line-clamp-2 text-balance">
            {course.displayname || course.fullname}
          </h3>
          {course.summary && (
            <div className="mt-1.5">
              <SanitizedHTML
                html={course.summary}
                className="text-xs text-muted-foreground line-clamp-2 [&_*]:text-inherit [&_p]:m-0"
              />
            </div>
          )}
        </div>

        {/* Meta row */}
        {course.lastaccess > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Last accessed{' '}
              {new Date(course.lastaccess * 1000).toLocaleDateString(undefined, {
                dateStyle: 'medium',
              })}
            </span>
          </div>
        )}

        {/* Progress + CTA */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          {course.hasprogress ? (
            <CircularProgress value={progress} size={44} strokeWidth={3.5} />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-border">
              <span className={cn('text-xs font-bold', textColor)}>
                {course.shortname.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <Button
            size="sm"
            className={cn(
              'text-xs font-semibold',
              isCompleted
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
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
          </Button>
        </div>
      </div>
    </motion.article>
  )
}

// Keep the old export name as an alias to avoid breaking any remaining imports
export { MoodleCourseCard as CourseCard }
