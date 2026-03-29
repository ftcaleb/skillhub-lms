"use client"

import { motion } from "framer-motion"
import { Award, Shield, CalendarDays, ExternalLink } from "lucide-react"
import { userProfile } from "@/lib/data"
import { cn } from "@/lib/utils"

export function CertificationsView() {
  const { credentials } = userProfile

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "'Sora', sans-serif", color: 'var(--text-primary)' }}
        >
          Certifications
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {credentials.length} active professional credentials
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {[
          {
            label: "Active Certifications",
            value: credentials.filter((c) => c.status === "active").length,
            accent: true,
          },
          {
            label: "Issuing Bodies",
            value: new Set(credentials.map((c) => c.issuer)).size,
            accent: false,
          },
          {
            label: "Courses Completed",
            value: 5,
            accent: false,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'rounded-xl p-5 text-center',
            )}
            style={{
              background: 'var(--bg-surface)',
              border: stat.accent ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
            }}
          >
            <p
              className={cn('text-2xl font-bold')}
              style={{
                color: stat.accent ? 'var(--glow-primary)' : 'var(--text-primary)',
                fontFamily: "'Sora', sans-serif",
              }}
            >
              {stat.value}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Credentials list */}
      <div className="flex flex-col gap-4">
        {credentials.map((cred, index) => (
          <motion.div
            key={cred.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 + index * 0.08 }}
            className="group rounded-xl p-5 transition-all"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-glow)'
              e.currentTarget.style.boxShadow = 'var(--shadow-glow-sm)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: 'rgba(14, 165, 233, 0.1)',
                  border: '1px solid rgba(14, 165, 233, 0.15)',
                }}
              >
                <Award className="h-5 w-5" style={{ color: 'var(--glow-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {cred.name}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {cred.issuer}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {cred.dateEarned}
                      </span>
                    </div>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      color: 'var(--glow-green)',
                    }}
                  >
                    {cred.status}
                  </span>
                </div>

                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    className="flex items-center gap-1 text-xs font-medium transition-colors"
                    style={{ color: 'var(--glow-primary)' }}
                  >
                    View Certificate
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
