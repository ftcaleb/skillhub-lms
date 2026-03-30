// ──────────────────────────────────────────────────────────────────────────────
// Moodle API Types — lib/moodle/types.ts
// Source of truth for all Moodle Web Service response shapes.
// ──────────────────────────────────────────────────────────────────────────────

export interface MoodleSiteInfo {
    sitename: string
    username: string
    firstname: string
    lastname: string
    fullname: string
    userid: number
    userpictureurl: string
    lang: string
    siteurl: string
    userisbemium?: boolean
    userissiteadmin?: boolean
}

export interface MoodleCourseOverviewFile {
    filename: string
    fileurl: string
    filesize: number
    timemodified: number
    mimetype: string
}

export interface MoodleCourse {
    id: number
    shortname: string
    fullname: string
    displayname: string
    idnumber: string
    summary: string           // May contain HTML
    summaryformat: number
    startdate: number
    enddate: number
    visible: number
    enrolledusercount: number
    hasprogress: boolean
    progress: number | null   // 0–100, null if tracking disabled
    isfavourite: boolean
    hidden: boolean
    lastaccess: number
    overviewfiles: MoodleCourseOverviewFile[]
}

export interface MoodleFileContent {
    type: string
    filename: string
    filepath: string
    filesize: number
    fileurl: string
    timecreated: number
    timemodified: number
    sortorder: number
    userid?: number
    author?: string
    license?: string
    mimetype?: string
    isexternalfile?: boolean
}

export interface MoodleModuleCompletionData {
    state: number             // 0=incomplete, 1=complete, 2=complete-pass, 3=complete-fail
    timecompleted: number
    overrideby: string | null
    valueused: boolean
    hascompletion: boolean
    isautomatic?: boolean
    istrackeduser?: boolean
    uservisible?: boolean
    details?: Array<{ rulename: string; rulevalue: { status: number; description: string } }>
}

export interface MoodleModule {
    id: number
    url?: string
    name: string
    instance: number
    contextid: number
    description?: string
    visible: number
    uservisible: boolean
    visibleoncoursepage: number
    modicon: string
    modname: string
    modplural: string
    indent: number
    noviewlink?: boolean
    onclick?: string
    afterlink?: string
    activitybadge?: string
    contents?: MoodleFileContent[]
    contentfiles?: MoodleFileContent[]
    completion: number
    completiondata?: MoodleModuleCompletionData
    dates?: Array<{ label: string; timestamp: number }>
    customdata?: string
}

export interface MoodleSection {
    id: number
    name: string
    visible: number
    summary: string           // May contain HTML
    summaryformat: number
    section: number
    hiddenbylimitedaccess?: boolean
    uservisible?: boolean
    availabilityinfo?: string
    modules: MoodleModule[]
}

// ── Module Hydration — Detail Payloads ──────────────────────────────────────

/**
 * Response from mod_page_get_pages_by_courses.
 * Adds rich content to a page module instance.
 */
export interface MoodlePageDetail {
    id: number
    coursemodule: number
    name: string
    intro: string             // HTML content
    introformat: number
    content: string           // Main page body (HTML)
    contentformat: number
    created: number
    modified: number
    display: number
    displayoptions: string
    revision: number
    timemodified: number
}

/**
 * Response from mod_quiz_get_quizzes_by_courses.
 * Quiz metadata for in-app rendering.
 */
export interface MoodleQuizDetail {
    id: number
    coursemodule: number
    course: number
    name: string
    intro: string
    introformat: number
    introfiles?: MoodleFileContent[]
    timeopen: number
    timeclose: number
    timelimit: number        // Seconds, 0 = no limit
    overduehandling: string
    graceperiod: number
    preferredbehaviour: string
    canredoquestions: number
    attempts: number         // Max attempts: 0 = unlimited
    attemptonlast: number
    decimalpoints: number
    questiondecimalpoints: number
    reviewattempt: number
    reviewcorrectness: number
    reviewmarks: number
    reviewspecificfeedback: number
    reviewgeneralfeedback: number
    reviewrightanswer: number
    reviewoverallfeedback: number
    questionsperpage: number
    navigation: number
    allowiembed: number
    maxattempts: number
    penaltyscheme: number
    penaltyscheme_penalty: number
    shuffleanswers: number
    shufflequestions: number
    state: string
    sumgrades: number
    grade: number
}

/**
 * Response from mod_resource_get_resources_by_courses.
 * File resource metadata.
 */
export interface MoodleResourceDetail {
    id: number
    coursemodule: number
    course: number
    name: string
    intro: string
    introformat: number
    introfiles?: MoodleFileContent[]
    contentfiles?: MoodleFileContent[]
    tobemigrated: number
    legacyfiles: number
    legacyfileslast: number
    display: number
    displayoptions: string
    filterfiles: number
    revision: number
    timemodified: number
}

/**
 * Response from mod_url_get_urls_by_courses.
 * External URL/link metadata.
 */
export interface MoodleUrlDetail {
    id: number
    coursemodule: number
    course: number
    name: string
    intro: string
    introformat: number
    introfiles?: MoodleFileContent[]
    externalurl: string
    display: number
    displayoptions: string
    parameters: string
    timemodified: number
}

/**
 * Hydrated module — extends MoodleModule with optional detail payloads.
 * After hydration, one of these detail fields will be populated based on modname.
 */
export interface HydratedMoodleModule extends MoodleModule {
    pageDetail?: MoodlePageDetail
    quizDetail?: MoodleQuizDetail
    resourceDetail?: MoodleResourceDetail
    urlDetail?: MoodleUrlDetail
}

/**
 * Hydrated section — contains hydrated modules.
 */
export interface HydratedMoodleSection extends MoodleSection {
    modules: HydratedMoodleModule[]
}

/**
 * Hydrated course — returned from the /api/courses/[id]/hydrate endpoint.
 * Contains all module details pre-fetched server-side.
 */
export interface HydratedCourse extends MoodleCourse {
    sections: HydratedMoodleSection[]
}

// ── Quiz Attempts ───────────────────────────────────────────────────────────

/**
 * Quiz attempt record returned from mod_quiz_start_attempt and mod_quiz_get_attempt_data.
 */
export interface MoodleQuizAttempt {
    id: number
    quiz: number
    userid: number
    attempt: number
    state: 'inprogress' | 'finished' | 'abandoned' | 'overdue'
    timestart: number
    timefinish: number
    timemodified: number
    sumgrades: number | null
}

/**
 * Response from mod_quiz_start_attempt.
 * Contains the newly created attempt and any warnings.
 */
export interface MoodleStartAttemptResponse {
    attempt: MoodleQuizAttempt
    warnings: MoodleWarning[]
}

/**
 * A single question in a quiz attempt.
 * The html field contains the fully rendered question HTML from Moodle.
 */
export interface MoodleAttemptQuestion {
    slot: number
    type: string        // e.g. 'multichoice', 'truefalse', 'shortanswer', 'match'
    number: number
    html: string        // Full rendered question HTML from Moodle
    sequencecheck: number
    state: string
    status: string
    flagged: boolean
    // Additional fields may be present in actual API response
    [key: string]: unknown
}

/**
 * Response from mod_quiz_get_attempt_data.
 * Contains the attempt, the questions for a specific page, and warnings.
 */
export interface MoodleAttemptDataResponse {
    attempt: MoodleQuizAttempt
    messages: string[]
    questions: MoodleAttemptQuestion[]
    warnings: MoodleWarning[]
}

/**
 * Response from mod_quiz_get_user_attempts.
 */
export interface MoodleUserAttemptsResponse {
    attempts: MoodleQuizAttempt[]
    warnings: MoodleWarning[]
}

/**
 * Response from mod_quiz_get_attempt_access_information.
 */
export interface MoodleAttemptAccessInfo {
    accessrules: string[]
    activerulenames: string[]
    preventnewattemptreasons: string[]
    canattempt: boolean
    canpreview: boolean
    canreviewmyattempts: boolean
    isfinished: boolean
    warnings: MoodleWarning[]
}

/**
 * Response from mod_quiz_get_attempt_summary.
 */
export interface MoodleAttemptSummaryResponse {
    questions: Array<{
        slot: number
        number: number
        state: string // 'todo' | 'complete' | 'invalid' | 'gradedright' | 'gradedwrong' | 'gradedpartial'
        status: string
        flagged: boolean
    }>
    warnings: MoodleWarning[]
}

/**
 * Response from mod_quiz_get_attempt_review.
 */
export interface MoodleAttemptReviewResponse {
    grade: string // e.g. "8.00"
    attempt: MoodleQuizAttempt
    additionaldata: unknown[]
    questions: MoodleAttemptQuestion[]
    warnings: MoodleWarning[]
}

/**
 * Response from mod_quiz_get_quiz_feedback_for_grade.
 */
export interface MoodleQuizFeedbackResponse {
    feedbacktext: string
    warnings: MoodleWarning[]
}

/**
 * Response from gradereport_user_get_grade_items.
 */
export interface MoodleGradeItemsResponse {
    usergrades: Array<{
        user: { id: number; username: string }
        gradeitems: Array<{
            id: number
            itemname: string
            iteminstance: number
            itemmodule: string
            itemnumber: number
            idnumber: string
            categoryid: number
            outcomeid: number
            scaleid: number
            locked: number
            cmid: number
            graderaw: number | null
            gradedatesubmitted: number | null
            gradedategraded: number | null
            grademin: number
            grademax: number
            gradehiddenbydate: number
            gradeneedsupdate: number
            gradeishidden: number
            gradeislocked: number
            gradeisoverridden: number
            gradeformatted: string
            feedback: string
            feedbackformat: number
        }>
    }>
    warnings: MoodleWarning[]
}

/**
 * Response from core_completion_get_activities_completion_status.
 */
export interface MoodleActivitiesCompletionStatus {
    statuses: Array<{
        cmid: number
        modname: string
        instance: number
        state: number // 0=incomplete, 1=complete, 2=complete-pass, 3=complete-fail
        timecompleted: number
        tracking: number // 0=manual, 1=automatic, 2=manual (legacy)
        overrideby: number | null
        valueused: boolean
    }>
    warnings: MoodleWarning[]
}

/**
 * Response from mod_quiz_process_attempt.
 * Indicates the attempt state after submitting answers.
 */
export interface MoodleProcessAttemptResponse {
    state: string
    warnings: MoodleWarning[]
}

/**
 * Moodle API warning object.
 * Returned in the warnings array of most API responses.
 */
export interface MoodleWarning {
    item?: string
    itemid?: number
    warningcode: string
    message: string
}

// ── Auth / Users ────────────────────────────────────────────────────────────

export interface MoodleCreateUserParams {
    username: string
    password: string
    firstname: string
    lastname: string
    email: string
    auth?: string             // default: 'manual'
    idnumber?: string
    description?: string
}

export interface MoodleCreatedUser {
    id: number
    username: string
}

export interface MoodleTokenResponse {
    token?: string
    privatetoken?: string
    error?: string
    exception?: string
    errorcode?: string
    stacktrace?: string
    debuginfo?: string
    reproductionlink?: string
}

// ── Session (stored in HTTP-Only cookie) ────────────────────────────────────

export interface MoodleSessionData {
    token: string
    userId: number
    username: string
    email?: string            // stored at signup time
}

// ── User Management & Profile ───────────────────────────────────────────────

export interface MoodleUsersByFieldUser {
    id: number
    username: string
    firstname: string
    lastname: string
    profileimageurl?: string
    profileimageurlsmall?: string
}

export interface MoodleUpdatePictureResponse {
    success: boolean
    profileimageurl: string
    warnings: MoodleWarning[]
}

