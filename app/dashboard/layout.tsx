import { ProfileProvider } from '@/components/profile-context'
import DashboardShell from '@/components/dashboard-shell'
import { SearchCommand } from '@/components/search-command'
import { Toaster } from 'sonner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <DashboardShell>{children}</DashboardShell>
      <SearchCommand />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          },
        }}
      />
    </ProfileProvider>
  )
}

