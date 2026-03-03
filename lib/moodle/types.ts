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
