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
    MoodlePageDetail,
    MoodleQuizDetail,
    MoodleResourceDetail,
    MoodleUrlDetail,
    MoodleStartAttemptResponse,
    MoodleAttemptDataResponse,
    MoodleProcessAttemptResponse,
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
     * Fetch page module details by course.
     * Returns an array of page objects with full content payloads.
     */
    async getPagesByCourseId(token: string, courseId: number): Promise<MoodlePageDetail[]> {
        const result = await this.fetchWS<{ pages: MoodlePageDetail[]; warnings: unknown[] }>(
            token,
            'mod_page_get_pages_by_courses',
            { 'courseids[0]': courseId },
        )
        return result?.pages ?? []
    }

    /**
     * Fetch quiz module details by course.
     * Returns quiz metadata (limits, attempts, etc.).
     */
    async getQuizzesByCourseId(token: string, courseId: number): Promise<MoodleQuizDetail[]> {
        const result = await this.fetchWS<{ quizzes: MoodleQuizDetail[]; warnings: unknown[] }>(
            token,
            'mod_quiz_get_quizzes_by_courses',
            { 'courseids[0]': courseId },
        )
        return result?.quizzes ?? []
    }

    /**
     * Fetch resource module details by course.
     * Returns file resource metadata.
     */
    async getResourcesByCourseId(token: string, courseId: number): Promise<MoodleResourceDetail[]> {
        const result = await this.fetchWS<{ resources: MoodleResourceDetail[]; warnings: unknown[] }>(
            token,
            'mod_resource_get_resources_by_courses',
            { 'courseids[0]': courseId },
        )
        return result?.resources ?? []
    }

    /**
     * Fetch URL module details by course.
     * Returns external URL metadata.
     */
    async getUrlsByCourseId(token: string, courseId: number): Promise<MoodleUrlDetail[]> {
        const result = await this.fetchWS<{ urls: MoodleUrlDetail[]; warnings: unknown[] }>(
            token,
            'mod_url_get_urls_by_courses',
            { 'courseids[0]': courseId },
        )
        return result?.urls ?? []
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
     * Start a new quiz attempt or resume an existing one.
     * Returns the attempt object (contains attempt ID and metadata).
     *
     * @param token User's WS token
     * @param quizId Quiz module instance ID (mod.instance)
     * @param forcenew 0 = resume existing, 1 = start new (force new even if in progress)
     */
    async startQuizAttempt(
        token: string,
        quizId: number,
        forcenew: 0 | 1 = 0,
    ): Promise<MoodleStartAttemptResponse> {
        return this.fetchWS<MoodleStartAttemptResponse>(
            token,
            'mod_quiz_start_attempt',
            { quizid: quizId, forcenew },
        )
    }

    /**
     * Fetch questions for a specific page of a quiz attempt.
     * Each question includes the fully rendered HTML from Moodle.
     *
     * @param token User's WS token
     * @param attemptId Quiz attempt ID (from startAttempt)
     * @param page Page number (0-indexed)
     */
    async getAttemptData(
        token: string,
        attemptId: number,
        page: number,
    ): Promise<MoodleAttemptDataResponse> {
        return this.fetchWS<MoodleAttemptDataResponse>(
            token,
            'mod_quiz_get_attempt_data',
            { attemptid: attemptId, page },
        )
    }

    /**
     * Submit answers for the current page of a quiz attempt.
     * Can either save the page (for navigation) or finish the attempt.
     *
     * @param token User's WS token
     * @param attemptId Quiz attempt ID
     * @param data Array of { name, value } pairs (question answer slots)
     * @param finishattempt 1 to finish, 0 to save and continue
     * @param timeup 1 if time limit was reached, 0 otherwise
     */
    async processAttempt(
        token: string,
        attemptId: number,
        data: Array<{ name: string; value: string }>,
        finishattempt: 0 | 1,
        timeup: 0 | 1 = 0,
    ): Promise<MoodleProcessAttemptResponse> {
        const params: Record<string, string | number | boolean> = {}
        params['attemptid'] = attemptId
        params['finishattempt'] = finishattempt
        params['timeup'] = timeup

        // Build array-style parameters for each answer slot
        for (let i = 0; i < data.length; i++) {
            params[`data[${i}][name]`] = data[i].name
            params[`data[${i}][value]`] = data[i].value
        }

        return this.fetchWS<MoodleProcessAttemptResponse>(
            token,
            'mod_quiz_process_attempt',
            params,
        )
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
