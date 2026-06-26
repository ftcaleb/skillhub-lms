'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, Menu, X, LogOut } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useProfile } from '@/components/profile-context'
import dynamic from 'next/dynamic'

const SearchCommand = dynamic(
    () => import('@/components/search-command').then((mod) => mod.SearchCommand),
    { ssr: false }
)

const ParticleField = dynamic(
    () => import('@/components/three/ParticleField').then((mod) => mod.ParticleField),
    { ssr: false }
)


const navLinks = [
    { id: 'dashboard' as const, label: 'My Courses', href: '/dashboard/courses' },
    { id: 'certifications' as const, label: 'Certifications', href: '/dashboard/certifications' },
    { id: 'profile' as const, label: 'Profile', href: '/dashboard/profile' },
]

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const { profile } = useProfile()
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 16)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Automatically close mobile menu when path changes
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    async function handleLogout() {
        setLoggingOut(true)
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
        } finally {
            router.push('/login')
        }
    }

    const currentNavId = pathname.startsWith('/dashboard/courses')
        ? 'dashboard'
        : pathname.startsWith('/dashboard/certifications')
        ? 'certifications'
        : pathname.startsWith('/dashboard/profile')
        ? 'profile'
        : ''

    return (
        <div className="relative flex flex-col min-h-dvh overflow-hidden" style={{ background: 'var(--bg-base)' }}>
            <ParticleField className="pointer-events-none absolute inset-0 z-0 opacity-60" />
{/* ── Pill Navbar Outer Wrapper ─────────────────────────────── */}
<div
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: scrolled ? 10 : 16,
    paddingLeft: 16,
    paddingRight: 16,
    transition: 'padding-top 0.35s cubic-bezier(0.4,0,0.2,1)',
    pointerEvents: 'none',
  }}
>
  {/* ── Pill Container ────────────────────────────────────────── */}
  <div
    style={{
      width: '100%',
      maxWidth: scrolled ? 860 : 1200,
      transition: 'max-width 0.4s cubic-bezier(0.4,0,0.2,1)',
      pointerEvents: 'auto',
      position: 'relative',
    }}
  >
    {/* ── The Glass Pill ──────────────────────────────────────── */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        borderRadius: 9999,
        background: 'var(--glass-bg)',
        backdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
        WebkitBackdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
        border: '1px solid var(--glass-border-strong)',
        boxShadow: scrolled
          ? `var(--glass-shadow), inset 0 1px 0 var(--glass-highlight), var(--shadow-glow-sm)`
          : `var(--glass-shadow), inset 0 1px 0 var(--glass-highlight)`,
        padding: scrolled ? '6px 10px' : '8px 14px',
        transition: [
          'padding 0.35s cubic-bezier(0.4,0,0.2,1)',
          'box-shadow 0.35s ease',
        ].join(', '),
        overflow: 'visible',
      }}
    >

      {/* ── LEFT: Logo + Wordmark ──────────────────────────────── */}
      <div
        className="flex items-center gap-2.5 shrink-0"
        style={{
          minWidth: scrolled ? 40 : 130,
          transition: 'min-width 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <img
          src="/images/Logo.png"
          alt="SkillHub"
          style={{
            height: scrolled ? 32 : 38,
            width: 'auto',
            objectFit: 'contain',
            transition: 'height 0.35s ease',
            flexShrink: 0,
          }}
        />
        <span
          className="hidden sm:block font-bold tracking-tight whitespace-nowrap"
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: scrolled ? '0.9rem' : '1rem',
            color: 'var(--text-primary)',
            opacity: scrolled ? 0 : 1,
            transform: scrolled ? 'scale(0.9)' : 'scale(1)',
            transition: 'opacity 0.25s ease, transform 0.25s ease, font-size 0.35s ease',
            pointerEvents: scrolled ? 'none' : 'auto',
            maxWidth: scrolled ? 0 : 80,
            overflow: 'hidden',
          }}
        >
          SkillHub
        </span>
      </div>

      {/* ── CENTER: Nav Links (desktop only) ──────────────────── */}
      <nav
        className="hidden md:flex items-center gap-1"
        role="navigation"
        aria-label="Main navigation"
        style={{ flex: '1 1 auto', justifyContent: 'center', display: 'flex' }}
      >
        {navLinks.map((link) => {
          const isActive = currentNavId === link.id
          return (
            <Link
              key={link.id}
              href={link.href}
              className="relative px-4 py-2 rounded-full transition-all duration-200"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 600,
                letterSpacing: '0.01em',
                color: isActive ? 'var(--glow-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(14, 165, 233, 0.10)' : 'transparent',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-primary)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Lamp indicator — slides between active items via layoutId */}
              {isActive && (
                <motion.div
                  layoutId="pill-active-lamp"
                  style={{
                    position: 'absolute',
                    top: -2,
                    left: 0,
                    right: 0,
                    height: 3,
                    zIndex: 10,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 36,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 28,
                      height: 3,
                      borderRadius: '0 0 3px 3px',
                      background: 'var(--glow-primary)',
                    }}
                  >
                    {/* Glow layers — matches 21st.dev source pattern */}
                    <div style={{
                      position: 'absolute',
                      width: 44,
                      height: 20,
                      borderRadius: '50%',
                      background: 'rgba(14, 165, 233, 0.30)',
                      filter: 'blur(10px)',
                      top: -8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }} />
                    <div style={{
                      position: 'absolute',
                      width: 28,
                      height: 16,
                      borderRadius: '50%',
                      background: 'rgba(14, 165, 233, 0.22)',
                      filter: 'blur(7px)',
                      top: -4,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }} />
                    <div style={{
                      position: 'absolute',
                      width: 14,
                      height: 12,
                      borderRadius: '50%',
                      background: 'rgba(14, 165, 233, 0.18)',
                      filter: 'blur(4px)',
                      top: -2,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }} />
                  </div>
                </motion.div>
              )}
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* ── RIGHT: Actions ────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Search */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.background = 'transparent'
          }}
          aria-label="Search (Ctrl+K)"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Bell */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.background = 'transparent'
          }}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span
            className="absolute top-1 right-1 h-2 w-2 rounded-full"
            style={{ background: 'var(--glow-accent)' }}
          />
        </button>

        {/* Thin divider */}
        <div
          className="hidden md:block h-5 w-px mx-1"
          style={{ background: 'var(--glass-border-strong)' }}
        />

        {/* Avatar */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold overflow-hidden transition-all duration-200"
          style={{
            border: '2px solid var(--border-glow)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            fontFamily: "'JetBrains Mono', monospace",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-active)'
            e.currentTarget.style.boxShadow = 'var(--shadow-glow-sm)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-glow)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          onClick={() => router.push('/dashboard/profile')}
          aria-label="User profile"
        >
          {profile?.userpictureurl ? (
            <img
              src={`/api/courses/file?url=${encodeURIComponent(profile.userpictureurl)}`}
              alt="Profile"
              className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            profile
              ? (`${profile.firstname?.[0] ?? ''}${profile.lastname?.[0] ?? ''}`.toUpperCase() || profile.username.substring(0, 2).toUpperCase())
              : 'SH'
          )}
        </button>

        {/* Mobile hamburger — inside pill, md:hidden */}
        <button
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-full ml-0.5 transition-all duration-200"
          style={{
            background: mobileMenuOpen ? 'var(--glow-primary)' : 'rgba(14, 165, 233, 0.10)',
            color: mobileMenuOpen ? 'white' : 'var(--glow-primary)',
            border: '1px solid',
            borderColor: mobileMenuOpen ? 'var(--glow-primary)' : 'var(--border-glow)',
          }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

      </div>
    </div>{/* end pill */}

    {/* ── Mobile Dropdown Drawer — drops below pill ─────────── */}
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            borderRadius: 20,
            background: 'var(--glass-bg-elevated)',
            backdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
            WebkitBackdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
            border: '1px solid var(--glass-border-strong)',
            boxShadow: `var(--glass-shadow), inset 0 1px 0 var(--glass-highlight)`,
            overflow: 'hidden',
            zIndex: 60,
            pointerEvents: 'auto',
          }}
        >
          <nav className="flex flex-col p-3 gap-1">
            {navLinks.map((link) => {
              const isActive = currentNavId === link.id
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 rounded-xl transition-all duration-150"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: isActive ? 'var(--glow-primary)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(14, 165, 233, 0.10)' : 'transparent',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--border-glow)' : 'transparent',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: 'var(--glass-border)',
                margin: '6px 0',
              }}
            />

            {/* Sign out */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-150 text-left w-full"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444'
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>

  </div>{/* end pill container */}
</div>{/* end outer wrapper */}

            {/* ── Main content area — full width ──────────────────────────── */}
            <main className="flex-1 w-full">
                {/* Pill spacer — pushes content below the fixed floating pill */}
                <div style={{ height: 80 }} aria-hidden="true" />
                <div className="p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
                    {children}
                </div>
            </main>
            <SearchCommand />
        </div>
    )
}

