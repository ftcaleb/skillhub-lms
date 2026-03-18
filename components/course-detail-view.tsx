'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SanitizedHTML } from '@/components/sanitized-html'
import { MoodleModuleRenderer } from '@/components/moodle-module-renderer'
import type { MoodleCourse, HydratedMoodleSection } from '@/lib/moodle/types'

interface CourseDetailViewProps {
  course: MoodleCourse
  onBack: () => void
}

function SectionsSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <div className="h-4 w-1/3 bg-secondary rounded mb-4" />
          <div className="flex flex-col gap-3">
            <div className="h-10 bg-secondary rounded-lg" />
            <div className="h-10 bg-secondary rounded-lg" />
            <div className="h-10 bg-secondary rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CourseDetailView({ course, onBack }: CourseDetailViewProps) {
  const router = useRouter()
  const [sections, setSections] = useState<HydratedMoodleSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())

  const fetchContents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Use the hydration endpoint instead of basic contents
      // This fetches all module details in one call (N+1 optimization)
      const res = await fetch(`/api/courses/${course.id}/hydrate`)
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch course contents.')

      const sectionsData = data.sections ?? []
      setSections(sectionsData)
      const allIds = sectionsData.map((s: HydratedMoodleSection) => s.id)
      setExpandedSections(new Set(allIds))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error.')
    } finally {
      setLoading(false)
    }
  }, [course.id, router])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  function toggleSection(sectionId: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  const progress = course.progress ?? 0
  const visibleSections = sections

  return (
    <div className="flex flex-col gap-0">
      {/* Course header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 pb-6 border-b border-border"
      >
        <Button
          variant="ghost"
          size="sm"
          className="w-fit text-muted-foreground hover:text-foreground gap-1.5"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground text-balance">
              {course.displayname || course.fullname}
            </h1>
            <p className="text-sm text-muted-foreground">{course.shortname}</p>
            {course.summary && (
              <div className="mt-2 max-w-xl">
                <SanitizedHTML
                  html={course.summary}
                  className="text-xs leading-relaxed text-muted-foreground/80 [&_p]:mb-1 [&_a]:text-primary [&_a]:underline"
                  stripImages
                />
              </div>
            )}
          </div>

          {/* Progress ring */}
          {course.hasprogress && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative h-14 w-14">
                <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
                  <circle
                    cx="20" cy="20" r="16"
                    fill="none" strokeWidth="3"
                    className="stroke-secondary"
                  />
                  <circle
                    cx="20" cy="20" r="16"
                    fill="none" strokeWidth="3"
                    strokeDasharray={`${(progress / 100) * (2 * Math.PI * 16)} ${2 * Math.PI * 16}`}
                    strokeLinecap="round"
                    className="stroke-primary transition-all duration-700"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Progress</p>
                <p>
                  {visibleSections.length} section{visibleSections.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <div className="mt-6">
        {loading && <SectionsSkeleton />}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Failed to load content</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchContents} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && visibleSections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">No content available</p>
            <p className="text-xs text-muted-foreground mt-1">
              This course has no visible sections or modules.
            </p>
          </div>
        )}

        {!loading && !error && visibleSections.length > 0 && (
          <div className="flex flex-col gap-4">
            {visibleSections.map((section, sectionIndex) => {
              const isExpanded = expandedSections.has(section.id)
              const visibleModules = section.modules ?? []

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: sectionIndex * 0.06 }}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-secondary/40 transition-colors"
                    aria-expanded={isExpanded}
                  >
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform shrink-0',
                        isExpanded && 'rotate-90',
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {section.name || `Section ${section.section + 1}`}
                      </p>
                      {section.summary && !isExpanded && (
                        <SanitizedHTML
                          html={section.summary}
                          className="mt-0.5 text-xs text-muted-foreground line-clamp-1 [&_*]:text-inherit [&_p]:m-0"
                          stripImages
                        />
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {visibleModules.length} item{visibleModules.length !== 1 ? 's' : ''}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform shrink-0',
                        isExpanded && 'rotate-180',
                      )}
                    />
                  </button>

                  {/* Section content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 flex flex-col gap-3 border-t border-border/50">
                          {section.summary && (
                            <SanitizedHTML
                              html={section.summary}
                              className="pt-4 text-xs leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_p]:mb-1"
                            />
                          )}
                          {visibleModules.length > 0 ? (
                            <div className="flex flex-col gap-2 pt-2">
                              {visibleModules.map((mod) => (
                                <MoodleModuleRenderer key={mod.id} module={mod} courseId={course.id} />
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground py-4 text-center">
                              No visible activities in this section.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
