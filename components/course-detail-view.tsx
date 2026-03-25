'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  BookOpen,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SanitizedHTML } from '@/components/sanitized-html'
import { MoodleModuleRenderer } from '@/components/moodle-module-renderer'
import type { MoodleCourse, HydratedMoodleSection, HydratedMoodleModule } from '@/lib/moodle/types'

interface CourseDetailViewProps {
  course: MoodleCourse
  onBack: () => void
}

function ShimmerSkeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

function SectionsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <ShimmerSkeleton className="h-4 w-1/3 mb-4" />
          <div className="flex flex-col gap-3">
            <ShimmerSkeleton className="h-10 rounded-lg" />
            <ShimmerSkeleton className="h-10 rounded-lg" />
            <ShimmerSkeleton className="h-10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Flatten all navigable modules from sections (skip labels) */
function flattenModules(sections: HydratedMoodleSection[]): HydratedMoodleModule[] {
  const modules: HydratedMoodleModule[] = []
  for (const section of sections) {
    for (const mod of section.modules) {
      if (mod.modname !== 'label') {
        modules.push(mod)
      }
    }
  }
  return modules
}

/** Check if a module is completed based on completiondata */
function isModuleCompleted(mod: HydratedMoodleModule): boolean {
  if (!mod.completiondata) return false
  return mod.completiondata.state >= 1
}

export function CourseDetailView({ course, onBack }: CourseDetailViewProps) {
  const router = useRouter()
  const [sections, setSections] = useState<HydratedMoodleSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null)

  const fetchContents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
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

  // Flat list of navigable modules (for prev/next)
  const allModules = useMemo(() => flattenModules(sections), [sections])

  // Completion stats
  const completedModules = useMemo(
    () => allModules.filter(isModuleCompleted).length,
    [allModules],
  )
  const totalModules = allModules.length
  const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

  // Navigation
  const activeIndex = activeModuleId
    ? allModules.findIndex((m) => m.id === activeModuleId)
    : -1
  const canGoPrev = activeIndex > 0
  const canGoNext = activeIndex >= 0 && activeIndex < allModules.length - 1

  const navigateToModule = (moduleId: number) => {
    setActiveModuleId(moduleId)
    // Expand the section containing this module
    for (const section of sections) {
      if (section.modules.some((m) => m.id === moduleId)) {
        setExpandedSections((prev) => {
          const next = new Set(prev)
          next.add(section.id)
          return next
        })
        break
      }
    }
    // Scroll to the module
    setTimeout(() => {
      document.getElementById(`module-${moduleId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 100)
  }

  const handlePrev = () => {
    if (canGoPrev) navigateToModule(allModules[activeIndex - 1].id)
  }
  const handleNext = () => {
    if (canGoNext) navigateToModule(allModules[activeIndex + 1].id)
  }

  function toggleSection(sectionId: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  const visibleSections = sections

  return (
    <div className="flex flex-col gap-0">
      {/* Course header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 pb-6"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <button
          className="w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
          style={{
            color: 'var(--text-muted)',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-overlay)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1
              className="text-balance"
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '2.5rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              {course.displayname || course.fullname}
            </h1>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.8rem',
                color: 'var(--glow-accent)',
                fontWeight: 500,
              }}
            >
              {course.shortname}
            </span>
            {course.summary && (
              <div className="mt-2 max-w-xl">
                <SanitizedHTML
                  html={course.summary}
                  className="text-xs leading-relaxed [&_p]:mb-1 [&_a]:underline"
                  style={{ color: 'var(--text-secondary)' }}
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
                    stroke="var(--bg-overlay)"
                  />
                  <circle
                    cx="20" cy="20" r="16"
                    fill="none" strokeWidth="3"
                    strokeDasharray={`${((course.progress ?? 0) / 100) * (2 * Math.PI * 16)} ${2 * Math.PI * 16}`}
                    strokeLinecap="round"
                    stroke="var(--glow-primary)"
                    style={{ transition: 'all 0.7s ease' }}
                  />
                </svg>
                <span
                  className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
                  style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {Math.round(course.progress ?? 0)}%
                </span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Progress</p>
                <p>
                  {visibleSections.length} section{visibleSections.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Course Progress Bar (Topic X of Y | X% Complete) */}
      {!loading && !error && totalModules > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-4 rounded-xl px-5 py-4"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)', fontFamily: "'Sora', sans-serif" }}
            >
              Module {completedModules} of {totalModules}
            </span>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: 'var(--glow-primary)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {progressPercent}% Complete
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--glow-primary), var(--glow-purple))' }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </motion.div>
      )}

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
              const sectionCompleted = visibleModules
                .filter((m) => m.modname !== 'label')
                .every(isModuleCompleted)
              const sectionCompletedCount = visibleModules
                .filter((m) => m.modname !== 'label')
                .filter(isModuleCompleted).length
              const sectionTotalCount = visibleModules
                .filter((m) => m.modname !== 'label').length

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: sectionIndex * 0.06 }}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all duration-200"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    aria-expanded={isExpanded}
                  >
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform shrink-0',
                        isExpanded && 'rotate-90',
                      )}
                    />
                    {sectionCompleted && sectionTotalCount > 0 && (
                      <CheckCircle2
                        className="h-4 w-4 shrink-0"
                        style={{ color: 'var(--quiz-accent-success)' }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold"
                        style={{ fontFamily: "'Sora', sans-serif", color: 'var(--text-primary)' }}
                      >
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
                    <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                      {sectionCompletedCount}/{sectionTotalCount}
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
                        <div className="pb-5 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          {section.summary && (
                            <SanitizedHTML
                              html={section.summary}
                              className="px-5 pt-4 text-xs leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_p]:mb-1"
                            />
                          )}
                          {visibleModules.length > 0 ? (
                            <div className="flex flex-col gap-2 pt-2">
                              {visibleModules.map((mod) => (
                                <div
                                  key={mod.id}
                                  id={`module-${mod.id}`}
                                  className={cn(
                                    'relative transition-all duration-200',
                                    activeModuleId === mod.id && 'ring-2 ring-[var(--quiz-accent-primary)] rounded-xl',
                                  )}
                                >
                                  {/* Completion indicator */}
                                  {mod.modname !== 'label' && isModuleCompleted(mod) && (
                                    <div className="absolute -left-1 top-3 z-10">
                                      <CheckCircle2
                                        className="h-4 w-4"
                                        style={{ color: 'var(--quiz-accent-success)' }}
                                      />
                                    </div>
                                  )}
                                  <div
                                    role={mod.modname !== 'label' ? 'button' : undefined}
                                    tabIndex={mod.modname !== 'label' ? 0 : undefined}
                                    onClick={() => {
                                      if (mod.modname !== 'label') setActiveModuleId(mod.id)
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && mod.modname !== 'label')
                                        setActiveModuleId(mod.id)
                                    }}
                                  >
                                    <MoodleModuleRenderer module={mod} courseId={course.id} onCompletionUpdated={fetchContents} />
                                  </div>
                                </div>
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

        {/* Previous / Next Module Navigation */}
        {!loading && !error && activeModuleId !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-2 mt-6 pt-4"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoPrev}
              onClick={handlePrev}
              className="gap-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {activeIndex + 1} / {allModules.length}
            </span>
            <Button
              size="sm"
              disabled={!canGoNext}
              onClick={handleNext}
              className="gap-2 bg-[var(--quiz-accent-primary)] text-white hover:bg-[var(--quiz-accent-primary)]/90"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
