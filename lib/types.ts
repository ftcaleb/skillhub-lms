export type CoursePillar =
  | "Logistics"
  | "Procurement"
  | "Lean 6 Sigma"
  | "Warehousing"
  | "Last-Mile"
  | "Analytics"

export type CourseStatus = "in-progress" | "completed"

export type ActivityType = "video" | "reading" | "quiz"

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  question: string
  type: "multiple-choice" | "true-false"
  options: QuizOption[]
  correctAnswerId: string
  explanation: string
}

export interface VideoActivity {
  type: "video"
  videoUrl: string
  duration: string
  transcript?: string
}

export interface ReadingActivity {
  type: "reading"
  content: string
  estimatedMinutes: number
}

export interface QuizActivity {
  type: "quiz"
  passingScore: number
  questions: QuizQuestion[]
}

export type ActivityData = VideoActivity | ReadingActivity | QuizActivity

export interface CourseActivity {
  id: string
  title: string
  activityType: ActivityType
  completed: boolean
  data: ActivityData
}

export interface CourseModule {
  id: string
  title: string
  description: string
  activities: CourseActivity[]
}

export interface Course {
  id: string
  title: string
  instructor: string
  thumbnail: string
  pillar: CoursePillar
  progress: number
  status: CourseStatus
  totalLessons: number
  completedLessons: number
  duration: string
  lastAccessed: string
  description?: string
  modules?: CourseModule[]
}

export interface Credential {
  name: string
  issuer: string
  dateEarned: string
  status: "active" | "expired"
}

export interface Milestone {
  title: string
  date: string
  completed: boolean
}

export interface UserProfile {
  name: string
  title: string
  email: string
  company: string
  location: string
  avatarUrl: string
  bio: string
  credentials: Credential[]
  milestones: Milestone[]
}
