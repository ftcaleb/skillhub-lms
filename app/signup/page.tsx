'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FormState {
    firstname: string
    lastname: string
    username: string
    email: string
    password: string
}

const INITIAL: FormState = {
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
}

function PasswordStrength({ password }: { password: string }) {
    const checks = [
        { label: '8+ characters', ok: password.length >= 8 },
        { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
        { label: 'Number', ok: /[0-9]/.test(password) },
        { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
    ]
    const passedCount = checks.filter((c) => c.ok).length

    if (!password) return null

    return (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
            {checks.map((c) => (
                <div key={c.label} className="flex items-center gap-1.5 text-[10px]">
                    <CheckCircle2
                        className={`h-3 w-3 transition-colors ${c.ok ? 'text-emerald-400' : 'text-border'}`}
                    />
                    <span className={c.ok ? 'text-muted-foreground' : 'text-muted-foreground/50'}>
                        {c.label}
                    </span>
                </div>
            ))}
            <div className="col-span-2 mt-1">
                <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                            width: `${(passedCount / checks.length) * 100}%`,
                            background:
                                passedCount <= 1
                                    ? 'oklch(0.6 0.25 30)'
                                    : passedCount <= 2
                                        ? 'oklch(0.75 0.2 65)'
                                        : passedCount <= 3
                                            ? 'oklch(0.75 0.18 140)'
                                            : 'oklch(0.7 0.2 160)',
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

export default function SignupPage() {
    const router = useRouter()
    const [form, setForm] = useState<FormState>(INITIAL)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    function update(field: keyof FormState) {
        return (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        const { firstname, lastname, username, email, password } = form
        if (!firstname || !lastname || !username || !email || !password) {
            setError('All fields are required.')
            return
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.')
            return
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstname: firstname.trim(),
                    lastname: lastname.trim(),
                    username: username.trim().toLowerCase(),
                    email: email.trim().toLowerCase(),
                    password,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error ?? 'Signup failed. Please try again.')
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
        <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-8">
            {/* Background glow */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
                <div
                    className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, oklch(0.75 0.16 65), transparent)' }}
                />
                <div
                    className="absolute bottom-0 left-0 h-60 w-60 rounded-full opacity-10 blur-3xl"
                    style={{ background: 'radial-gradient(circle, oklch(0.6 0.2 260), transparent)' }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-sm"
            >
                <div
                    className="rounded-2xl border border-border/50 p-8 shadow-2xl"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.90) 100%)',
                        backdropFilter: 'blur(24px)',
                    }}
                >
                    {/* Logo */}
                    <div className="mb-7 flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
                            <Package className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Create account</h1>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Join Nexus Supply Chain LMS
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
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

                        {/* First + Last Name row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="firstname" className="text-xs text-muted-foreground">
                                    First Name
                                </Label>
                                <Input
                                    id="firstname"
                                    type="text"
                                    autoComplete="given-name"
                                    value={form.firstname}
                                    onChange={update('firstname')}
                                    placeholder="Jane"
                                    className="h-10 bg-input border-border text-foreground placeholder:text-muted-foreground/50"
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="lastname" className="text-xs text-muted-foreground">
                                    Last Name
                                </Label>
                                <Input
                                    id="lastname"
                                    type="text"
                                    autoComplete="family-name"
                                    value={form.lastname}
                                    onChange={update('lastname')}
                                    placeholder="Doe"
                                    className="h-10 bg-input border-border text-foreground placeholder:text-muted-foreground/50"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="signup-username" className="text-xs text-muted-foreground">
                                Username
                            </Label>
                            <Input
                                id="signup-username"
                                type="text"
                                autoComplete="username"
                                value={form.username}
                                onChange={update('username')}
                                placeholder="jane.doe"
                                className="h-10 bg-input border-border text-foreground placeholder:text-muted-foreground/50"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="email" className="text-xs text-muted-foreground">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={form.email}
                                onChange={update('email')}
                                placeholder="jane@company.com"
                                className="h-10 bg-input border-border text-foreground placeholder:text-muted-foreground/50"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="signup-password" className="text-xs text-muted-foreground">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={form.password}
                                    onChange={update('password')}
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
                            <PasswordStrength password={form.password} />
                        </div>

                        <Button
                            type="submit"
                            className="mt-1 h-10 w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating account…
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
