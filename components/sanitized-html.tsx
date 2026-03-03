'use client'

import DOMPurify from 'isomorphic-dompurify'

interface SanitizedHTMLProps {
    html: string
    className?: string
    /** Strip <img> tags — use on summaries shown in cards where Moodle file URLs can't be proxied */
    stripImages?: boolean
}

/**
 * Renders Moodle-provided HTML safely.
 * Uses DOMPurify on the client (browser DOM) to strip XSS vectors —
 * isomorphic-dompurify means it also works during SSR via jsdom.
 */
export function SanitizedHTML({ html, className, stripImages }: SanitizedHTMLProps) {
    if (!html?.trim()) return null
    const forbidTags = ['script', 'style', 'iframe', ...(stripImages ? ['img'] : [])]
    const clean = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: forbidTags,
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    })
    if (!clean.trim()) return null
    return (
        <div
            className={className}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by DOMPurify above
            dangerouslySetInnerHTML={{ __html: clean }}
        />
    )
}
