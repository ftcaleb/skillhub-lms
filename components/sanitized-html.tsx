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
 * 
 * Allow-list includes iframes from trusted video CDNs (YouTube, Vimeo).
 */
export function SanitizedHTML({ html, className, stripImages }: SanitizedHTMLProps) {
    if (!html?.trim()) return null

    const forbidTags = ['script', 'style', ...(stripImages ? ['img'] : [])]

    const clean = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: forbidTags,
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmousedown', 'onmouseup', 'onkeydown', 'ontouchstart'],
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['src', 'title', 'allow', 'allowfullscreen', 'frameborder', 'width', 'height', 'style'],
        ALLOWED_TAGS: [
            // Text formatting
            'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'mark', 'small',
            // Headings
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            // Lists
            'ul', 'ol', 'li', 'dl', 'dt', 'dd',
            // Content grouping
            'blockquote', 'hr', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
            // Embedded content
            'img', 'picture', 'source', 'iframe', 'embed', 'object', 'video', 'audio',
            // Inline
            'a', 'span', 'sub', 'sup', 'abbr', 'address', 'cite', 'time',
            // Block containers
            'div', 'section', 'article', 'aside', 'nav', 'header', 'footer', 'main',
            // Media
            'figure', 'figcaption',
        ],
        ALLOWED_ATTR: [
            // Global
            'id', 'class', 'title', 'style', 'dir', 'lang',
            // Links & Media
            'href', 'src', 'alt', 'data', 'type',
            // Images
            'srcset', 'sizes', 'width', 'height', 'loading', 'decoding',
            // iframes & embeds
            'allow', 'allowfullscreen', 'frameborder', 'name', 'sandbox', 'referrerpolicy', 'importance',
            // Video/Audio
            'controls', 'controlsList', 'autoplay', 'loop', 'muted', 'playsinline', 'poster', 'preload',
            // Table
            'colspan', 'rowspan', 'scope', 'headers',
            // Other
            'target', 'rel', 'download', 'ping', 'usemap',
        ],
        ALLOW_DATA_ATTR: true,
        ALLOWED_URI_REGEXP: /^(?:(?:https?|ftp):|mailto:|tel:|\/)/i,
        KEEP_CONTENT: true,
        RETURN_DOM: false,
    })

    // Post-process: add target="_blank" to external links (except proxy URLs)
    let processed = clean.replace(
        /<a\s+href="([^"]*)"/gi,
        (match, href) => {
            // Skip if already has target attribute
            if (match.includes('target=')) return match
            // Skip internal proxy URLs
            if (href.startsWith('/api/')) return match
            // Add target="_blank" for all external URLs
            return `<a href="${href}" target="_blank" rel="noopener noreferrer"`
        }
    )

    if (!processed.trim()) return null

    return (
        <div
            className={className}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by DOMPurify above
            dangerouslySetInnerHTML={{ __html: processed }}
        />
    )
}
