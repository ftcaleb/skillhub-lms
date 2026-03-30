import { ProfileProvider } from '@/components/profile-context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProfileProvider>{children}</ProfileProvider>
}
