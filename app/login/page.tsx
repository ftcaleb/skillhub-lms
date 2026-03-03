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
        <div className="min-h-dvh flex items-center justify-center bg-background px-4">
            {/* Background glow */}
            <div
                className="pointer-events-none fixed inset-0 overflow-hidden"
                aria-hidden="true"
            >
                <div
                    className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, oklch(0.75 0.16 65), transparent)' }}
                />
                <div
                    className="absolute bottom-0 right-0 h-60 w-60 rounded-full opacity-10 blur-3xl"
                    style={{ background: 'radial-gradient(circle, oklch(0.6 0.2 260), transparent)' }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-sm"
            >
                {/* Card */}
                <div
                    className="rounded-2xl border border-border/50 p-8 shadow-2xl"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.90) 100%)',
                        backdropFilter: 'blur(24px)',
                    }}
                >
                    {/* Logo */}
                    <div className="mb-8 flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
                            <Package className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Welcome back</h1>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Sign in to Nexus Supply Chain LMS
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                        {/* Error banner */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
                                role="alert"
                            >
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <div className="grid gap-1.5">
                            <Label htmlFor="username" className="text-xs text-muted-foreground">
                                Username
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="your.username"
                                className="h-10 bg-input border-border text-foreground placeholder:text-muted-foreground/50"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password" className="text-xs text-muted-foreground">
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
                                    className="h-10 bg-input border-border text-foreground placeholder:text-muted-foreground/50 pr-10"
                                    disabled={loading}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="mt-2 h-10 w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in…
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/signup"
                            className="font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
