'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (!username.trim() || !password) {
            setError('Please enter your username and password.')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error ?? 'Login failed. Please check your credentials.')
                return
            }
            router.push('/dashboard')
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-dvh flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
            {/* Background glow — matching dashboard ambience */}
            <div
                className="pointer-events-none fixed inset-0 overflow-hidden"
                aria-hidden="true"
            >
                <div
                    className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, var(--glow-primary), transparent)' }}
                />
                <div
                    className="absolute bottom-0 right-0 h-80 w-80 rounded-full opacity-10 blur-3xl"
                    style={{ background: 'radial-gradient(circle, var(--glow-purple), transparent)' }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-[400px]"
            >
                {/* Premium Card with glassmorphism */}
                <div
                    className="rounded-2xl p-8 backdrop-blur-xl transition-all duration-300"
                    style={{
                        background: 'rgba(10, 22, 40, 0.75)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-card), var(--shadow-glow-sm)',
                    }}
                >
                    {/* Logo Section */}
                    <div className="mb-10 flex flex-col items-center">
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            src="/images/Logo.png"
                            alt="SkillHub International logo"
                            className="h-16 w-16 object-contain mb-4 drop-shadow-[0_0_10px_rgba(14,165,233,0.3)]"
                        />
                        <div className="text-center">
                            <h1 
                                className="text-2xl font-bold tracking-tight mb-1"
                                style={{ fontFamily: "'Sora', sans-serif", color: 'var(--text-primary)' }}
                            >
                                Welcome Back
                            </h1>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Sign in to <span className="font-semibold" style={{ color: 'var(--glow-primary)' }}>SkillHub</span>
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                        {/* Error banner */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive"
                                role="alert"
                            >
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <div className="grid gap-2">
                            <Label 
                                htmlFor="username" 
                                className="text-xs font-medium px-1"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Username
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="your.username"
                                className="h-11 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] focus:border-[var(--glow-primary)] focus:ring-[var(--glow-primary)] text-foreground rounded-xl transition-all"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label 
                                htmlFor="password" 
                                className="text-xs font-medium px-1"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-11 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] focus:border-[var(--glow-primary)] focus:ring-[var(--glow-primary)] text-foreground rounded-xl transition-all pr-12"
                                    disabled={loading}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 h-11 w-full font-bold rounded-xl transition-all duration-300"
                            style={{ 
                                background: 'linear-gradient(135deg, var(--glow-primary), #0284c7)',
                                color: 'white',
                                boxShadow: 'var(--shadow-glow-sm)'
                            }}
                            disabled={loading}
                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-glow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-glow-sm)'; e.currentTarget.style.transform = 'none' }}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Authenticating…
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/signup"
                            className="font-semibold transition-colors"
                            style={{ color: 'var(--glow-primary)' }}
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
