'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dashboard } from '@/components/dashboard'
import { CertificationsView } from '@/components/certifications-view'
import { ProfileView } from '@/components/profile-view'
import { CourseDetailView } from '@/components/course-detail-view'
import { Bell, Search, Menu, X, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { MoodleCourse } from '@/lib/moodle/types'

type ActiveView = 'dashboard' | 'certifications' | 'profile' | 'course-detail'

const navLinks = [
    { id: 'dashboard' as const, label: 'My Courses' },
    { id: 'certifications' as const, label: 'Certifications' },
    { id: 'profile' as const, label: 'Profile' },
]

export default function DashboardPage() {
    const router = useRouter()
    const [activeView, setActiveView] = useState<ActiveView>('dashboard')
    const [selectedCourse, setSelectedCourse] = useState<MoodleCourse | null>(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    const handleOpenCourse = (course: MoodleCourse) => {
        setSelectedCourse(course)
        setActiveView('course-detail')
    }

    const handleBackToDashboard = () => {
        setActiveView('dashboard')
        setSelectedCourse(null)
    }

    const handleNavigate = (view: 'dashboard' | 'certifications' | 'profile') => {
        setActiveView(view)
        setSelectedCourse(null)
        setMobileMenuOpen(false)
    }

    async function handleLogout() {
        setLoggingOut(true)
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
        } finally {
            router.push('/login')
        }
    }

    const currentNavId = activeView === 'course-detail' ? 'dashboard' : activeView

    return (
        <div className="flex flex-col min-h-dvh" style={{ background: 'var(--bg-base)' }}>
            {/* ── Premium Floating Navbar ─────────────────────────────────── */}
            <header
                className="sticky top-0 z-50 w-full"
                style={{
                    background: 'rgba(6, 13, 24, 0.85)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    borderBottom: '1px solid var(--border-subtle)',
                    boxShadow: '0 1px 0 var(--border-subtle), var(--shadow-glow-sm)',
                }}
            >
                <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto w-full">
                    {/* LEFT: Logo + Wordmark */}
                    <div className="flex items-center gap-3">
                        <img
                            src="/images/Logo.png"
                            alt="SkillHub logo"
                            className="h-10 w-10 object-contain"
                        />
                        <span
                            className="hidden sm:block text-lg font-bold tracking-tight"
                            style={{
                                fontFamily: "'Sora', sans-serif",
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                            }}
                        >
                            SkillHub
                        </span>
                    </div>

                    {/* CENTER: Navigation Links (desktop) */}
                    <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
                        {navLinks.map((link) => {
                            const isActive = currentNavId === link.id
                            return (
                                <button
                                    key={link.id}
                                    onClick={() => handleNavigate(link.id)}
                                    className="relative px-4 py-2 rounded-lg transition-colors duration-200"
                                    style={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        letterSpacing: '0.01em',
                                        color: isActive ? 'var(--glow-primary)' : 'var(--text-secondary)',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'
                                    }}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {link.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-active-indicator"
                                            className="absolute bottom-0 left-2 right-2 h-[2px]"
                                            style={{
                                                background: 'var(--glow-primary)',
                                                boxShadow: '0 0 8px rgba(14, 165, 233, 0.5)',
                                            }}
                                            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    {/* RIGHT: Search, Bell, Avatar */}
                    <div className="flex items-center gap-2">
                        <button
                            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-overlay)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                            aria-label="Search"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                        <button
                            className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-overlay)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                            aria-label="Notifications"
                        >
                            <Bell className="h-4 w-4" />
                            <span
                                className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
                                style={{ background: 'var(--glow-accent)' }}
                            />
                        </button>

                        {/* Avatar */}
                        <button
                            className="ml-2 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-200"
                            style={{
                                border: '2px solid var(--border-glow)',
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--glow-primary)'
                                e.currentTarget.style.boxShadow = 'var(--shadow-glow-sm)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-glow)'
                                e.currentTarget.style.boxShadow = 'none'
                            }}
                            onClick={() => handleNavigate('profile')}
                            aria-label="User profile"
                        >
                            SH
                        </button>

                        {/* Mobile hamburger */}
                        <button
                            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg ml-1"
                            style={{ color: 'var(--text-secondary)' }}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile slide-down drawer */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden md:hidden"
                            style={{
                                borderTop: '1px solid var(--border-subtle)',
                                background: 'var(--bg-surface)',
                            }}
                        >
                            <nav className="flex flex-col p-4 gap-1">
                                {navLinks.map((link) => {
                                    const isActive = currentNavId === link.id
                                    return (
                                        <button
                                            key={link.id}
                                            onClick={() => handleNavigate(link.id)}
                                            className="flex items-center px-4 py-3 rounded-lg text-left transition-colors"
                                            style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: '0.9rem',
                                                fontWeight: 500,
                                                color: isActive ? 'var(--glow-primary)' : 'var(--text-secondary)',
                                                background: isActive ? 'rgba(14, 165, 233, 0.08)' : 'transparent',
                                            }}
                                        >
                                            {link.label}
                                        </button>
                                    )
                                })}
                                <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />
                                <button
                                    onClick={handleLogout}
                                    disabled={loggingOut}
                                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-colors"
                                    style={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    <LogOut className="h-4 w-4" />
                                    {loggingOut ? 'Signing out…' : 'Sign Out'}
                                </button>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* ── Main content area — full width ──────────────────────────── */}
            <main className="flex-1 w-full">
                <div className="p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView === 'course-detail' ? `course-${selectedCourse?.id}` : activeView}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                        >
                            {activeView === 'dashboard' && (
                                <Dashboard onOpenCourse={handleOpenCourse} />
                            )}
                            {activeView === 'certifications' && <CertificationsView />}
                            {activeView === 'profile' && <ProfileView />}
                            {activeView === 'course-detail' && selectedCourse && (
                                <CourseDetailView course={selectedCourse} onBack={handleBackToDashboard} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
