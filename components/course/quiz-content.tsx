'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronRight,
    ChevronLeft,
    RotateCcw,
    Trophy,
    AlertCircle,
    HelpCircle,
    Loader2,
    Flag,
    Clock,
    X,
    CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import DOMPurify from 'isomorphic-dompurify'
import { parseQuizQuestions, type ParsedQuestion } from '@/lib/quiz-question-parser'
import type { MoodleAttemptQuestion } from '@/lib/moodle/types'

interface QuizContentProps {
    quizId: number
    quizName: string
    courseId: number
    timelimit?: number    // seconds, 0 = unlimited
    maxAttempts?: number  // 0 = unlimited
    gradePass?: number
}

type QuizPhase =
    | { phase: 'idle' }
    | { phase: 'loading' }
    | {
        phase: 'in_progress'
        attemptId: number
        currentPage: number
        totalPages: number
        questions: ParsedQuestion[]
        allQuestions: Map<number, ParsedQuestion> // slot → question across all pages
        attemptState: string
        timeStart: number
    }
    | { phase: 'submitting' }
    | { phase: 'finished'; finalState: string; sumGrades: number | null; maxGrade: number }
    | { phase: 'error'; message: string }

// ─── Timer Component ──────────────────────────────────────────────────────────

function QuizTimer({ timelimit, timeStart }: { timelimit: number; timeStart: number }) {
    const [remaining, setRemaining] = useState(timelimit)

    useEffect(() => {
        if (timelimit <= 0) return
        const elapsed = Math.floor(Date.now() / 1000) - timeStart
        setRemaining(Math.max(0, timelimit - elapsed))

        const interval = setInterval(() => {
            const e = Math.floor(Date.now() / 1000) - timeStart
            const r = Math.max(0, timelimit - e)
            setRemaining(r)
            if (r <= 0) clearInterval(interval)
        }, 1000)

        return () => clearInterval(interval)
    }, [timelimit, timeStart])

    if (timelimit <= 0) {
        return (
            <div className="text-center">
                <p className="quiz-meta-label mb-1">TIME REMAINING</p>
                <p className="text-2xl font-bold font-mono" style={{ color: 'var(--quiz-text-primary)' }}>
                    Unlimited
                </p>
            </div>
        )
    }

    const hours = Math.floor(remaining / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)
    const seconds = remaining % 60
    const isLow = remaining < timelimit * 0.2
    const timeStr = hours > 0
        ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        : `${minutes}:${String(seconds).padStart(2, '0')}`

    return (
        <div className="text-center" aria-live="polite">
            <p className="quiz-meta-label mb-1">TIME REMAINING</p>
            <p className={cn(
                'text-2xl font-bold font-mono tabular-nums',
                isLow ? 'timer-warning' : '',
            )} style={{ color: isLow ? undefined : 'var(--quiz-text-primary)' }}>
                {timeStr}
            </p>
        </div>
    )
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────

function SubmitModal({
    open,
    onClose,
    onConfirm,
    answeredCount,
    totalCount,
}: {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    answeredCount: number
    totalCount: number
}) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md mx-4 rounded-2xl border border-border p-6"
                style={{ background: 'var(--quiz-bg-elevated)' }}
            >
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--quiz-text-primary)' }}>
                        Submit Quiz?
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" style={{ color: 'var(--quiz-text-secondary)' }} />
                    </button>
                </div>

                <p className="text-sm mb-2" style={{ color: 'var(--quiz-text-secondary)' }}>
                    You have answered <strong style={{ color: 'var(--quiz-text-primary)' }}>{answeredCount}</strong> of{' '}
                    <strong style={{ color: 'var(--quiz-text-primary)' }}>{totalCount}</strong> questions.
                </p>
                {answeredCount < totalCount && (
                    <p className="text-sm mb-4" style={{ color: 'var(--quiz-accent-warning)' }}>
                        ⚠️ {totalCount - answeredCount} question(s) are unanswered.
                    </p>
                )}

                <div className="flex gap-3 mt-6">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-1"
                        style={{ background: 'var(--quiz-accent-primary)', color: 'white' }}
                        onClick={onConfirm}
                    >
                        Submit Quiz
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QuizContent({
    quizId,
    quizName,
    courseId,
    timelimit = 0,
    maxAttempts = 0,
    gradePass = 0,
}: QuizContentProps) {
    const [state, setState] = useState<QuizPhase>({ phase: 'idle' })
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, string>>({}) // slot → value
    const [sequenceChecks, setSequenceChecks] = useState<Record<number, number>>({}) // slot → value
    const [flagged, setFlagged] = useState<Set<number>>(new Set())     // slot numbers
    const [showSubmitModal, setShowSubmitModal] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    // Start quiz attempt
    const handleStartQuiz = async () => {
        setState({ phase: 'loading' })
        try {
            let startRes = await fetch(`/api/courses/${courseId}/quiz/${quizId}/attempt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ forcenew: false }),
            })

            let error = null
            if (!startRes.ok) {
                error = await startRes.json()
                if (error.error?.includes('attemptstillinprogress')) {
                    startRes = await fetch(`/api/courses/${courseId}/quiz/${quizId}/attempt`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ forcenew: true }),
                    })
                    if (!startRes.ok) error = await startRes.json()
                    else error = null
                }
            }
            if (error) throw new Error(error.error ?? 'Failed to start quiz')

            const startData = await startRes.json()
            const attemptId = startData.attempt.id
            const timeStart = startData.attempt.timestart

            // Fetch all pages of questions
            const allQuestions = new Map<number, ParsedQuestion>()
            let pageNum = 0
            let allRawQuestions: MoodleAttemptQuestion[] = []

            while (pageNum < 50) { // Safety limit
                try {
                    const pageRes = await fetch(
                        `/api/courses/${courseId}/quiz/${quizId}/attempt/${attemptId}/page/${pageNum}`
                    )
                    if (!pageRes.ok) break

                    const pageData = await pageRes.json()
                    const rawQuestions: MoodleAttemptQuestion[] = pageData.questions ?? []
                    if (rawQuestions.length === 0) break

                    allRawQuestions = [...allRawQuestions, ...rawQuestions]
                    pageNum++
                } catch (e) {
                    console.error('Failed to fetch quiz page', pageNum, e)
                    break 
                }
            }

            // Parse all questions
            const parsed = parseQuizQuestions(allRawQuestions)
            const initialSequenceChecks: Record<number, number> = {}
            
            for (const q of parsed) {
                allQuestions.set(q.slot, q)
                initialSequenceChecks[q.slot] = parseInt(q.sequenceCheckValue) || 1
                
                // Pre-populate answers from any previously saved responses
                if (q.selectedValue !== null) {
                    setAnswers((prev) => ({ ...prev, [q.slot]: q.selectedValue! }))
                }
            }
            setSequenceChecks(initialSequenceChecks)

            setState({
                phase: 'in_progress',
                attemptId,
                currentPage: 0,
                totalPages: pageNum || 1,
                questions: parsed,
                allQuestions,
                attemptState: startData.attempt.state,
                timeStart,
            })
        } catch (err) {
            setState({ phase: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
        }
    }

    // Save a single answer
    const handleSelectAnswer = async (question: ParsedQuestion, value: string) => {
        if (state.phase !== 'in_progress') return

        setAnswers((prev) => ({ ...prev, [question.slot]: value }))

        // Save to Moodle immediately
        try {
            const currentSeq = sequenceChecks[question.slot] || 1
            const data = [
                { name: question.inputName, value },
                { name: question.sequenceCheckName, value: String(currentSeq) },
            ]

            const res = await fetch(
                `/api/courses/${courseId}/quiz/${quizId}/attempt/${state.attemptId}/submit`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data, finishattempt: false, timeup: false }),
                }
            )

            if (res.ok) {
                // IMPORTANT: Moodle increments sequencecheck after a successful process_attempt
                setSequenceChecks(prev => ({
                    ...prev,
                    [question.slot]: currentSeq + 1
                }))
            }
        } catch {
            // Silent fail for auto-save
        }
    }

    // Clear choice
    const handleClearChoice = async (question: ParsedQuestion) => {
        if (state.phase !== 'in_progress') return
        setAnswers((prev) => {
            const next = { ...prev }
            delete next[question.slot]
            return next
        })

        // Save cleared answer
        try {
            const data = [
                { name: question.inputName, value: '-1' },
                { name: question.sequenceCheckName, value: question.sequenceCheckValue },
            ]
            await fetch(
                `/api/courses/${courseId}/quiz/${quizId}/attempt/${state.attemptId}/submit`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data, finishattempt: false, timeup: false }),
                }
            )
        } catch { /* silent */ }
    }

    // Submit quiz
    const handleSubmitQuiz = async () => {
        if (state.phase !== 'in_progress') return
        setShowSubmitModal(false)
        setState({ phase: 'submitting' })

        try {
            // Build all answer data
            const data: Array<{ name: string; value: string }> = []
            for (const q of state.questions) {
                const val = answers[q.slot]
                if (val !== undefined) {
                    data.push({ name: q.inputName, value: val })
                }
                const currentSeq = sequenceChecks[q.slot] || 1
                data.push({ name: q.sequenceCheckName, value: String(currentSeq) })
            }

            const submitRes = await fetch(
                `/api/courses/${courseId}/quiz/${quizId}/attempt/${state.attemptId}/submit`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data, finishattempt: true, timeup: false }),
                }
            )

            if (!submitRes.ok) {
                const err = await submitRes.json()
                throw new Error(err.error ?? 'Failed to submit quiz')
            }

            const totalMarks = state.questions.reduce((sum, q) => sum + q.maxMark, 0)
            const answeredSlots = Object.keys(answers).length

            setState({
                phase: 'finished',
                finalState: 'finished',
                sumGrades: answeredSlots, // Approximate — real score comes from review
                maxGrade: totalMarks,
            })
        } catch (err) {
            setState({ phase: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
        }
    }

    // Toggle flag
    const toggleFlag = (slot: number) => {
        setFlagged((prev) => {
            const next = new Set(prev)
            if (next.has(slot)) next.delete(slot)
            else next.add(slot)
            return next
        })
    }

    // ─── Render: Idle ──────────────────────────────────────────────────────

    if (state.phase === 'idle') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6 rounded-2xl border p-8 sm:p-12 text-center"
                style={{
                    borderColor: 'var(--quiz-border-subtle)',
                    background: 'var(--quiz-bg-card)',
                }}
            >
                <div className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ background: 'rgba(37, 99, 235, 0.1)' }}>
                    <HelpCircle className="h-8 w-8" style={{ color: 'var(--quiz-accent-primary)' }} />
                </div>
                <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--quiz-text-primary)' }}>
                        Ready to Start?
                    </h3>
                    <p className="text-sm max-w-md" style={{ color: 'var(--quiz-text-secondary)' }}>
                        <strong style={{ color: 'var(--quiz-text-primary)' }}>{quizName}</strong>
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-2 text-xs" style={{ color: 'var(--quiz-text-muted)' }}>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {timelimit > 0 ? `${Math.floor(timelimit / 60)} minutes` : 'No time limit'}
                        </span>
                        <span>•</span>
                        <span>{maxAttempts > 0 ? `${maxAttempts} attempt(s)` : 'Unlimited attempts'}</span>
                    </div>
                </div>
                <Button
                    className="text-white gap-2"
                    style={{ background: 'var(--quiz-accent-primary)' }}
                    onClick={handleStartQuiz}
                >
                    Start Quiz
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </motion.div>
        )
    }

    // ─── Render: Loading ───────────────────────────────────────────────────

    if (state.phase === 'loading') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-4 py-20"
            >
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--quiz-accent-primary)' }} />
                <p className="text-sm" style={{ color: 'var(--quiz-text-secondary)' }}>Loading quiz...</p>
            </motion.div>
        )
    }

    // ─── Render: Submitting ────────────────────────────────────────────────

    if (state.phase === 'submitting') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-4 py-20"
            >
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--quiz-accent-primary)' }} />
                <p className="text-sm" style={{ color: 'var(--quiz-text-secondary)' }}>Submitting quiz...</p>
            </motion.div>
        )
    }

    // ─── Render: Finished ──────────────────────────────────────────────────

    if (state.phase === 'finished') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6 rounded-2xl border p-8 sm:p-12 text-center"
                style={{
                    borderColor: 'rgba(16, 185, 129, 0.2)',
                    background: 'rgba(16, 185, 129, 0.05)',
                }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.6, delay: 0.1 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full"
                    style={{ background: 'rgba(16, 185, 129, 0.15)' }}
                >
                    <Trophy className="h-10 w-10" style={{ color: 'var(--quiz-accent-success)' }} />
                </motion.div>

                <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold" style={{ color: 'var(--quiz-text-primary)' }}>
                        ✅ Quiz Complete!
                    </h3>
                    <p className="text-sm max-w-md" style={{ color: 'var(--quiz-text-secondary)' }}>
                        Your attempt has been submitted successfully.
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--quiz-text-muted)' }}>
                        Final state: <strong style={{ color: 'var(--quiz-text-primary)' }}>{state.finalState}</strong>
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={() => {
                        setAnswers({})
                        setFlagged(new Set())
                        setCurrentQuestionIndex(0)
                        setState({ phase: 'idle' })
                    }}
                    className="gap-2"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Try Again
                </Button>
            </motion.div>
        )
    }

    // ─── Render: Error ─────────────────────────────────────────────────────

    if (state.phase === 'error') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-4 p-4 rounded-xl border"
                style={{
                    borderColor: 'rgba(239, 68, 68, 0.2)',
                    background: 'rgba(239, 68, 68, 0.05)',
                }}
            >
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--quiz-text-primary)' }}>Error</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--quiz-text-secondary)' }}>{state.message}</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setState({ phase: 'idle' })}
                    className="w-fit gap-2"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restart
                </Button>
            </motion.div>
        )
    }

    // ─── Render: In Progress (3-Panel Layout) ──────────────────────────────

    if (state.phase !== 'in_progress') return null

    const currentQ = state.questions[currentQuestionIndex]
    if (!currentQ) return null

    const totalQuestions = state.questions.length
    const answeredCount = state.questions.filter((q) => answers[q.slot] !== undefined).length
    const selectedValue = answers[currentQ.slot]
    const isFlagged = flagged.has(currentQ.slot)
    const isAnswered = selectedValue !== undefined

    return (
        <>
            <SubmitModal
                open={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onConfirm={handleSubmitQuiz}
                answeredCount={answeredCount}
                totalCount={totalQuestions}
            />

            <div className="flex flex-col lg:grid lg:grid-cols-[200px_1fr_240px] gap-4 lg:gap-5">
                {/* ── LEFT PANEL: Question Meta ──────────────────────────────── */}
                <div className="hidden lg:flex flex-col gap-4 rounded-xl border p-4"
                    style={{ borderColor: 'var(--quiz-border-subtle)', background: 'var(--quiz-bg-card)' }}>
                    <div>
                        <p className="text-2xl font-bold" style={{ color: 'var(--quiz-text-primary)' }}>
                            Question {currentQ.number}
                        </p>
                        <div className="h-px mt-3" style={{ background: 'var(--quiz-border-subtle)' }} />
                    </div>

                    <div>
                        <p className="quiz-meta-label">STATUS</p>
                        <p className="text-sm mt-1 flex items-center gap-1.5"
                            style={{
                                color: isAnswered
                                    ? 'var(--quiz-accent-success)'
                                    : 'var(--quiz-text-secondary)',
                            }}>
                            {isAnswered && <CheckCircle2 className="h-3.5 w-3.5" />}
                            {isAnswered ? 'Answered' : 'Not answered'}
                        </p>
                    </div>

                    <div>
                        <p className="quiz-meta-label">WEIGHTING</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--quiz-text-secondary)' }}>
                            Marked out of {currentQ.maxMark.toFixed(2)}
                        </p>
                    </div>

                    <button
                        onClick={() => toggleFlag(currentQ.slot)}
                        className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border transition-all mt-auto"
                        style={{
                            borderColor: isFlagged ? 'var(--quiz-accent-warning)' : 'var(--quiz-border-subtle)',
                            color: isFlagged ? 'var(--quiz-accent-warning)' : 'var(--quiz-text-muted)',
                        }}
                        aria-label={isFlagged ? 'Unflag question' : 'Flag question'}
                    >
                        <Flag className="h-3.5 w-3.5" />
                        {isFlagged ? 'Flagged' : 'Flag'}
                    </button>
                </div>

                {/* ── CENTER PANEL: Question & Answers ────────────────────────── */}
                <div className="flex flex-col gap-4">
                    {/* Mobile question header */}
                    <div className="lg:hidden flex items-center justify-between">
                        <p className="text-lg font-bold" style={{ color: 'var(--quiz-text-primary)' }}>
                            Question {currentQ.number} of {totalQuestions}
                        </p>
                        <button
                            onClick={() => toggleFlag(currentQ.slot)}
                            className="p-2 rounded-lg"
                            style={{ color: isFlagged ? 'var(--quiz-accent-warning)' : 'var(--quiz-text-muted)' }}
                        >
                            <Flag className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Question text */}
                    <div className="rounded-xl p-6" style={{ background: 'var(--quiz-bg-elevated)' }}>
                        {currentQ.parsed && currentQ.questionText ? (
                            <div
                                className="text-lg font-medium leading-relaxed"
                                style={{ color: 'var(--quiz-text-primary)', letterSpacing: '-0.02em' }}
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(currentQ.questionText),
                                }}
                            />
                        ) : (
                            <div
                                className="prose prose-invert max-w-none text-sm"
                                style={{ color: 'var(--quiz-text-primary)' }}
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(currentQ.rawHtml, {
                                        USE_PROFILES: { html: true },
                                        FORBID_TAGS: ['script', 'style'],
                                        FORBID_ATTR: ['onerror', 'onload', 'onclick'],
                                    }),
                                }}
                            />
                        )}
                    </div>

                    {/* Answer options */}
                    {currentQ.parsed && currentQ.options.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <p className="text-xs italic" style={{ color: 'var(--quiz-text-muted)' }}>
                                Question {currentQ.number} Answer
                            </p>

                            {currentQ.options.map((option) => {
                                const isSelected = selectedValue === option.value

                                return (
                                    <button
                                        key={option.value}
                                        className={cn('quiz-option', isSelected && 'selected')}
                                        onClick={() => handleSelectAnswer(currentQ, option.value)}
                                        role="radio"
                                        aria-checked={isSelected}
                                        aria-label={`Option ${option.letter}: ${option.label}`}
                                    >
                                        <span className="option-letter">
                                            {option.letter}
                                        </span>
                                        <span className="flex-1">{option.label}</span>
                                    </button>
                                )
                            })}

                            {/* Clear choice */}
                            <AnimatePresence>
                                {isAnswered && (
                                    <motion.button
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        onClick={() => handleClearChoice(currentQ)}
                                        className="text-xs font-medium py-2 transition-colors"
                                        style={{ color: 'var(--quiz-text-muted)' }}
                                    >
                                        Clear my choice
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Short answer / numerical input */}
                    {currentQ.parsed && currentQ.type === 'shortanswer' && (
                        <div className="flex flex-col gap-2">
                            <p className="text-xs italic" style={{ color: 'var(--quiz-text-muted)' }}>
                                Type your answer below
                            </p>
                            <input
                                type="text"
                                value={selectedValue ?? ''}
                                onChange={(e) => handleSelectAnswer(currentQ, e.target.value)}
                                placeholder="Your answer..."
                                className="w-full px-4 py-3 rounded-lg border text-sm"
                                style={{
                                    background: 'var(--quiz-bg-card)',
                                    borderColor: 'var(--quiz-border-subtle)',
                                    color: 'var(--quiz-text-primary)',
                                }}
                            />
                        </div>
                    )}

                    {/* Essay textarea */}
                    {currentQ.parsed && currentQ.type === 'essay' && (
                        <div className="flex flex-col gap-2">
                            <p className="text-xs italic" style={{ color: 'var(--quiz-text-muted)' }}>
                                Write your response below
                            </p>
                            <textarea
                                value={selectedValue ?? ''}
                                onChange={(e) => handleSelectAnswer(currentQ, e.target.value)}
                                placeholder="Your response..."
                                rows={6}
                                className="w-full px-4 py-3 rounded-lg border text-sm resize-y"
                                style={{
                                    background: 'var(--quiz-bg-card)',
                                    borderColor: 'var(--quiz-border-subtle)',
                                    color: 'var(--quiz-text-primary)',
                                }}
                            />
                        </div>
                    )}

                    {/* Previous / Next navigation */}
                    <div className="flex items-center justify-between gap-2 pt-4 border-t" style={{ borderColor: 'var(--quiz-border-subtle)' }}>
                        <Button
                            variant="outline"
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                            className="gap-2"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Previous
                        </Button>

                        <span className="text-xs tabular-nums" style={{ color: 'var(--quiz-text-muted)' }}>
                            {currentQuestionIndex + 1} / {totalQuestions}
                        </span>

                        {currentQuestionIndex < totalQuestions - 1 ? (
                            <Button
                                onClick={() => setCurrentQuestionIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                                className="gap-2 text-white"
                                style={{ background: 'var(--quiz-accent-primary)' }}
                            >
                                Next
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setShowSubmitModal(true)}
                                className="gap-2"
                                style={{ background: 'var(--quiz-accent-primary)', color: 'white' }}
                            >
                                Finish
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL: Timer & Navigator ──────────────────────────── */}
                <div className="flex flex-col gap-4">
                    {/* Timer */}
                    <div className="rounded-xl border p-4"
                        style={{ borderColor: 'var(--quiz-border-subtle)', background: 'var(--quiz-bg-card)' }}>
                        <QuizTimer timelimit={timelimit} timeStart={state.timeStart} />
                    </div>

                    {/* Question Navigator */}
                    <div className="rounded-xl border p-4"
                        style={{ borderColor: 'var(--quiz-border-subtle)', background: 'var(--quiz-bg-card)' }}>
                        <p className="quiz-meta-label mb-3">QUESTION NAVIGATOR</p>

                        <div className="grid grid-cols-5 gap-2">
                            {state.questions.map((q, idx) => {
                                const isCurrentNav = idx === currentQuestionIndex
                                const isAnsweredNav = answers[q.slot] !== undefined
                                const isFlaggedNav = flagged.has(q.slot)

                                let navClass = 'quiz-nav-btn'
                                if (isCurrentNav) navClass += ' current'
                                else if (isFlaggedNav) navClass += ' flagged'
                                else if (isAnsweredNav) navClass += ' answered'

                                return (
                                    <button
                                        key={q.slot}
                                        className={navClass}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        aria-label={`Go to question ${q.number}`}
                                        aria-current={isCurrentNav ? 'step' : undefined}
                                    >
                                        {q.number}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 mt-4 text-[10px]" style={{ color: 'var(--quiz-text-muted)' }}>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--quiz-accent-primary)' }} />
                                Current
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full border" style={{ borderColor: 'var(--quiz-accent-primary)' }} />
                                Answered
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full border" style={{ borderColor: 'var(--quiz-border-subtle)' }} />
                                Pending
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--quiz-accent-warning)' }} />
                                Flagged
                            </span>
                        </div>
                    </div>

                    {/* Submit button */}
                    <Button
                        onClick={() => setShowSubmitModal(true)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                        Submit Quiz
                    </Button>

                    {/* Mobile: Timer (shown above grid on small screens) */}
                    <div className="lg:hidden rounded-xl border p-4"
                        style={{ borderColor: 'var(--quiz-border-subtle)', background: 'var(--quiz-bg-card)' }}>
                        <p className="text-xs mb-1 text-center" style={{ color: 'var(--quiz-text-muted)' }}>
                            {answeredCount} of {totalQuestions} answered
                        </p>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--quiz-bg-elevated)' }}>
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${(answeredCount / totalQuestions) * 100}%`,
                                    background: 'var(--quiz-accent-primary)',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
