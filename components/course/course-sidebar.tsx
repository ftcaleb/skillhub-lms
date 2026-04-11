'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  FileText,
  HelpCircle,
  Link2,
  File,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HydratedMoodleSection, HydratedMoodleModule } from '@/lib/moodle/types'

function isModuleCompleted(mod: HydratedMoodleModule): boolean {
  if (!mod.completiondata) return false
  return mod.completiondata.state >= 1
}

function ModuleIcon({ modname }: { modname: string }) {
  const cls = 'h-3.5 w-3.5 shrink-0'
  switch (modname) {
    case 'quiz':     return <HelpCircle className={cls} />
    case 'url':      return <Link2 className={cls} />
    case 'resource': return <File className={cls} />
    case 'page':     return <FileText className={cls} />
    default:         return <BookOpen className={cls} />
  }
}

interface CourseSidebarProps {
  sections: HydratedMoodleSection[]
  activeModuleId: number | null
  expandedSections: Set<number>
  onToggleSection: (sectionId: number) => void
  onModuleClick: (moduleId: number) => void
}

export function CourseSidebar({
  sections,
  activeModuleId,
  expandedSections,
  onToggleSection,
  onModuleClick,
}: CourseSidebarProps) {
  const { completedCount, totalCount } = useMemo(() => {
    let total = 0
    let completed = 0
    for (const section of sections) {
      for (const mod of section.modules) {
        if (mod.modname === 'label' || mod.modname === 'customcert') continue
        total++
        if (isModuleCompleted(mod)) completed++
      }
    }
    return { completedCount: completed, totalCount: total }
  }, [sections])

  const progressPercent = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0

  return (
    <aside
      className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 sticky top-6 self-start h-[calc(100vh-3rem)] rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div
        className="px-4 pt-5 pb-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Table of Contents
        </p>

        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-xs"
            style={{ color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}
          >
            {completedCount} / {totalCount} completed
          </span>
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: 'var(--glow-primary)', fontFamily: "'JetBrains Mono', monospace" }}
          >
            {progressPercent}%
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-overlay)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--glow-primary), var(--glow-purple))' }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto py-2 scrollbar-thin">
        {sections.map((section) => {
          const visibleMods = section.modules.filter((m) => m.modname !== 'label' && m.modname !== 'customcert')
          if (visibleMods.length === 0) return null

          const isExpanded = expandedSections.has(section.id)
          const sectionDone = visibleMods.every(isModuleCompleted)
          const doneCount = visibleMods.filter(isModuleCompleted).length

          return (
            <div key={section.id}>
              <button
                onClick={() => onToggleSection(section.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors duration-150"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <ChevronRight
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                    isExpanded && 'rotate-90',
                  )}
                  style={{ color: 'var(--text-muted)' }}
                />
                <span
                  className="flex-1 text-xs font-semibold truncate"
                  style={{ fontFamily: "'Sora', sans-serif", color: 'var(--text-primary)' }}
                >
                  {section.name || `Section ${section.section + 1}`}
                </span>
                {sectionDone && visibleMods.length > 0 ? (
                  <CheckCircle2
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: 'var(--quiz-accent-success)' }}
                  />
                ) : (
                  <span
                    className="text-[10px] tabular-nums shrink-0"
                    style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {doneCount}/{visibleMods.length}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                    isExpanded && 'rotate-180',
                  )}
                  style={{ color: 'var(--text-muted)' }}
                />
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {visibleMods.map((mod) => {
                      const isActive = mod.id === activeModuleId
                      const isDone = isModuleCompleted(mod)

                      return (
                        <li key={mod.id}>
                          <button
                            onClick={() => onModuleClick(mod.id)}
                            className="w-full flex items-center gap-2.5 pl-8 pr-4 py-2 text-left transition-colors duration-150"
                            style={{
                              background: isActive
                                ? 'color-mix(in srgb, var(--glow-primary) 12%, transparent)'
                                : 'transparent',
                              borderLeft: isActive
                                ? '2px solid var(--glow-primary)'
                                : '2px solid transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)'
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            {isDone ? (
                              <CheckCircle2
                                className="h-3.5 w-3.5 shrink-0"
                                style={{ color: 'var(--quiz-accent-success)' }}
                              />
                            ) : (
                              <Circle
                                className="h-3.5 w-3.5 shrink-0"
                                style={{ color: isActive ? 'var(--glow-primary)' : 'var(--text-muted)' }}
                              />
                            )}
                            <span style={{ color: isActive ? 'var(--glow-primary)' : 'var(--text-muted)' }}>
                              <ModuleIcon modname={mod.modname} />
                            </span>
                            <span
                              className="text-xs truncate leading-snug"
                              style={{
                                fontFamily: "'DM Sans', sans-serif",
                                color: isActive
                                  ? 'var(--glow-primary)'
                                  : isDone
                                  ? 'var(--text-secondary)'
                                  : 'var(--text-primary)',
                                fontWeight: isActive ? 600 : 400,
                              }}
                            >
                              {mod.name}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
