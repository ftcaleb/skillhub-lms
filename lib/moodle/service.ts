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
    MoodleUserAttemptsResponse,
    MoodleAttemptAccessInfo,
    MoodleAttemptSummaryResponse,
    MoodleAttemptReviewResponse,
    MoodleQuizFeedbackResponse,
    MoodleGradeItemsResponse,
    MoodleActivitiesCompletionStatus,
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

        // Moodle False-Positive: 200 OK but contains an error/exception in the body
        if (data && typeof data === 'object' && ('exception' in data || 'errorcode' in data)) {
            const msg = data.message ?? data.error ?? data.exception ?? 'Unknown Moodle error'
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
     * Get all attempts for a user on a specific quiz.
     */
    async getUserAttempts(
        token: string,
        quizId: number,
        userId: number,
        status: 'all' | 'finished' | 'unfinished' = 'all',
        includepreviews: 0 | 1 = 0,
    ): Promise<MoodleUserAttemptsResponse> {
        return this.fetchWS<MoodleUserAttemptsResponse>(
            token,
            'mod_quiz_get_user_attempts',
            { quizid: quizId, userid: userId },
        )
    }

    /**
     * Get access information for attempting a quiz.
     */
    async getAttemptAccessInformation(
        token: string,
        quizId: number,
        attemptId: number = 0,
    ): Promise<MoodleAttemptAccessInfo> {
        return this.fetchWS<MoodleAttemptAccessInfo>(
            token,
            'mod_quiz_get_attempt_access_information',
            { quizid: quizId, attemptid: attemptId },
        )
    }

    /**
     * Log that the user viewed the attempt.
     */
    async viewAttempt(
        token: string,
        attemptId: number,
        page: number = 0,
    ): Promise<{ status: boolean; warnings: unknown[] }> {
        return this.fetchWS(
            token,
            'mod_quiz_view_attempt',
            { attemptid: attemptId, page },
        )
    }

    /**
     * Get summary of attempt before submission.
     */
    async getAttemptSummary(
        token: string,
        attemptId: number,
    ): Promise<MoodleAttemptSummaryResponse> {
        return this.fetchWS<MoodleAttemptSummaryResponse>(
            token,
            'mod_quiz_get_attempt_summary',
            { attemptid: attemptId },
        )
    }

    /**
     * Log that the user viewed the attempt summary.
     */
    async viewAttemptSummary(
        token: string,
        attemptId: number,
    ): Promise<{ status: boolean; warnings: unknown[] }> {
        return this.fetchWS(
            token,
            'mod_quiz_view_attempt_summary',
            { attemptid: attemptId },
        )
    }

    /**
     * Log that the user viewed the quiz.
     */
    async viewQuiz(
        token: string,
        quizId: number,
    ): Promise<{ status: boolean; warnings: unknown[] }> {
        return this.fetchWS(
            token,
            'mod_quiz_view_quiz',
            { quizid: quizId },
        )
    }

    /**
     * Get completion status of activities in a course.
     */
    async getActivitiesCompletionStatus(
        token: string,
        courseId: number,
        userId: number,
    ): Promise<MoodleActivitiesCompletionStatus> {
        return this.fetchWS<MoodleActivitiesCompletionStatus>(
            token,
            'core_completion_get_activities_completion_status',
            { courseid: courseId, userid: userId },
        )
    }

    /**
     * Update completion status manually for an activity.
     */
    async updateActivityCompletionStatusManually(
        token: string,
        cmid: number,
        completed: 0 | 1,
    ): Promise<{ status: boolean; warnings: unknown[] }> {
        return this.fetchWS(
            token,
            'core_completion_update_activity_completion_status_manually',
            { cmid, completed },
        )
    }

    /**
     * Get review of a finished attempt.
     */
    async getAttemptReview(
        token: string,
        attemptId: number,
        page: number = -1,
    ): Promise<MoodleAttemptReviewResponse> {
        return this.fetchWS<MoodleAttemptReviewResponse>(
            token,
            'mod_quiz_get_attempt_review',
            { attemptid: attemptId, page },
        )
    }

    /**
     * Get feedback for a grade.
     */
    async getQuizFeedbackForGrade(
        token: string,
        quizId: number,
        grade: number,
    ): Promise<MoodleQuizFeedbackResponse> {
        return this.fetchWS<MoodleQuizFeedbackResponse>(
            token,
            'mod_quiz_get_quiz_feedback_for_grade',
            { quizid: quizId, grade },
        )
    }

    /**
     * Get grade items for a user in a course.
     */
    async getGradeItems(
        token: string,
        courseId: number,
        userId: number,
    ): Promise<MoodleGradeItemsResponse> {
        return this.fetchWS<MoodleGradeItemsResponse>(
            token,
            'gradereport_user_get_grade_items',
            { courseid: courseId, userid: userId },
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
