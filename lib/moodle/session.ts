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
 */
export function encodeSession(data: MoodleSessionData): string {
    return Buffer.from(JSON.stringify(data)).toString('base64')
}

/**
 * Decode the base64 cookie value back to session data.
 * Returns null if the value is malformed or missing.
 */
export function decodeSession(value: string): MoodleSessionData | null {
    try {
        const json = Buffer.from(value, 'base64').toString('utf-8')
        const parsed = JSON.parse(json)
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
