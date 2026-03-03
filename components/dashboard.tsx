'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Filter, BookOpen, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MoodleCourseCard } from '@/components/course-card'
import type { MoodleCourse } from '@/lib/moodle/types'

type FilterValue = 'all' | 'in-progress' | 'completed'

const filters: { label: string; value: FilterValue }[] = [
  { label: 'All Courses', value: 'all' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
]

interface DashboardProps {
  onOpenCourse: (course: MoodleCourse) => void
}

function CourseSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-secondary" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 bg-secondary rounded w-3/4" />
        <div className="h-3 bg-secondary rounded w-1/2" />
        <div className="h-3 bg-secondary rounded w-1/3" />
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <div className="h-10 w-10 rounded-full bg-secondary" />
          <div className="h-7 w-20 rounded-lg bg-secondary" />
        </div>
      </div>
    </div>
  )
}

export function Dashboard({ onOpenCourse }: DashboardProps) {
  const router = useRouter()
  const [courses, setCourses] = useState<MoodleCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/courses')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch courses.')
      // Filter out hidden courses
      setCourses((data as MoodleCourse[]).filter((c) => !c.hidden))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const filteredCourses = courses.filter((course) => {
    const progress = course.progress ?? 0
    if (activeFilter === 'completed') return progress >= 100
    if (activeFilter === 'in-progress') return progress < 100
    return true
  })

  const inProgressCount = courses.filter((c) => (c.progress ?? 0) < 100).length
  const completedCount = courses.filter((c) => (c.progress ?? 0) >= 100).length

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="h-8 w-40 bg-secondary rounded animate-pulse" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CourseSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Failed to load courses</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCourses} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Courses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {inProgressCount} in progress · {completedCount} completed · {courses.length} total
        </p>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center gap-2"
      >
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Filter courses">
          {filters.map((filter) => (
            <button
              key={filter.value}
              role="tab"
              aria-selected={activeFilter === filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeFilter === filter.value
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {activeFilter === filter.value && (
                <motion.div
                  layoutId="filter-active"
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{filter.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Course grid */}
      {courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center gap-4"
        >
          <BookOpen className="h-10 w-10 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-medium text-foreground">No enrolled courses</p>
            <p className="text-xs text-muted-foreground mt-1">
              Enrol in courses on Moodle to see them here.
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course, index) => (
              <MoodleCourseCard
                key={course.id}
                course={course}
                index={index}
                onOpen={() => onOpenCourse(course)}
              />
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-center text-muted-foreground py-12"
            >
              No courses match this filter.
            </motion.p>
          )}
        </>
      )}
    </div>
  )
}
