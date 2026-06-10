import { CourseDataProvider } from '@/components/course/course-data-context'

export default function CourseLayout({ children }: { children: React.ReactNode }) {
    return (
        <CourseDataProvider>
            {children}
        </CourseDataProvider>
    )
}
