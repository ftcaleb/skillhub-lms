'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText,
    Link2,
    Video,
    HelpCircle,
    MessageSquare,
    BookOpen,
    Folder,
    ExternalLink,
    Download,
    ChevronDown,
    Tag,
} from 'lucide-react'
import { SanitizedHTML } from '@/components/sanitized-html'
import type { MoodleModule, MoodleFileContent } from '@/lib/moodle/types'

interface MoodleModuleRendererProps {
    module: MoodleModule
}

/** Build a proxied URL so the file download goes through our server-side token appender */
function proxyFileUrl(fileUrl: string): string {
    return `/api/courses/file?url=${encodeURIComponent(fileUrl)}`
}

/** Derive a human-friendly icon + label for each Moodle module type */
function useModuleDisplay(modname: string) {
    const map: Record<string, { icon: typeof FileText; label: string; color: string }> = {
        label: { icon: Tag, label: 'Label', color: 'text-muted-foreground' },
        resource: { icon: FileText, label: 'File', color: 'text-blue-400' },
        url: { icon: Link2, label: 'Link', color: 'text-cyan-400' },
        page: { icon: BookOpen, label: 'Page', color: 'text-violet-400' },
        assign: { icon: FileText, label: 'Assignment', color: 'text-amber-400' },
        video: { icon: Video, label: 'Video', color: 'text-rose-400' },
        quiz: { icon: HelpCircle, label: 'Quiz', color: 'text-emerald-400' },
        forum: { icon: MessageSquare, label: 'Forum', color: 'text-sky-400' },
        folder: { icon: Folder, label: 'Folder', color: 'text-orange-400' },
    }
    return map[modname] ?? { icon: BookOpen, label: modname, color: 'text-muted-foreground' }
}

// ── Renderers per modname ──────────────────────────────────────────────────

function LabelModule({ mod }: { mod: MoodleModule }) {
    const content = mod.description ?? ''
    if (!content.trim()) return null
    return (
        <div className="rounded-lg border border-border/40 bg-secondary/30 px-4 py-3">
            <SanitizedHTML
                html={content}
                className="prose prose-sm prose-invert max-w-none text-xs leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_p]:mb-2"
            />
        </div>
    )
}

function ResourceModule({ mod }: { mod: MoodleModule }) {
    const files: MoodleFileContent[] = mod.contents ?? []
    if (files.length === 0) {
        return <GenericModule mod={mod} />
    }
    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                <p className="flex-1 text-sm font-medium text-card-foreground">{mod.name}</p>
            </div>
            <div className="flex flex-col divide-y divide-border/50">
                {files.map((file) => (
                    <a
                        key={file.filename}
                        href={proxyFileUrl(file.fileurl)}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs text-muted-foreground hover:bg-secondary/50 transition-colors group"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Download className="h-3.5 w-3.5 shrink-0 group-hover:text-foreground transition-colors" />
                        <span className="flex-1 min-w-0 truncate group-hover:text-foreground transition-colors">
                            {file.filename}
                        </span>
                        {file.filesize > 0 && (
                            <span className="shrink-0 text-[10px] text-muted-foreground/60">
                                {(file.filesize / 1024).toFixed(0)} KB
                            </span>
                        )}
                    </a>
                ))}
            </div>
        </div>
    )
}

function UrlModule({ mod }: { mod: MoodleModule }) {
    return (
        <a
            href={mod.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-card-foreground hover:border-cyan-400/30 hover:bg-secondary/50 transition-all group"
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                <ExternalLink className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{mod.name}</p>
                {mod.url && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{mod.url}</p>
                )}
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-cyan-400 transition-colors shrink-0" />
        </a>
    )
}

function PageModule({ mod }: { mod: MoodleModule }) {
    const [open, setOpen] = useState(false)
    const content = mod.description ?? ''

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                aria-expanded={open}
            >
                <BookOpen className="h-4 w-4 text-violet-400 shrink-0" />
                <p className="flex-1 text-sm font-medium text-card-foreground">{mod.name}</p>
                <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-border/50 px-4 py-4">
                            {content ? (
                                <SanitizedHTML
                                    html={content}
                                    className="prose prose-sm prose-invert max-w-none text-xs leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_p]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground"
                                />
                            ) : mod.url ? (
                                <a
                                    href={mod.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Open page
                                </a>
                            ) : null}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function AssignModule({ mod }: { mod: MoodleModule }) {
    const due = mod.dates?.find((d) => d.label.toLowerCase().includes('due'))
    return (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
            <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 mt-0.5">
                    <FileText className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground">{mod.name}</p>
                    {due && (
                        <p className="mt-0.5 text-xs text-amber-300/70">
                            Due: {new Date(due.timestamp * 1000).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </p>
                    )}
                    {mod.description && (
                        <SanitizedHTML
                            html={mod.description}
                            className="mt-2 text-xs text-muted-foreground leading-relaxed [&_p]:mb-1"
                        />
                    )}
                </div>
                {mod.url && (
                    <a
                        href={mod.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                    >
                        Open
                        <ExternalLink className="h-3 w-3" />
                    </a>
                )}
            </div>
        </div>
    )
}

function VideoModule({ mod }: { mod: MoodleModule }) {
    const file = mod.contents?.find((f) =>
        f.mimetype?.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(f.filename),
    )
    const externalUrl = mod.url

    return (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-rose-500/20">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10">
                    <Video className="h-3.5 w-3.5 text-rose-400" />
                </div>
                <p className="text-sm font-medium text-card-foreground">{mod.name}</p>
            </div>
            {file ? (
                <div className="p-4">
                    <video
                        controls
                        className="w-full rounded-lg bg-black aspect-video"
                        src={proxyFileUrl(file.fileurl)}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            ) : externalUrl ? (
                <div className="px-4 py-3">
                    <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Open video
                    </a>
                </div>
            ) : null}
        </div>
    )
}

function QuizModule({ mod }: { mod: MoodleModule }) {
    return (
        <a
            href={mod.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 hover:bg-emerald-500/10 transition-colors group"
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <HelpCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground">{mod.name}</p>
                {mod.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        Click to open quiz in Moodle
                    </p>
                )}
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-emerald-400 transition-colors shrink-0" />
        </a>
    )
}

function GenericModule({ mod }: { mod: MoodleModule }) {
    const { icon: Icon, label, color } = useModuleDisplay(mod.modname)
    return (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground">{mod.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
            </div>
            {mod.url && (
                <a
                    href={mod.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`Open ${mod.name}`}
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                </a>
            )}
        </div>
    )
}

// ── Main component ─────────────────────────────────────────────────────────

export function MoodleModuleRenderer({ module: mod }: MoodleModuleRendererProps) {
    // Step 4 — Explicit switch. No silent return null anywhere.
    switch (mod.modname) {
        case 'label':
            return <LabelModule mod={mod} />
        case 'resource':
            return <ResourceModule mod={mod} />
        case 'url':
            return <UrlModule mod={mod} />
        case 'page':
            return <PageModule mod={mod} />
        case 'assign':
            return <AssignModule mod={mod} />
        case 'video':
            return <VideoModule mod={mod} />
        case 'quiz':
            return <QuizModule mod={mod} />
        default:
            return (
                <div className="border p-4 rounded bg-zinc-900">
                    <p className="font-semibold text-foreground">{mod.name}</p>
                    <p className="text-sm text-zinc-400">
                        Unsupported module type: {mod.modname}
                    </p>
                </div>
            )
    }
}
