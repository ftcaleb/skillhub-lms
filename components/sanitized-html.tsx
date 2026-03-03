'use client'

import DOMPurify from 'isomorphic-dompurify'

interface SanitizedHTMLProps {
    html: string
    className?: string
}

/**
 * Renders Moodle-provided HTML safely.
 * Uses DOMPurify on the client (browser DOM) to strip XSS vectors —
 * isomorphic-dompurify means it also works during SSR via jsdom.
 */
export function SanitizedHTML({ html, className }: SanitizedHTMLProps) {
    if (!html?.trim()) return null
    const clean = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['script', 'style', 'iframe'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    })
    return (
        <div
            className={className}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by DOMPurify above
            dangerouslySetInnerHTML={{ __html: clean }}
        />
    )
}
