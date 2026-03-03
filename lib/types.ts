export type CoursePillar =
  | "Logistics"
  | "Procurement"
  | "Lean 6 Sigma"
  | "Warehousing"
  | "Last-Mile"
  | "Analytics"

export type CourseStatus = "in-progress" | "completed"

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
