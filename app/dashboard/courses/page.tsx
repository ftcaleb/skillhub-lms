'use client'

import { Dashboard } from '@/components/dashboard'
import { useRouter } from 'next/navigation'

export default function CoursesPage() {
    const router = useRouter()
    return <Dashboard onOpenCourse={(course) => router.push(`/dashboard/courses/${course.id}`)} />
}
