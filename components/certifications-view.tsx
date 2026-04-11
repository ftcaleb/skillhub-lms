"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Award, Shield, CalendarDays, ExternalLink, Loader2, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface Certificate {
    id: number
    name: string
    courseName: string
    dateEarned: string
    downloadUrl: string
}

export function CertificationsView() {
    const [certificates, setCertificates] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCertificates = () => {
        setLoading(true)
        setError(null)
        fetch('/api/user/certificates')
            .then(res => res.json())
            .then(data => {
                setCertificates(data.certificates ?? [])
                setLoading(false)
            })
            .catch(() => {
                setError('Failed to load certificates.')
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchCertificates()
    }, [])

    return (
        <div className="flex flex-col gap-8 max-w-2xl mx-auto">
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
                    {loading ? 'Loading...' : `${certificates.length} earned certificate${certificates.length !== 1 ? 's' : ''}`}
                </p>
            </motion.div>

            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--glow-primary)' }} />
                </div>
            )}

            {error && (
                <p className="text-sm text-red-400">{error}</p>
            )}

            {!loading && !error && certificates.length === 0 && (
                <div
                    className="rounded-xl p-8 text-center"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                    <Award className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        No certificates earned yet. Complete a course to earn your first certificate.
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-4">
                {certificates.map((cert, index) => (
                    <motion.div
                        key={cert.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.12 + index * 0.08 }}
                        className="group rounded-xl p-5 transition-all"
                        style={{ 
                          background: 'var(--bg-surface)', 
                          border: '1px solid var(--border-subtle)',
                          borderLeft: '3px solid #f59e0b',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-glow)'
                            e.currentTarget.style.borderLeftColor = '#f59e0b'
                            e.currentTarget.style.boxShadow = 'var(--shadow-glow-sm)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-subtle)'
                            e.currentTarget.style.borderLeftColor = '#f59e0b'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                                style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.15)' }}
                            >
                                <Award className="h-5 w-5" style={{ color: 'var(--glow-primary)' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {cert.courseName}
                                        </h3>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Shield className="h-3 w-3" />
                                                SkillHub International
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <CalendarDays className="h-3 w-3" />
                                                {cert.dateEarned}
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
                                        earned
                                    </span>
                                </div>
                                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                    <a
                                        href={cert.downloadUrl}
                                        download
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        style={{ 
                                          background: 'linear-gradient(135deg, var(--glow-primary), var(--glow-purple))',
                                          color: 'white',
                                          textDecoration: 'none',
                                        }}
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Download Certificate
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
