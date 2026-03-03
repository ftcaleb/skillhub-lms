"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AppSidebar } from "@/components/app-sidebar"
import { Dashboard } from "@/components/dashboard"
import { CertificationsView } from "@/components/certifications-view"
import { ProfileView } from "@/components/profile-view"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

type ActiveView = "dashboard" | "certifications" | "profile"

const viewTitles: Record<ActiveView, string> = {
  dashboard: "Dashboard",
  certifications: "Certifications",
  profile: "Profile",
}

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex min-h-dvh bg-background">
      <AppSidebar activeView={activeView} onNavigate={setActiveView} />

      {/* Main content area */}
      <main className="flex-1 md:ml-[240px] transition-[margin] duration-200">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 sm:px-8 backdrop-blur-md">
          {/* Left spacer for mobile menu button */}
          <div className="w-10 md:hidden" />
          
          <div className="hidden md:block">
            <h2 className="text-sm font-medium text-foreground">
              {viewTitles[activeView]}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-secondary"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground hover:bg-secondary"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
            </Button>
            <div
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label="User avatar"
              onClick={() => setActiveView("profile")}
              onKeyDown={(e) => e.key === "Enter" && setActiveView("profile")}
            >
              AN
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {activeView === "dashboard" && <Dashboard />}
              {activeView === "certifications" && <CertificationsView />}
              {activeView === "profile" && <ProfileView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
