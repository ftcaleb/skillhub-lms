"use client"

import { motion } from "framer-motion"
import { Award, Shield, CalendarDays, ExternalLink } from "lucide-react"
import { userProfile } from "@/lib/data"
import { cn } from "@/lib/utils"

export function CertificationsView() {
  const { credentials } = userProfile

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Certifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
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
              "rounded-xl border border-border bg-card p-5 text-center",
              stat.accent && "border-primary/20"
            )}
          >
            <p
              className={cn(
                "text-2xl font-bold",
                stat.accent ? "text-primary" : "text-card-foreground"
              )}
            >
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
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
            className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-[0_0_20px_-5px] hover:shadow-primary/8"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/15">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-card-foreground">
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
                  <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                    {cred.status}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <button className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80">
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
