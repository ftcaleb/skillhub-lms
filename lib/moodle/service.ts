// ──────────────────────────────────────────────────────────────────────────────
// MoodleService — lib/moodle/service.ts
// Singleton that handles all communication with the Moodle Web Services API.
//
// Security: tokens are NEVER logged or returned to the client.
// Error handling: Moodle "200 OK with exception body" is caught and re-thrown.
// ──────────────────────────────────────────────────────────────────────────────

import type {
    MoodleSiteInfo,
    MoodleCourse,
    MoodleSection,
    MoodleCreateUserParams,
    MoodleCreatedUser,
    MoodleTokenResponse,
} from './types'

class MoodleService {
    private readonly baseUrl: string
    private readonly serviceName: string
    private readonly adminToken: string

    constructor() {
        const url = process.env.MOODLE_URL
        const service = process.env.MOODLE_SERVICE_NAME
        const adminToken = process.env.MOODLE_ADMIN_TOKEN

        if (!url) throw new Error('MOODLE_URL is not set in environment variables.')
        if (!service) throw new Error('MOODLE_SERVICE_NAME is not set in environment variables.')
        if (!adminToken) throw new Error('MOODLE_ADMIN_TOKEN is not set in environment variables.')

        this.baseUrl = url.replace(/\/$/, '')
        this.serviceName = service
        this.adminToken = adminToken
    }

    /**
     * Core POST-based fetch wrapper for Moodle REST Web Services.
     * Sends parameters as application/x-www-form-urlencoded — avoids URL length limits
     * and prevents tokens from appearing in server logs.
     *
     * Moodle "False Positive" Guard: any response body containing an `exception`
     * key is coerced into a thrown TypeScript Error regardless of HTTP status.
     */
    private async fetchWS<T>(
        token: string,
        wsfunction: string,
        params: Record<string, string | number | boolean> = {},
    ): Promise<T> {
        const body = new URLSearchParams()
        body.set('wstoken', token)
        body.set('wsfunction', wsfunction)
        body.set('moodlewsrestformat', 'json')
        for (const [key, value] of Object.entries(params)) {
            body.set(key, String(value))
        }

        const response = await fetch(`${this.baseUrl}/webservice/rest/server.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
            cache: 'no-store',
        })

        if (!response.ok) {
            throw new Error(`Moodle HTTP error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Moodle False-Positive: 200 OK but contains an exception in the body
        if (data && typeof data === 'object' && 'exception' in data) {
            const msg = data.message ?? data.exception ?? 'Unknown Moodle error'
            const code = data.errorcode ? ` [${data.errorcode}]` : ''
            throw new Error(`Moodle API Error${code}: ${msg}`)
        }

        return data as T
    }

    // ── Authentication ──────────────────────────────────────────────────────────

    /**
     * Exchange username + password for a user-scoped WS token.
     * Calls login/token.php — the only non-REST endpoint in Moodle.
     */
    async login(username: string, password: string): Promise<string> {
        const body = new URLSearchParams({
            username,
            password,
            service: this.serviceName,
        })

        const response = await fetch(`${this.baseUrl}/login/token.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
            cache: 'no-store',
        })

        if (!response.ok) {
            throw new Error(`Login request failed: HTTP ${response.status}`)
        }

        const data: MoodleTokenResponse = await response.json()

        if (data.error || data.exception) {
            throw new Error(data.error ?? data.exception ?? 'Invalid credentials')
        }

        if (!data.token) {
            throw new Error('Moodle did not return a token. Check Web Services configuration.')
        }

        return data.token
    }

    // ── Web Service Functions ───────────────────────────────────────────────────

    async getSiteInfo(token: string): Promise<MoodleSiteInfo> {
        return this.fetchWS<MoodleSiteInfo>(token, 'core_webservice_get_site_info')
    }

    async getUserCourses(token: string, userId: number): Promise<MoodleCourse[]> {
        const result = await this.fetchWS<MoodleCourse[]>(
            token,
            'core_enrol_get_users_courses',
            { userid: userId },
        )
        return Array.isArray(result) ? result : []
    }

    async getCourseContents(token: string, courseId: number): Promise<MoodleSection[]> {
        const result = await this.fetchWS<MoodleSection[]>(
            token,
            'core_course_get_contents',
            { courseid: courseId },
        )
        return Array.isArray(result) ? result : []
    }

    /**
     * Create a new Moodle user using the ADMIN token.
     * Regular user tokens cannot create users — this is an admin-only operation.
     * After this call, the caller should immediately invoke login() with the new
     * credentials to obtain a user-scoped token.
     */
    async createUser(params: MoodleCreateUserParams): Promise<MoodleCreatedUser> {
        const flatParams: Record<string, string> = {
            'users[0][username]': params.username,
            'users[0][password]': params.password,
            'users[0][firstname]': params.firstname,
            'users[0][lastname]': params.lastname,
            'users[0][email]': params.email,
            'users[0][auth]': params.auth ?? 'manual',
        }
        if (params.idnumber) flatParams['users[0][idnumber]'] = params.idnumber

        const result = await this.fetchWS<MoodleCreatedUser[]>(
            this.adminToken,
            'core_user_create_users',
            flatParams,
        )

        if (!Array.isArray(result) || result.length === 0) {
            throw new Error('Moodle did not return a created user record.')
        }

        return result[0]
    }

    /**
     * Append the WS token to a Moodle pluginfile URL so authenticated files
     * can be retrieved server-side via the file proxy route.
     */
    buildFileUrl(fileUrl: string, token: string): string {
        const url = new URL(fileUrl)
        url.searchParams.set('token', token)
        return url.toString()
    }
}

// Singleton — Node.js module cache ensures one instance per server process.
const moodleService = new MoodleService()
export default moodleService
