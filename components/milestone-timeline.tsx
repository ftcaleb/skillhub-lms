"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Circle, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Milestone } from "@/lib/types"

interface MilestoneTimelineProps {
  milestones: Milestone[]
}

export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  return (
    <div className="relative" role="list" aria-label="Career milestone timeline">
      {/* Vertical track line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" aria-hidden="true" />

      <div className="flex flex-col gap-0">
        {milestones.map((milestone, index) => {
          const isLast = index === milestones.length - 1
          return (
            <motion.div
              key={milestone.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className="relative flex items-start gap-4 py-3"
              role="listitem"
            >
              {/* Node */}
              <div className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center">
                {milestone.completed ? (
                  <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-primary/15 border border-primary/30">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                ) : (
                  <div className={cn(
                    "flex h-[30px] w-[30px] items-center justify-center rounded-full border",
                    isLast
                      ? "border-dashed border-muted-foreground/40 bg-transparent"
                      : "border-border bg-secondary"
                  )}>
                    {isLast ? (
                      <Package className="h-3.5 w-3.5 text-muted-foreground/60" />
                    ) : (
                      <Circle className="h-3 w-3 text-muted-foreground/50" />
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 items-center justify-between min-w-0 pt-1">
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      milestone.completed ? "text-card-foreground" : "text-muted-foreground"
                    )}
                  >
                    {milestone.title}
                  </p>
                </div>
                <span
                  className={cn(
                    "ml-3 shrink-0 text-xs",
                    milestone.completed ? "text-muted-foreground" : "text-muted-foreground/60"
                  )}
                >
                  {milestone.date}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
