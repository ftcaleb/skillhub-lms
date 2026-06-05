import type { MoodleSessionData } from './types'

export const SESSION_COOKIE_NAME = 'moodle_session'

export const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
}

/**
 * Encode session data to a base64 string for cookie storage.
 * Data is NOT encrypted — no secrets live here, only the opaque WS token.
 * Uses standard base64 web APIs to ensure 100% compatibility with Edge runtime.
 */
export function encodeSession(data: MoodleSessionData): string {
    const str = JSON.stringify(data)
    return btoa(unescape(encodeURIComponent(str)))
}

/**
 * Decode the base64 cookie value back to session data.
 * Returns null if the value is malformed or missing.
 * Uses standard base64 web APIs to ensure 100% compatibility with Edge runtime.
 */
export function decodeSession(value: string): MoodleSessionData | null {
    try {
        const str = decodeURIComponent(escape(atob(value)))
        const parsed = JSON.parse(str)
        if (
            typeof parsed.token === 'string' &&
            typeof parsed.userId === 'number' &&
            typeof parsed.username === 'string'
        ) {
            return parsed as MoodleSessionData
        }
        return null
    } catch {
        return null
    }
}
