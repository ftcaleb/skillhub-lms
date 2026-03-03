"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Clock, Play, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { CircularProgress } from "@/components/circular-progress"
import { Button } from "@/components/ui/button"
import type { Course } from "@/lib/types"

const pillarColors: Record<string, string> = {
  Logistics: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Procurement: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "Lean 6 Sigma": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Warehousing: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  "Last-Mile": "bg-orange-500/15 text-orange-400 border-orange-500/20",
  Analytics: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
}

interface CourseCardProps {
  course: Course
  index: number
}

export function CourseCard({ course, index, priority = false }: CourseCardProps & { priority?: boolean }) {
  const isCompleted = course.status === "completed"

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card",
        "transition-all duration-300",
        "hover:border-primary/30 hover:shadow-[0_0_30px_-5px] hover:shadow-primary/10 hover:-translate-y-0.5"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={course.thumbnail}
          alt={`${course.title} course thumbnail`}
          fill
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />

        {/* Pillar tag */}
        <div className="absolute top-3 left-3">
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
              pillarColors[course.pillar] || "bg-muted text-muted-foreground"
            )}
          >
            {course.pillar}
          </span>
        </div>

        {/* Status badge */}
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
            {course.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{course.instructor}</p>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {course.duration}
          </span>
          <span className="text-border">|</span>
          <span>
            {course.completedLessons}/{course.totalLessons} lessons
          </span>
        </div>

        {/* Progress + CTA row */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <CircularProgress value={course.progress} size={44} strokeWidth={3.5} />
          <Button
            size="sm"
            className={cn(
              "text-xs font-semibold",
              isCompleted
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isCompleted ? (
              "Review"
            ) : (
              <span className="flex items-center gap-1.5">
                <Play className="h-3 w-3" />
                Resume
              </span>
            )}
          </Button>
        </div>
      </div>
    </motion.article>
  )
}
