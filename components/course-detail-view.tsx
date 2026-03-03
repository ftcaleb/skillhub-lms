"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  ArrowLeft,
  Play,
  FileText,
  HelpCircle,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Clock,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/circular-progress"
import { VideoPlayer } from "@/components/course/video-player"
import { ReadingContent } from "@/components/course/reading-content"
import { QuizContent } from "@/components/course/quiz-content"
import type { Course, CourseActivity, ActivityType } from "@/lib/types"

const activityIcons: Record<ActivityType, typeof Play> = {
  video: Play,
  reading: FileText,
  quiz: HelpCircle,
}

const activityLabels: Record<ActivityType, string> = {
  video: "Video",
  reading: "Reading",
  quiz: "Quiz",
}

interface CourseDetailViewProps {
  course: Course
  onBack: () => void
}

export function CourseDetailView({ course, onBack }: CourseDetailViewProps) {
  const modules = course.modules || []

  // Find the first incomplete activity as default
  const firstIncomplete = useMemo(() => {
    for (const mod of modules) {
      for (const act of mod.activities) {
        if (!act.completed) return act.id
      }
    }
    return modules[0]?.activities[0]?.id || null
  }, [modules])

  const [activeActivityId, setActiveActivityId] = useState<string | null>(firstIncomplete)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    // Expand the module that contains the active activity
    const set = new Set<string>()
    for (const mod of modules) {
      for (const act of mod.activities) {
        if (act.id === firstIncomplete) {
          set.add(mod.id)
          return set
        }
      }
    }
    if (modules[0]) set.add(modules[0].id)
    return set
  })
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(() => {
    const set = new Set<string>()
    for (const mod of modules) {
      for (const act of mod.activities) {
        if (act.completed) set.add(act.id)
      }
    }
    return set
  })
  const [outlineOpen, setOutlineOpen] = useState(true)

  const activeActivity = useMemo(() => {
    for (const mod of modules) {
      for (const act of mod.activities) {
        if (act.id === activeActivityId) return act
      }
    }
    return null
  }, [modules, activeActivityId])

  const activeModule = useMemo(() => {
    for (const mod of modules) {
      for (const act of mod.activities) {
        if (act.id === activeActivityId) return mod
      }
    }
    return null
  }, [modules, activeActivityId])

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  const handleActivitySelect = (activity: CourseActivity, moduleId: string) => {
    setActiveActivityId(activity.id)
    if (!expandedModules.has(moduleId)) {
      setExpandedModules((prev) => new Set(prev).add(moduleId))
    }
  }

  const handleMarkComplete = (activityId: string) => {
    setCompletedActivities((prev) => new Set(prev).add(activityId))
    // Auto-advance to next activity
    const allActivities = modules.flatMap((m) => m.activities.map((a) => ({ ...a, moduleId: m.id })))
    const currentIndex = allActivities.findIndex((a) => a.id === activityId)
    if (currentIndex >= 0 && currentIndex < allActivities.length - 1) {
      const next = allActivities[currentIndex + 1]
      setActiveActivityId(next.id)
      if (!expandedModules.has(next.moduleId)) {
        setExpandedModules((prev) => new Set(prev).add(next.moduleId))
      }
    }
  }

  // Calculate live progress
  const totalActivities = modules.reduce((sum, m) => sum + m.activities.length, 0)
  const completedCount = completedActivities.size
  const liveProgress = totalActivities > 0 ? Math.round((completedCount / totalActivities) * 100) : 0

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
          <div className="flex items-start gap-4">
            <div className="hidden sm:block relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground text-balance">
                {course.title}
              </h1>
              <p className="text-sm text-muted-foreground">{course.instructor}</p>
              {course.description && (
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground/80 line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <CircularProgress value={liveProgress} size={48} strokeWidth={3.5} />
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{completedCount}</span>/{totalActivities} activities
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content area */}
      <div className="flex flex-col lg:flex-row gap-0 mt-6">
        {/* Course Outline Sidebar */}
        <div className="w-full lg:w-80 shrink-0 lg:pr-6 lg:border-r lg:border-border">
          <button
            className="flex w-full items-center justify-between py-2 text-sm font-semibold text-foreground lg:cursor-default"
            onClick={() => setOutlineOpen(!outlineOpen)}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Course Outline
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform lg:hidden",
                outlineOpen && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence initial={false}>
            {outlineOpen && (
              <motion.nav
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden lg:!h-auto lg:!opacity-100"
                aria-label="Course outline"
              >
                <div className="flex flex-col gap-1 py-3 lg:max-h-[calc(100dvh-320px)] lg:overflow-y-auto lg:pr-2">
                  {modules.map((mod) => {
                    const isExpanded = expandedModules.has(mod.id)
                    const modCompletedCount = mod.activities.filter((a) =>
                      completedActivities.has(a.id)
                    ).length
                    const modTotal = mod.activities.length
                    const allDone = modCompletedCount === modTotal

                    return (
                      <div key={mod.id} className="flex flex-col">
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-colors",
                            "hover:bg-secondary/60",
                            isExpanded ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                          <span className="flex-1 line-clamp-2">{mod.title}</span>
                          <span
                            className={cn(
                              "ml-2 shrink-0 text-[10px] font-medium",
                              allDone ? "text-emerald-400" : "text-muted-foreground"
                            )}
                          >
                            {modCompletedCount}/{modTotal}
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col gap-0.5 py-1 pl-5">
                                {mod.activities.map((activity) => {
                                  const Icon = activityIcons[activity.activityType]
                                  const isActive = activeActivityId === activity.id
                                  const isDone = completedActivities.has(activity.id)

                                  return (
                                    <button
                                      key={activity.id}
                                      onClick={() => handleActivitySelect(activity, mod.id)}
                                      className={cn(
                                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs transition-colors",
                                        isActive
                                          ? "bg-primary/10 text-primary font-medium"
                                          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                                      )}
                                    >
                                      {isDone ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                      ) : isActive ? (
                                        <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-primary/20" />
                                      ) : (
                                        <Circle className="h-3.5 w-3.5 shrink-0 text-border" />
                                      )}
                                      <span className="flex-1 line-clamp-1">{activity.title}</span>
                                      <span className="ml-auto shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                        <Icon className="h-3 w-3" />
                                        {activityLabels[activity.activityType]}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 lg:pl-6 pt-4 lg:pt-0">
          <AnimatePresence mode="wait">
            {activeActivity ? (
              <motion.div
                key={activeActivity.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                {/* Activity header */}
                <div className="mb-5 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{activeModule?.title}</span>
                  </div>
                  <h2 className="text-lg font-bold text-foreground">{activeActivity.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {activeActivity.data.type === "video" && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activeActivity.data.duration}
                      </span>
                    )}
                    {activeActivity.data.type === "reading" && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activeActivity.data.estimatedMinutes} min read
                      </span>
                    )}
                    {activeActivity.data.type === "quiz" && (
                      <span className="flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" />
                        {activeActivity.data.questions.length} questions
                      </span>
                    )}
                    {completedActivities.has(activeActivity.id) && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Activity content */}
                {activeActivity.data.type === "video" && (
                  <VideoPlayer
                    activity={activeActivity.data}
                    isCompleted={completedActivities.has(activeActivity.id)}
                    onMarkComplete={() => handleMarkComplete(activeActivity.id)}
                  />
                )}
                {activeActivity.data.type === "reading" && (
                  <ReadingContent
                    activity={activeActivity.data}
                    isCompleted={completedActivities.has(activeActivity.id)}
                    onMarkComplete={() => handleMarkComplete(activeActivity.id)}
                  />
                )}
                {activeActivity.data.type === "quiz" && (
                  <QuizContent
                    activity={activeActivity.data}
                    isCompleted={completedActivities.has(activeActivity.id)}
                    onMarkComplete={() => handleMarkComplete(activeActivity.id)}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select an activity from the course outline to get started.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
