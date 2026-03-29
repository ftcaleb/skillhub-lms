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
        <div className="min-h-dvh flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg-base)' }}>
            {/* Background glow — matching dashboard ambience */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
                <div
                    className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, var(--glow-primary), transparent)' }}
                />
                <div
                    className="absolute bottom-0 left-0 h-80 w-80 rounded-full opacity-10 blur-3xl"
                    style={{ background: 'radial-gradient(circle, var(--glow-purple), transparent)' }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-[440px]"
            >
                <div
                    className="rounded-2xl p-8 backdrop-blur-xl transition-all duration-300"
                    style={{
                        background: 'rgba(10, 22, 40, 0.75)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-card), var(--shadow-glow-sm)',
                    }}
                >
                    {/* Logo Section */}
                    <div className="mb-8 flex flex-col items-center">
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
                                Create Account
                            </h1>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Join the <span className="font-semibold" style={{ color: 'var(--glow-primary)' }}>SkillHub</span> community
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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

                        {/* First + Last Name row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="firstname" className="text-xs font-medium px-1" style={{ color: 'var(--text-muted)' }}>
                                    First Name
                                </Label>
                                <Input
                                    id="firstname"
                                    type="text"
                                    autoComplete="given-name"
                                    value={form.firstname}
                                    onChange={update('firstname')}
                                    placeholder="Jane"
                                    className="h-11 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] focus:border-[var(--glow-primary)] focus:ring-[var(--glow-primary)] text-foreground rounded-xl transition-all"
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lastname" className="text-xs font-medium px-1" style={{ color: 'var(--text-muted)' }}>
                                    Last Name
                                </Label>
                                <Input
                                    id="lastname"
                                    type="text"
                                    autoComplete="family-name"
                                    value={form.lastname}
                                    onChange={update('lastname')}
                                    placeholder="Doe"
                                    className="h-11 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] focus:border-[var(--glow-primary)] focus:ring-[var(--glow-primary)] text-foreground rounded-xl transition-all"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="signup-username" className="text-xs font-medium px-1" style={{ color: 'var(--text-muted)' }}>
                                Username
                            </Label>
                            <Input
                                id="signup-username"
                                type="text"
                                autoComplete="username"
                                value={form.username}
                                onChange={update('username')}
                                placeholder="jane.doe"
                                className="h-11 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] focus:border-[var(--glow-primary)] focus:ring-[var(--glow-primary)] text-foreground rounded-xl transition-all"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-xs font-medium px-1" style={{ color: 'var(--text-muted)' }}>
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={form.email}
                                onChange={update('email')}
                                placeholder="jane@company.com"
                                className="h-11 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] focus:border-[var(--glow-primary)] focus:ring-[var(--glow-primary)] text-foreground rounded-xl transition-all"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="signup-password" className="text-xs font-medium px-1" style={{ color: 'var(--text-muted)' }}>
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
                            <PasswordStrength password={form.password} />
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
                                    Creating account…
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="font-semibold transition-colors"
                            style={{ color: 'var(--glow-primary)' }}
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
