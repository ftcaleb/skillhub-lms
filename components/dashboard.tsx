"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Filter } from "lucide-react"
import { courses } from "@/lib/data"
import { CourseCard } from "@/components/course-card"
import type { CourseStatus } from "@/lib/types"

const filters: { label: string; value: "all" | CourseStatus }[] = [
  { label: "All Courses", value: "all" },
  { label: "In Progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
]

export function Dashboard() {
  const [activeFilter, setActiveFilter] = useState<"all" | CourseStatus>("all")

  const filteredCourses = courses.filter((course) =>
    activeFilter === "all" ? true : course.status === activeFilter
  )

  const inProgressCount = courses.filter((c) => c.status === "in-progress").length
  const completedCount = courses.filter((c) => c.status === "completed").length

  return (
    <div className="flex flex-col gap-8">
      {/* Header area */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Courses
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {inProgressCount} in progress, {completedCount} completed
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
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Filter courses by status">
          {filters.map((filter) => (
            <button
              key={filter.value}
              role="tab"
              aria-selected={activeFilter === filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === filter.value
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {activeFilter === filter.value && (
                <motion.div
                  layoutId="filter-active"
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{filter.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filteredCourses.map((course, index) => (
          <CourseCard key={course.id} course={course} index={index} priority={index < 3} />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <p className="text-sm text-muted-foreground">
            No courses found for this filter.
          </p>
        </motion.div>
      )}
    </div>
  )
}
