'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DOMPurify from 'isomorphic-dompurify'
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
    ChevronRight,
    Tag,
    Clock,
    RefreshCw,
} from 'lucide-react'
import { SanitizedHTML } from '@/components/sanitized-html'
import { Button } from '@/components/ui/button'
import { QuizContent } from '@/components/course/quiz-content'
import type { HydratedMoodleModule, MoodleFileContent } from '@/lib/moodle/types'

interface MoodleModuleRendererProps {
    module: HydratedMoodleModule
    courseId: number
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

function LabelModule({ mod }: { mod: HydratedMoodleModule }) {
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

function ResourceModule({ mod }: { mod: HydratedMoodleModule }) {
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

function UrlModule({ mod }: { mod: HydratedMoodleModule }) {
    // Prefer resourceDetail if available
    const externalUrl = mod.urlDetail?.externalurl ?? mod.url
    
    // Try to extract YouTube/Vimeo video from URL
    let youtubeId: string | null = null
    let vimeoId: string | null = null

    if (externalUrl) {
        const youtubePatterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtu\.be\/)([^\s&?]+)/i,
            /v[=\/]([^\s&?]+)/i,
        ]
        
        for (const pattern of youtubePatterns) {
            const match = externalUrl.match(pattern)
            if (match?.[1]) {
                youtubeId = match[1]
                break
            }
        }

        if (!youtubeId) {
            const vimeoMatch = externalUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/)
            if (vimeoMatch) vimeoId = vimeoMatch[1]
        }
    }

    if (youtubeId || vimeoId) {
        return (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-cyan-500/20">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10">
                        <Video className="h-3.5 w-3.5 text-cyan-400" />
                    </div>
                    <p className="text-sm font-medium text-card-foreground flex-1 truncate">{mod.name}</p>
                    <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </div>
                <div className="p-4">
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                        <iframe
                            src={youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : `https://player.vimeo.com/video/${vimeoId}`}
                            title={mod.name}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-card-foreground hover:border-cyan-400/30 hover:bg-secondary/50 transition-all group"
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                <ExternalLink className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{mod.name}</p>
                {externalUrl && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{externalUrl}</p>
                )}
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-cyan-400 transition-colors shrink-0" />
        </a>
    )
}

/**
 * Rewrite pluginfile.php URLs in HTML to go through our server-side proxy.
 * This ensures authenticated file access without exposing the token.
 */
function rewritePluginfileUrls(html: string): string {
    return html.replace(
        /(src|href)="(https?:\/\/[^"]*pluginfile\.php[^"]*)"/g,
        (_, attr, url) => `${attr}="/api/courses/file?url=${encodeURIComponent(url)}"`
    )
}

/**
 * Transform YouTube and Vimeo video links into embedded iframes
 * Converts: <a href="https://youtube.com/watch?v=ID">text</a>
 * Into: <iframe src="https://www.youtube.com/embed/ID" ...></iframe>
 * 
 * This allows videos embedded as links in page content to display as players
 */
function transformVideoLinksToIframes(html: string): string {
    // YouTube: watch?v=ID, youtu.be/ID, youtube.com/embed/ID
    // More robust regex to handle any attributes and parameters like &list=
    html = html.replace(
        /<a\s+[^>]*href=["']?(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtu\.be\/)([^"'\s&?]+)[^"']*?)["']?[^>]*>([\s\S]*?)<\/a>/gi,
        (match, url, videoId, text) => {
            const id = videoId.trim()
            // If the text is just the URL or empty, use a generic label
            const label = (text.includes('youtube.com') || !text.trim()) ? 'YouTube Video' : text.trim()
            return `<div class="video-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" title="${label}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
        }
    )

    // Vimeo: vimeo.com/ID or player.vimeo.com/video/ID
    html = html.replace(
        /<a\s+[^>]*href=["']?(https?:\/\/(?:(?:www\.)?vimeo\.com|player\.vimeo\.com\/video)\/(\d+)[^"']*)["']?[^>]*>([\s\S]*?)<\/a>/gi,
        (match, url, videoId, text) => {
            const id = videoId.trim()
            const label = (text.includes('vimeo.com') || !text.trim()) ? 'Vimeo Video' : text.trim()
            return `<div class="video-embed"><iframe width="560" height="315" src="https://player.vimeo.com/video/${id}" title="${label}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
        }
    )

    return html
}

/**
 * PageModule — Native HTML Rendering
 * 
 * Renders page.content as native HTML with prose styling (no accordion).
 * The content is fetched server-side and injected directly for a clean, expansive UX.
 */
function PageModule({ mod }: { mod: HydratedMoodleModule }) {
    // pageDetail is set during hydration
    let content = mod.pageDetail?.content ?? mod.description ?? ''

    if (!content.trim()) {
        if (mod.url) {
            return (
                <a
                    href={mod.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-primary hover:bg-secondary/50 transition-colors"
                >
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>Open Page</span>
                    <ExternalLink className="h-3.5 w-3.5 ml-auto shrink-0" />
                </a>
            )
        }
        return null
    }

    // STEP 1: Transform video links (YouTube/Vimeo/etc) to iframes
    content = transformVideoLinksToIframes(content)

    // STEP 2: Rewrite pluginfile.php URLs to use our proxy BEFORE passing to SanitizedHTML
    content = rewritePluginfileUrls(content)

    // STEP 2: Pass to SanitizedHTML which handles sanitization with proper iframe support
    // (Do NOT sanitize here - SanitizedHTML has better iframe handling)

    return (
        <div className="rounded-xl border border-violet-500/20 bg-card overflow-hidden shadow-sm">
            {/* Page title header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border/30 bg-gradient-to-r from-violet-500/10 to-transparent">
                <BookOpen className="h-5 w-5 text-violet-400 shrink-0" />
                <h2 className="text-base font-bold text-foreground">{mod.name}</h2>
            </div>

            {/* Native HTML content with prose styling */}
            <div className="px-8 py-8">
                <SanitizedHTML
                    html={content}
                    className="prose prose-invert max-w-none text-foreground [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-6 [&_h1]:text-foreground [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-foreground [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-foreground [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-5 [&_h4]:mb-2 [&_p]:mb-5 [&_p]:leading-7 [&_p]:text-sm [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-8 [&_ul]:space-y-2 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-8 [&_ol]:space-y-2 [&_li]:text-sm [&_li]:leading-6 [&_a]:text-violet-400 [&_a]:hover:text-violet-300 [&_a]:underline [&_a]:transition-colors [&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic [&_em]:text-foreground [&_code]:bg-secondary/50 [&_code]:px-2.5 [&_code]:py-1.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-purple-300 [&_pre]:bg-secondary/70 [&_pre]:p-5 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:text-sm [&_blockquote]:border-l-4 [&_blockquote]:border-violet-400/50 [&_blockquote]:pl-5 [&_blockquote]:py-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:bg-secondary/20 [&_blockquote]:rounded-r [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_th]:border [&_th]:border-border/50 [&_th]:px-4 [&_th]:py-3 [&_th]:bg-secondary/50 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_td]:border [&_td]:border-border/50 [&_td]:px-4 [&_td]:py-3 [&_td]:text-sm [&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto [&_img]:my-6 [&_img]:shadow-md [&_.video-embed]:w-full [&_.video-embed]:my-6 [&_.video-embed]:flex [&_.video-embed]:justify-center [&_iframe]:w-full [&_iframe]:rounded-lg [&_iframe]:aspect-video [&_video]:rounded-lg [&_video]:max-w-full [&_video]:my-6"
                />
            </div>
        </div>
    )
}

function AssignModule({ mod }: { mod: HydratedMoodleModule }) {
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

function VideoModule({ mod }: { mod: HydratedMoodleModule }) {
    const file = mod.contents?.find((f) =>
        f.mimetype?.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(f.filename),
    )

    // Try to extract YouTube/Vimeo video from URL
    let youtubeId: string | null = null
    let vimeoId: string | null = null

    const urlToCheck = mod.urlDetail?.externalurl ?? mod.url ?? ''

    if (urlToCheck) {
        // YouTube: multiple patterns
        // - youtube.com/watch?v=ID
        // - youtu.be/ID
        // - youtube.com/embed/ID
        const youtubePatterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^\s&?]+)/i,
            /v[=\/]([^\s&?]+)/i,
        ]
        
        for (const pattern of youtubePatterns) {
            const match = urlToCheck.match(pattern)
            if (match?.[1]) {
                youtubeId = match[1]
                break
            }
        }

        // Vimeo: extract ID from vimeo.com/ID
        if (!youtubeId) {
            const vimeoMatch = urlToCheck.match(/vimeo\.com\/(?:video\/)?(\d+)/)
            if (vimeoMatch) vimeoId = vimeoMatch[1]
        }
    }

    return (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-rose-500/20">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10">
                    <Video className="h-3.5 w-3.5 text-rose-400" />
                </div>
                <p className="text-sm font-medium text-card-foreground">{mod.name}</p>
            </div>

            <div className="p-4">
                {/* Local video file */}
                {file ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                        <video
                            controls
                            className="w-full h-full"
                            src={proxyFileUrl(file.fileurl)}
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                ) : youtubeId ? (
                    /* YouTube embed */
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                        <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title={mod.name}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ) : vimeoId ? (
                    /* Vimeo embed */
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                        <iframe
                            src={`https://player.vimeo.com/video/${vimeoId}`}
                            title={mod.name}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ) : urlToCheck ? (
                    /* Fallback: external link */
                    <a
                        href={urlToCheck}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 transition-colors"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Open video
                    </a>
                ) : null}
            </div>
        </div>
    )
}

/**
 * QuizModule — In-app Quiz Interface
 * 
 * Displays quiz metadata (intro, time limit, max attempts).
 * User clicks "Start Quiz" to begin the attempt in-app using QuizContent.
 */
function QuizModule({ mod, courseId }: { mod: HydratedMoodleModule; courseId: number }) {
    const [showQuiz, setShowQuiz] = useState(false)
    const quiz = mod.quizDetail

    if (showQuiz && quiz) {
        // Render the in-app quiz interface
        return (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-emerald-500/20 bg-secondary/30">
                    <button
                        onClick={() => setShowQuiz(false)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                        Back
                    </button>
                    <p className="text-sm font-semibold text-card-foreground flex-1">{mod.name}</p>
                </div>
                <div className="p-4 sm:p-6">
                    <QuizContent
                        quizId={quiz.id}
                        quizName={mod.name}
                        courseId={courseId}
                        timelimit={quiz.timelimit ?? 0}
                        maxAttempts={quiz.attempts ?? 0}
                    />
                </div>
            </div>
        )
    }

    // Display quiz metadata + "Start Quiz" button
    const formatTimeLimit = (seconds: number): string => {
        if (seconds === 0) return 'No time limit'
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        if (hours > 0) return `${hours}h ${minutes}m`
        return `${minutes} minutes`
    }

    const formatAttempts = (attempts: number): string => {
        if (attempts === 0) return 'Unlimited attempts'
        return `${attempts} attempt${attempts !== 1 ? 's' : ''}`
    }

    return (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-emerald-500/20">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <HelpCircle className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-card-foreground">{mod.name}</p>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-4 flex flex-col gap-4">
                {/* Quiz description / intro */}
                {(quiz?.intro || mod.description) && (
                    <div className="text-xs text-muted-foreground leading-relaxed">
                        <SanitizedHTML
                            html={quiz?.intro || mod.description || ''}
                            className="[&_p]:mb-1"
                        />
                    </div>
                )}

                {/* Metadata */}
                {quiz && (
                    <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-emerald-400/60 shrink-0" />
                            <span>{formatTimeLimit(quiz.timelimit)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <RefreshCw className="h-3.5 w-3.5 text-emerald-400/60 shrink-0" />
                            <span>{formatAttempts(quiz.attempts)}</span>
                        </div>
                    </div>
                )}

                {/* Action button */}
                <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                    onClick={() => setShowQuiz(true)}
                >
                    Start Quiz
                    <ChevronRight className="h-3.5 w-3.5 ml-2" />
                </Button>
            </div>
        </div>
    )
}

function GenericModule({ mod }: { mod: HydratedMoodleModule }) {
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

export function MoodleModuleRenderer({ module: mod, courseId }: MoodleModuleRendererProps) {
    // Explicit switch. No silent return null anywhere.
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
            return <QuizModule mod={mod} courseId={courseId} />
        default:
            return (
                <div className="border p-4 rounded bg-secondary">
                    <p className="font-semibold text-foreground">{mod.name}</p>
                    <p className="text-sm text-muted-foreground">
                        Unsupported module type: {mod.modname}
                    </p>
                </div>
            )
    }
}
