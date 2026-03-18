'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronRight,
    RotateCcw,
    Trophy,
    AlertCircle,
    HelpCircle,
    Loader2,
    ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import DOMPurify from 'isomorphic-dompurify'
import type { MoodleAttemptQuestion } from '@/lib/moodle/types'

interface QuizContentProps {
    quizId: number
    quizName: string
    courseId: number
}

/**
 * State machine for quiz attempt flow:
 * - 'idle': Not started
 * - 'loading': Initial load
 * - 'in_progress': Currently answering questions
 * - 'submitting': Saving page or finishing attempt
 * - 'finished': Attempt completed
 * - 'error': Error occurred
 */
type QuizPhase =
    | { phase: 'idle' }
    | { phase: 'loading' }
    | {
        phase: 'in_progress'
        attemptId: number
        currentPage: number
        totalPages: number
        questions: MoodleAttemptQuestion[]
        attemptState: string
    }
    | { phase: 'submitting' }
    | { phase: 'finished'; finalState: string }
    | { phase: 'error'; message: string }

export function QuizContent({ quizId, quizName, courseId }: QuizContentProps) {
    const [state, setState] = useState<QuizPhase>({ phase: 'idle' })
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const formRef = useRef<HTMLFormElement>(null)

    /**
     * Extract all named input values from the form.
     * This captures all answer slots in the rendered question HTML.
     */
    const extractAnswerData = (): Array<{ name: string; value: string }> => {
        if (!formRef.current) return []
        const formData = new FormData(formRef.current)
        const data: Array<{ name: string; value: string }> = []
        for (const [name, value] of formData.entries()) {
            data.push({ name, value: String(value) })
        }
        return data
    }

    /**
     * Start a new quiz attempt.
     * If attempt is still in progress, force a new one.
     */
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
                // If attempt still in progress, force a new one
                if (error.error?.includes('attemptstillinprogress')) {
                    startRes = await fetch(`/api/courses/${courseId}/quiz/${quizId}/attempt`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ forcenew: true }),
                    })
                    if (!startRes.ok) {
                        error = await startRes.json()
                    } else {
                        error = null
                    }
                }
            }

            if (error) {
                throw new Error(error.error ?? 'Failed to start quiz')
            }

            const startData = await startRes.json()
            const attemptId = startData.attempt.id

            // Fetch first page of questions
            const pageRes = await fetch(
                `/api/courses/${courseId}/quiz/${quizId}/attempt/${attemptId}/page/0`
            )

            if (!pageRes.ok) {
                const error = await pageRes.json()
                throw new Error(error.error ?? 'Failed to fetch quiz page')
            }

            const pageData = await pageRes.json()

            // Try to fetch page 1 to see if there are multiple pages
            let hasNextPage = false
            try {
                const nextPageRes = await fetch(
                    `/api/courses/${courseId}/quiz/${quizId}/attempt/${attemptId}/page/1`
                )
                if (nextPageRes.ok) {
                    const nextPageData = await nextPageRes.json()
                    hasNextPage = (nextPageData.questions?.length ?? 0) > 0
                }
            } catch {
                // Ignore - assume single page if this fails
            }

            setState({
                phase: 'in_progress',
                attemptId,
                currentPage: 0,
                totalPages: hasNextPage ? 2 : 1, // Approximate: 1 if no next page, 2+ if there is
                questions: pageData.questions,
                attemptState: pageData.attempt.state,
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            setState({ phase: 'error', message })
        }
    }

    /**
     * Submit current page answers and move to next page, or finish.
     */
    const handleSubmitPage = async (shouldFinish: boolean) => {
        if (state.phase !== 'in_progress') return

        setState({ phase: 'submitting' })
        try {
            const answerData = extractAnswerData()

            const submitRes = await fetch(
                `/api/courses/${courseId}/quiz/${quizId}/attempt/${state.attemptId}/submit`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: answerData,
                        finishattempt: shouldFinish,
                        timeup: false,
                    }),
                }
            )

            if (!submitRes.ok) {
                const error = await submitRes.json()
                throw new Error(error.error ?? 'Failed to submit page')
            }

            const submitData = await submitRes.json()

            if (shouldFinish) {
                setState({ phase: 'finished', finalState: submitData.state })
                return
            }

            // Move to next page
            const nextPageNum = state.currentPage + 1
            const nextPageRes = await fetch(
                `/api/courses/${courseId}/quiz/${quizId}/attempt/${state.attemptId}/page/${nextPageNum}`
            )

            if (!nextPageRes.ok) {
                const error = await nextPageRes.json()
                throw new Error(error.error ?? 'Failed to fetch next page')
            }

            const nextPageData = await nextPageRes.json()
            setAnswers({})

            // Check if there's another page after this one
            let hasAnotherPage = false
            try {
                const checkRes = await fetch(
                    `/api/courses/${courseId}/quiz/${quizId}/attempt/${state.attemptId}/page/${nextPageNum + 1}`
                )
                if (checkRes.ok) {
                    const checkData = await checkRes.json()
                    hasAnotherPage = (checkData.questions?.length ?? 0) > 0
                }
            } catch {
                // Ignore
            }

            setState({
                phase: 'in_progress',
                attemptId: state.attemptId,
                currentPage: nextPageNum,
                totalPages: hasAnotherPage ? nextPageNum + 2 : nextPageNum + 1,
                questions: nextPageData.questions,
                attemptState: nextPageData.attempt.state,
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            setState({ phase: 'error', message })
        }
    }

    /**
     * Go back to previous page.
     */
    const handlePreviousPage = async () => {
        if (state.phase !== 'in_progress' || state.currentPage === 0) return

        setState({ phase: 'submitting' })
        try {
            // Must save current page before navigating
            const answerData = extractAnswerData()

            const submitRes = await fetch(
                `/api/courses/${courseId}/quiz/${quizId}/attempt/${state.attemptId}/submit`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: answerData,
                        finishattempt: false,
                        timeup: false,
                    }),
                }
            )

            if (!submitRes.ok) {
                const error = await submitRes.json()
                throw new Error(error.error ?? 'Failed to save page')
            }

            // Fetch previous page
            const prevPageNum = state.currentPage - 1
            const prevPageRes = await fetch(
                `/api/courses/${courseId}/quiz/${quizId}/attempt/${state.attemptId}/page/${prevPageNum}`
            )

            if (!prevPageRes.ok) {
                const error = await prevPageRes.json()
                throw new Error(error.error ?? 'Failed to fetch previous page')
            }

            const prevPageData = await prevPageRes.json()
            setAnswers({})

            setState({
                phase: 'in_progress',
                attemptId: state.attemptId,
                currentPage: prevPageNum,
                totalPages: state.totalPages,
                questions: prevPageData.questions,
                attemptState: prevPageData.attempt.state,
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            setState({ phase: 'error', message })
        }
    }

    // ── Render states ──────────────────────────────────────────────────────

    if (state.phase === 'idle') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card p-8 sm:p-12 text-center"
            >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                    <HelpCircle className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-bold text-foreground">Ready for the Quiz?</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Quiz: <strong className="text-foreground">{quizName}</strong>
                        <br />
                        Start when you&apos;re ready. Good luck!
                    </p>
                </div>
                <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={handleStartQuiz}
                >
                    Start Quiz
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </motion.div>
        )
    }

    if (state.phase === 'loading') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-4 py-20"
            >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Starting quiz...</p>
            </motion.div>
        )
    }

    if (state.phase === 'submitting') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-4 py-20"
            >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Saving...</p>
            </motion.div>
        )
    }

    if (state.phase === 'finished') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 sm:p-12 text-center"
            >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
                    <Trophy className="h-10 w-10 text-emerald-400" />
                </div>
                <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-foreground">Quiz Complete!</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Your attempt has been submitted. Final state: <strong className="text-foreground">{state.finalState}</strong>
                    </p>
                </div>
            </motion.div>
        )
    }

    if (state.phase === 'error') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5"
            >
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Error</p>
                        <p className="text-xs text-muted-foreground mt-1">{state.message}</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setState({ phase: 'idle' })}
                    className="w-fit"
                >
                    <RotateCcw className="h-3.5 w-3.5 mr-2" />
                    Restart
                </Button>
            </motion.div>
        )
    }

    // In-progress state
    if (state.phase !== 'in_progress') return null

    const currentQuestion = state.questions[0]
    const isLastPage = state.currentPage === state.totalPages - 1

    return (
        <div className="flex flex-col gap-5">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${((state.currentPage + 1) / Math.max(state.totalPages, 1)) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    Page {state.currentPage + 1}
                </span>
            </div>

            {/* Questions container */}
            <form ref={formRef} className="flex flex-col gap-4">
                {state.questions.map((question, idx) => (
                    <motion.div
                        key={`${state.attemptId}-${state.currentPage}-${idx}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="rounded-xl border border-border bg-card overflow-hidden"
                    >
                        {/* Question header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-secondary/30">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-400">
                                {question.number}
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                                {question.type.charAt(0).toUpperCase() + question.type.slice(1)}
                            </p>
                        </div>

                        {/* Question HTML (rendered with DOMPurify sanitization) */}
                        <div className="px-4 py-4">
                            <div
                                className="prose prose-invert max-w-none text-sm [&_input]:form-input [&_input]:bg-secondary [&_input]:border-border [&_input]:rounded [&_input]:px-3 [&_input]:py-2 [&_input]:text-foreground [&_select]:form-select [&_select]:bg-secondary [&_select]:border-border [&_select]:rounded [&_select]:px-3 [&_select]:py-2 [&_select]:text-foreground [&_textarea]:form-textarea [&_textarea]:bg-secondary [&_textarea]:border-border [&_textarea]:rounded [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-foreground"
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(question.html, {
                                        USE_PROFILES: { html: true },
                                        FORBID_TAGS: ['script', 'style'],
                                        FORBID_ATTR: ['onerror', 'onload', 'onclick'],
                                    }),
                                }}
                            />
                        </div>
                    </motion.div>
                ))}
            </form>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-2 pt-2">
                <Button
                    variant="outline"
                    disabled={state.currentPage === 0}
                    onClick={handlePreviousPage}
                    className="gap-2"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Previous
                </Button>

                <span className="text-xs text-muted-foreground">
                    Page {state.currentPage + 1}
                </span>

                <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2"
                    onClick={() => handleSubmitPage(isLastPage)}
                >
                    {isLastPage ? 'Finish Quiz' : 'Next Page'}
                    <ChevronRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    )
}

