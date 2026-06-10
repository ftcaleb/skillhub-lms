'use client'

import { SanitizedHTML } from '@/components/sanitized-html'
import { QuizContent } from '@/components/course/quiz-content'
import {
    FileText,
    Download,
    ExternalLink,
    Video,
    BookOpen,
    HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { HydratedMoodleModule, MoodleFileContent } from '@/lib/moodle/types'

interface ReaderContentProps {
    module: HydratedMoodleModule
    courseId: number
    onCompletionUpdated?: () => void
}

function proxyFileUrl(fileUrl: string): string {
    return `/api/courses/file?url=${encodeURIComponent(fileUrl)}`
}

/**
 * Rewrite pluginfile.php URLs in HTML to go through the server-side proxy.
 */
function rewritePluginfileUrls(html: string): string {
    try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const urlAttrs = ['src', 'href', 'poster', 'data']

        for (const el of doc.querySelectorAll('[src], [href], [poster], [data]')) {
            for (const attr of urlAttrs) {
                const value = el.getAttribute(attr)
                if (!value) continue
                if (value.startsWith('/api/courses/file?url=')) continue
                if (value.includes('pluginfile.php')) {
                    try {
                        const decoded = decodeURIComponent(value)
                        if (decoded.includes('/api/courses/file?url=')) continue
                    } catch { /* ignore */ }
                    el.setAttribute(attr, `/api/courses/file?url=${encodeURIComponent(value)}`)
                }
            }
        }

        return doc.body.innerHTML
    } catch {
        return html.replace(
            /(src|href|poster|data)=["']?(https?:\/\/(?:[^"'>]+pluginfile\.php[^"'>]+))["']?/gi,
            (_, attr, url) => `${attr}="/api/courses/file?url=${encodeURIComponent(url)}"`,
        )
    }
}

// ── Page Content ───────────────────────────────────────────────────────────────

function PageContent({ mod }: { mod: HydratedMoodleModule }) {
    let content = mod.pageDetail?.content ?? ''

    if (!content.trim()) {
        if (mod.pageDetail?.intro?.trim()) {
            content = mod.pageDetail.intro
        } else {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BookOpen className="h-8 w-8 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        No content available for this page.
                    </p>
                </div>
            )
        }
    }

    content = rewritePluginfileUrls(content)

    return (
        <SanitizedHTML
            html={content}
            className="reader-prose"
        />
    )
}

// ── Resource/File Content ──────────────────────────────────────────────────────

function ResourceContent({ mod }: { mod: HydratedMoodleModule }) {
    const files: MoodleFileContent[] = mod.contents ?? []

    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-8 w-8 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No files available.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3 max-w-lg">
            {files.map((file) => (
                <a
                    key={file.filename}
                    href={proxyFileUrl(file.fileurl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 rounded-xl p-4 transition-all"
                    style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-glow)'
                        e.currentTarget.style.boxShadow = 'var(--shadow-glow-sm)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)'
                        e.currentTarget.style.boxShadow = 'none'
                    }}
                >
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'rgba(14, 165, 233, 0.1)' }}
                    >
                        <FileText className="h-5 w-5" style={{ color: 'var(--glow-primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {file.filename}
                        </p>
                        {file.filesize > 0 && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {(file.filesize / 1024).toFixed(0)} KB
                            </p>
                        )}
                    </div>
                    <Download className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                </a>
            ))}
        </div>
    )
}

// ── URL/Video Content ──────────────────────────────────────────────────────────

function UrlContent({ mod }: { mod: HydratedMoodleModule }) {
    const externalUrl = mod.urlDetail?.externalurl ?? mod.url

    // YouTube/Vimeo detection
    let youtubeId: string | null = null
    let vimeoId: string | null = null

    if (externalUrl) {
        const ytMatch = externalUrl.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^\s&?]+)/i,
        )
        if (ytMatch?.[1]) youtubeId = ytMatch[1]

        if (!youtubeId) {
            const vimMatch = externalUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/)
            if (vimMatch) vimeoId = vimMatch[1]
        }
    }

    if (youtubeId || vimeoId) {
        return (
            <div className="flex flex-col gap-4 max-w-3xl">
                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                    <iframe
                        src={youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : `https://player.vimeo.com/video/${vimeoId}`}
                        title={mod.name}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                {mod.urlDetail?.intro && (
                    <SanitizedHTML
                        html={mod.urlDetail.intro}
                        className="reader-prose"
                    />
                )}
            </div>
        )
    }

    // Generic link card
    return (
        <a
            href={externalUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-xl p-5 max-w-lg transition-all"
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-glow)'
                e.currentTarget.style.boxShadow = 'var(--shadow-glow-sm)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)'
                e.currentTarget.style.boxShadow = 'none'
            }}
        >
            <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'rgba(139, 92, 246, 0.1)' }}
            >
                <ExternalLink className="h-5 w-5" style={{ color: 'var(--glow-purple)' }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {mod.name}
                </p>
                {externalUrl && (
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {externalUrl}
                    </p>
                )}
            </div>
            <ExternalLink className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
        </a>
    )
}

// ── Quiz Content ───────────────────────────────────────────────────────────────

/**
 * Quiz in reader: renders inline as a summary card that expands into the
 * existing QuizContent flow. This avoids a separate quiz route and reuses
 * all existing quiz attempt/review/submit logic intact.
 *
 * Decision: summary card → inline expansion (not a separate route).
 * QuizContent is fully self-contained (manages its own phases) and already
 * renders beautifully. No need to split into a separate page.
 */
function QuizReaderContent({ mod, courseId, onCompletionUpdated }: {
    mod: HydratedMoodleModule
    courseId: number
    onCompletionUpdated?: () => void
}) {
    const quiz = mod.quizDetail
    if (!quiz) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <HelpCircle className="h-8 w-8 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Quiz details not available.
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl">
            <QuizContent
                quizId={quiz.id}
                quizName={mod.name}
                courseId={courseId}
                timelimit={quiz.timelimit ?? 0}
                maxAttempts={quiz.attempts ?? 0}
                onCompletionUpdated={onCompletionUpdated}
            />
        </div>
    )
}

// ── Main Renderer ──────────────────────────────────────────────────────────────

export function ReaderContent({ module: mod, courseId, onCompletionUpdated }: ReaderContentProps) {
    switch (mod.modname) {
        case 'page':
            return <PageContent mod={mod} />
        case 'resource':
            return <ResourceContent mod={mod} />
        case 'url':
            return <UrlContent mod={mod} />
        case 'video':
            return <UrlContent mod={mod} />
        case 'quiz':
            return <QuizReaderContent mod={mod} courseId={courseId} onCompletionUpdated={onCompletionUpdated} />
        default:
            return (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BookOpen className="h-8 w-8 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Content type "{mod.modname}" is not yet supported in the reader.
                    </p>
                </div>
            )
    }
}
