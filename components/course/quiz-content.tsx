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
import type { MoodleAttemptQuestion, MoodleAttemptReviewResponse } from '@/lib/moodle/types'

interface QuizContentProps {
    quizId: number
    quizName: string
    courseId: number
    timelimit?: number    // seconds, 0 = unlimited
    maxAttempts?: number  // 0 = unlimited
    gradePass?: number
    onBack?: () => void
    onCompletionUpdated?: () => void
}

type QuizPhase =
    | { phase: 'idle' }
    | { phase: 'loading_start' }
    | {
        phase: 'start_screen'
        attempts: Array<{
            id: number
            state: string
            grade: number | null
            timestart: number
            timefinish: number | null
        }>
        accessInfo: {
            canattempt: boolean
            preventnewattemptreasons: string[]
        }
        maxAttempts: number
    }
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
    | { phase: 'finished'; finalState: string; sumGrades: number | null; maxGrade: number; review: MoodleAttemptReviewResponse | null }
    | { phase: 'review_loading' }
    | { phase: 'review_screen'; review: MoodleAttemptReviewResponse }
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
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
    onBack,
    onCompletionUpdated,
}: QuizContentProps) {
    const [state, setState] = useState<QuizPhase>({ phase: 'idle' })
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, string>>({}) // slot → value
    const [sequenceChecks, setSequenceChecks] = useState<Record<number, number>>({}) // slot → value
    const [flagged, setFlagged] = useState<Set<number>>(new Set())     // slot numbers
    const [showSubmitModal, setShowSubmitModal] = useState(false)
    // Load start screen data
    useEffect(() => {
        if (state.phase !== 'idle') return

        const loadStartScreen = async () => {
            setState({ phase: 'loading_start' })
            try {
                // Get user attempts
                const attemptsRes = await fetch(`/api/courses/${courseId}/quiz/${quizId}/attempts`, { cache: 'no-store' })
                if (!attemptsRes.ok) throw new Error('Failed to load attempts')
                const attemptsData = await attemptsRes.json()

                // Get access information
                const accessRes = await fetch(`/api/courses/${courseId}/quiz/${quizId}/access`, { cache: 'no-store' })
                if (!accessRes.ok) throw new Error('Failed to load access info')
                const accessData = await accessRes.json()

                // View quiz (fire-and-forget)
                fetch(`/api/courses/${courseId}/quiz/${quizId}/view`, { method: 'POST' }).catch(() => {})

                setState({
                    phase: 'start_screen',
                    attempts: attemptsData.attempts.map((a: any) => ({
                        id: a.id,
                        state: a.state,
                        grade: a.grade,
                        timestart: a.timestart,
                        timefinish: a.timefinish,
                    })),
                    accessInfo: {
                        canattempt: accessData.canattempt,
                        preventnewattemptreasons: accessData.preventnewattemptreasons,
                    },
                    maxAttempts,
                })
            } catch (error) {
                setState({ phase: 'error', message: error instanceof Error ? error.message : 'Failed to load quiz' })
            }
        }

        loadStartScreen()
    }, [state.phase, courseId, quizId, maxAttempts])

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
            
            if (!startData?.attempt || typeof startData.attempt.id === 'undefined') {
                console.error("Quiz Start Payload Error:", startData)
                throw new Error(startData?.message || startData?.error || startData?.exception || 'Failed to start quiz: Invalid response format from server')
            }

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

            // View attempt (fire-and-forget)
            fetch(`/api/courses/${courseId}/quiz/${quizId}/attempt/${attemptId}/view`, { method: 'POST' }).catch(() => {})
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
            // Get attempt summary before submitting
            const summaryRes = await fetch(
                `/api/courses/${courseId}/quiz/${quizId}/attempt/${state.attemptId}/summary`
            )
            if (summaryRes.ok) {
                const summary = await summaryRes.json()
                console.log('Attempt summary:', summary)
            }

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

            // Get attempt review after finishing
            const reviewRes = await fetch(
                `/api/courses/${courseId}/quiz/${quizId}/attempt/${state.attemptId}/review`
            )
            let review = null
            if (reviewRes.ok) {
                review = await reviewRes.json()
                console.log('Attempt review:', review)
            }

            // Get feedback for grade if available
            let feedback = null
            if (review?.grade) {
                const feedbackRes = await fetch(
                    `/api/courses/${courseId}/quiz/${quizId}/feedback/${review.grade}`
                )
                if (feedbackRes.ok) {
                    feedback = await feedbackRes.json()
                    console.log('Quiz feedback:', feedback)
                }
            }

            const totalMarks = state.questions.reduce((sum, q) => sum + q.maxMark, 0)
            const answeredSlots = Object.keys(answers).length

            if (review) {
                setState({ phase: 'review_screen', review })
            } else {
                setState({
                    phase: 'finished',
                    finalState: 'finished',
                    sumGrades: answeredSlots,
                    maxGrade: totalMarks,
                    review: null
                })
            }

            // Moodle marks quiz complete automatically server-side after
            // finishattempt=1. Notify the parent to re-fetch completion data
            // so the sidebar and progress bar update immediately.
            onCompletionUpdated?.()
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

    // Load attempt review
    const handleReviewAttempt = async (attemptId: number) => {
        setState({ phase: 'review_loading' })
        try {
            const reviewRes = await fetch(
                `/api/courses/${courseId}/quiz/${quizId}/attempt/${attemptId}/review`
            )
            if (!reviewRes.ok) throw new Error('Failed to load review')
            const review = await reviewRes.json()
            setState({ phase: 'review_screen', review })
        } catch (err) {
            setState({ phase: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
        }
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

    // ─── Render: Loading Start ─────────────────────────────────────────────

    if (state.phase === 'loading_start') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-4 py-20"
            >
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--quiz-accent-primary)' }} />
                <p className="text-sm" style={{ color: 'var(--quiz-text-secondary)' }}>Loading quiz information...</p>
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

    // ─── Render: Start Screen ──────────────────────────────────────────────

    if (state.phase === 'start_screen') {
        const hasAttempts = state.attempts.length > 0
        const hasAttemptsRemaining = state.maxAttempts === 0 || state.attempts.length < state.maxAttempts
        const preventReasons = state.accessInfo.preventnewattemptreasons
        // Combine Moodle's logic with our fallback: if Moodle blocks without a reason but we have attempts left, let the button render
        const canAttempt = state.accessInfo.canattempt || (hasAttemptsRemaining && preventReasons.length === 0)

        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 rounded-2xl border p-8 sm:p-12"
                style={{
                    borderColor: 'var(--quiz-border-subtle)',
                    background: 'var(--quiz-bg-card)',
                }}
            >
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full"
                            style={{ background: 'rgba(37, 99, 235, 0.1)' }}>
                            <HelpCircle className="h-6 w-6" style={{ color: 'var(--quiz-accent-primary)' }} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold" style={{ color: 'var(--quiz-text-primary)' }}>
                                {quizName}
                            </h3>
                            <p className="text-sm" style={{ color: 'var(--quiz-text-secondary)' }}>
                                Quiz Overview
                            </p>
                        </div>
                    </div>

                    {/* Quiz Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-lg border p-4"
                            style={{ borderColor: 'var(--quiz-border-subtle)', background: 'var(--quiz-bg-elevated)' }}>
                            <p className="quiz-meta-label">TIME LIMIT</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--quiz-text-secondary)' }}>
                                {timelimit > 0 ? `${Math.floor(timelimit / 60)} minutes` : 'No time limit'}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4"
                            style={{ borderColor: 'var(--quiz-border-subtle)', background: 'var(--quiz-bg-elevated)' }}>
                            <p className="quiz-meta-label">ATTEMPT LIMIT</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--quiz-text-secondary)' }}>
                                {state.maxAttempts > 0 ? `${state.maxAttempts} attempt(s)` : 'Unlimited attempts'}
                            </p>
                            {state.maxAttempts > 0 && (
                                <>
                                    <p className="quiz-meta-label mt-3">REMAINING</p>
                                    <p className="text-sm mt-1" style={{ color: 'var(--quiz-text-secondary)' }}>
                                        {Math.max(0, state.maxAttempts - state.attempts.length)} attempt(s) left
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Previous Attempts */}
                    {hasAttempts && (
                        <div className="rounded-lg border p-4"
                            style={{ borderColor: 'var(--quiz-border-subtle)', background: 'var(--quiz-bg-elevated)' }}>
                            <p className="quiz-meta-label mb-3">PREVIOUS ATTEMPTS</p>
                            <div className="space-y-2">
                                {state.attempts.map((attempt, idx) => (
                                    <div key={attempt.id} className="flex items-center justify-between text-sm">
                                        <span style={{ color: 'var(--quiz-text-secondary)' }}>
                                            Attempt {idx + 1}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span style={{ color: 'var(--quiz-text-muted)' }}>
                                                {attempt.state}
                                            </span>
                                            {attempt.grade !== null && (
                                                <span className="font-medium" style={{ color: 'var(--quiz-text-primary)' }}>
                                                    Grade: {attempt.grade}
                                                </span>
                                            )}
                                            {attempt.state === 'finished' && (
                                                <button
                                                    onClick={() => handleReviewAttempt(attempt.id)}
                                                    className="font-medium hover:underline text-xs"
                                                    style={{ color: 'var(--quiz-accent-primary)' }}
                                                >
                                                    Review
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Access Restrictions */}
                    {!canAttempt && preventReasons.length > 0 && (
                        <div className="rounded-lg border p-4"
                            style={{
                                borderColor: 'rgba(239, 68, 68, 0.2)',
                                background: 'rgba(239, 68, 68, 0.05)',
                            }}>
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--quiz-text-primary)' }}>
                                        Cannot Start Quiz
                                    </p>
                                    <ul className="text-xs mt-1 space-y-1" style={{ color: 'var(--quiz-text-secondary)' }}>
                                        {preventReasons.map((reason, idx) => (
                                            <li key={idx}>• {reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    {canAttempt ? (
                        <Button
                            className="flex-1 text-white gap-2"
                            style={{ background: 'var(--quiz-accent-primary)' }}
                            onClick={handleStartQuiz}
                        >
                            Start Quiz
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => (onBack ? onBack() : setState({ phase: 'idle' }))}
                        >
                            Back to Course
                        </Button>
                    )}
                </div>
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
                        Quiz Complete!
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
                    onClick={() => (onBack ? onBack() : setState({ phase: 'idle' }))}
                    className="w-fit gap-2"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restart
                </Button>
            </motion.div>
        )
    }

    // ─── Render: Review Loading ─────────────────────────────────────────────

    if (state.phase === 'review_loading') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-4 py-20"
            >
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--quiz-accent-primary)' }} />
                <p className="text-sm" style={{ color: 'var(--quiz-text-secondary)' }}>Loading review...</p>
            </motion.div>
        )
    }

    // ─── Render: Review Screen ──────────────────────────────────────────────

    if (state.phase === 'review_screen') {
        const review = state.review
        const formatTime = (seconds: number) => new Date(seconds * 1000).toLocaleString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
        const timeTaken = review.attempt.timefinish && review.attempt.timestart 
            ? Math.max(0, review.attempt.timefinish - review.attempt.timestart) 
            : 0
        const formatDuration = (secs: number) => {
            if (!secs) return '-'
            const m = Math.floor(secs / 60)
            const s = secs % 60
            return m > 0 ? `${m} mins ${s} secs` : `${s} secs`
        }

        const processQuestionHTML = (rawHtml: string, qState: string) => {
            if (typeof window === 'undefined') return DOMPurify.sanitize(rawHtml)
            
            try {
                const cleanHtml = DOMPurify.sanitize(rawHtml)
                const parser = new DOMParser()
                const doc = parser.parseFromString(cleanHtml, 'text/html')
                
                const inputs = Array.from(doc.querySelectorAll('input[type="radio"], input[type="checkbox"]')) as HTMLInputElement[]
                const selectedInputs = inputs.filter(i => i.hasAttribute('checked') || i.checked)
                const correctElements = Array.from(doc.querySelectorAll('.correct, [fraction="1"], [fraction="1.0"], [fraction="1.00"]'))
                
                selectedInputs.forEach(input => {
                    const wrapper = input.closest('.r0, .r1, div')
                    if (!wrapper) return
                    
                    if (qState === 'gradedright') {
                        wrapper.classList.add('!border-emerald-500', '!bg-emerald-500/10')
                        input.setAttribute('style', 'accent-color: #10b981;')
                    } else if (qState === 'gradedwrong' || qState === 'gradedpartial') {
                        wrapper.classList.add('!border-red-500', '!bg-red-500/10')
                        input.setAttribute('style', 'accent-color: #ef4444;')
                    } else {
                        wrapper.classList.add('!border-blue-500', '!bg-blue-500/10')
                        input.setAttribute('style', 'accent-color: #3b82f6;')
                    }
                    input.setAttribute('checked', 'checked')
                })

                if (qState === 'gradedwrong' || qState === 'gradedpartial') {
                    correctElements.forEach(el => {
                        const wrapper = el.closest('.r0, .r1, div')
                        if (wrapper && !wrapper.classList.contains('!border-red-500')) {
                            wrapper.classList.add('!border-emerald-500', '!bg-emerald-500/10')
                            const input = wrapper.querySelector('input')
                            if (input) input.setAttribute('style', 'accent-color: #10b981;')
                        }
                    })
                }

                return doc.body.innerHTML
            } catch (e) {
                return DOMPurify.sanitize(rawHtml)
            }
        }

        return (
            <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--quiz-text-primary)' }}>Review Attempt</h2>
                    <Button 
                        variant="outline" 
                        onClick={() => (onBack ? onBack() : setState({ phase: 'idle' }))}
                        className="gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Course
                    </Button>
                </div>

                {/* Summary Card */}
                <div className="rounded-xl border p-6" style={{ borderColor: 'var(--quiz-border-subtle)', background: 'var(--quiz-bg-card)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-y-3 text-sm">
                        <div className="font-medium" style={{ color: 'var(--quiz-text-secondary)' }}>Started on</div>
                        <div style={{ color: 'var(--quiz-text-primary)' }}>{formatTime(review.attempt.timestart)}</div>
                        
                        <div className="font-medium" style={{ color: 'var(--quiz-text-secondary)' }}>State</div>
                        <div className="font-bold" style={{ color: review.attempt.state === 'finished' ? 'var(--quiz-accent-success)' : 'var(--quiz-text-primary)' }}>
                            {review.attempt.state === 'finished' ? 'Finished' : review.attempt.state}
                        </div>
                        
                        <div className="font-medium" style={{ color: 'var(--quiz-text-secondary)' }}>Completed on</div>
                        <div style={{ color: 'var(--quiz-text-primary)' }}>{review.attempt.timefinish ? formatTime(review.attempt.timefinish) : '-'}</div>
                        
                        <div className="font-medium" style={{ color: 'var(--quiz-text-secondary)' }}>Time taken</div>
                        <div style={{ color: 'var(--quiz-text-primary)' }}>{formatDuration(timeTaken)}</div>
                        
                        <div className="font-medium" style={{ color: 'var(--quiz-text-secondary)' }}>Marks</div>
                        <div className="font-bold text-lg" style={{ color: 'var(--quiz-text-primary)' }}>{review.grade || '-'}</div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="flex flex-col gap-8 mt-2">
                    {review.questions.map((q, idx) => {
                        const isCorrect = q.state === 'gradedright' || q.status?.toLowerCase() === 'correct'
                        const isIncorrect = q.state === 'gradedwrong' || q.status?.toLowerCase() === 'incorrect'
                        const isPartial = q.state === 'gradedpartial' || q.status?.toLowerCase() === 'partially correct' || q.state === 'gradedpartial'

                        return (
                            <div key={q.slot} className="flex flex-col lg:grid lg:grid-cols-[220px_1fr] gap-0 rounded-xl overflow-hidden border shadow-sm" style={{ borderColor: 'var(--quiz-border-subtle)', background: 'var(--quiz-bg-card)' }}>
                                {/* Left Panel */}
                                <div className="p-5 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'var(--quiz-border-subtle)', background: 'var(--quiz-bg-elevated)' }}>
                                    <div>
                                        <p className="font-bold text-lg" style={{ color: 'var(--quiz-text-primary)' }}>Question {q.number || idx + 1}</p>
                                    </div>
                                    <div>
                                        <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-md border" style={{ 
                                            background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : isIncorrect ? 'rgba(239, 68, 68, 0.1)' : isPartial ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                                            borderColor: isCorrect ? 'rgba(16, 185, 129, 0.2)' : isIncorrect ? 'rgba(239, 68, 68, 0.2)' : isPartial ? 'rgba(245, 158, 11, 0.2)' : 'var(--quiz-border-subtle)',
                                            color: isCorrect ? 'var(--quiz-accent-success)' : isIncorrect ? '#ef4444' : isPartial ? '#f59e0b' : 'var(--quiz-text-secondary)'
                                        }}>
                                            {q.status || 'Complete'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--quiz-text-muted)' }}>Mark</p>
                                        <p className="text-sm mt-0.5" style={{ color: 'var(--quiz-text-secondary)' }}>
                                            {q.mark !== undefined ? `${parseFloat(String(q.mark)).toFixed(2)} out of ${parseFloat(String(q.maxmark)).toFixed(2)}` : '-'}
                                        </p>
                                    </div>
                                    {q.flagged && (
                                        <div className="mt-auto flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--quiz-accent-warning)' }}>
                                            <Flag className="h-3.5 w-3.5 fill-current" /> Flagged
                                        </div>
                                    )}
                                </div>

                                {/* Right Panel */}
                                <div className="p-6 overflow-x-auto">
                                    <div 
                                        className="prose prose-sm prose-invert max-w-none 
                                            [&_.que]:mb-0 [&_.formulation]:mb-4 [&_.formulation_h4]:hidden 
                                            [&_.ablock]:mt-4 [&_.ablock_.answer]:flex [&_.ablock_.answer]:flex-col [&_.ablock_.answer]:gap-3
                                            [&_.answer_.r0]:p-3 [&_.answer_.r0]:rounded-lg [&_.answer_.r0]:border [&_.answer_.r0]:border-white/10 [&_.answer_.r0]:bg-white/5
                                            [&_.answer_.r1]:p-3 [&_.answer_.r1]:rounded-lg [&_.answer_.r1]:border [&_.answer_.r1]:border-white/10 [&_.answer_.r1]:bg-white/5
                                            [&_input[type=radio]]:mr-3 [&_input[type=radio]]:scale-110 [&_input[type=checkbox]]:mr-3
                                            [&_.info]:hidden
                                            [&_.grade]:hidden
                                            [&_.state]:hidden
                                            [&_.rightanswer]:p-4 [&_.rightanswer]:rounded-lg [&_.rightanswer]:bg-emerald-500/10 [&_.rightanswer]:border [&_.rightanswer]:border-emerald-500/20 [&_.rightanswer]:text-emerald-300 [&_.rightanswer]:mt-4
                                            [&_.specificfeedback]:p-4 [&_.specificfeedback]:rounded-lg [&_.specificfeedback]:bg-white/5 [&_.specificfeedback]:border [&_.specificfeedback]:border-white/10 [&_.specificfeedback]:mt-4
                                            [&_.generalfeedback]:p-4 [&_.generalfeedback]:rounded-lg [&_.generalfeedback]:bg-white/5 [&_.generalfeedback]:border [&_.generalfeedback]:border-white/10 [&_.generalfeedback]:mt-4
                                            [&_.correct]:font-medium [&_.correct]:text-emerald-400 [&_.incorrect]:font-medium [&_.incorrect]:text-red-400 [&_i.icon.fa-check]:text-emerald-400 [&_i.icon.fa-remove]:text-red-400"
                                        dangerouslySetInnerHTML={{ __html: processQuestionHTML(q.html, q.state) }} 
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
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
        <div className="relative">
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
        </div>
    )
}
