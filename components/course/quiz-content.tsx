"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Trophy,
  AlertCircle,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { QuizActivity, QuizQuestion } from "@/lib/types"

interface QuizContentProps {
  activity: QuizActivity
  isCompleted: boolean
  onMarkComplete: () => void
}

type QuizState = "intro" | "in-progress" | "review"

export function QuizContent({ activity, isCompleted, onMarkComplete }: QuizContentProps) {
  const [quizState, setQuizState] = useState<QuizState>(isCompleted ? "review" : "intro")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [showFeedback, setShowFeedback] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set())

  const questions = activity.questions
  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length

  const score = useMemo(() => {
    let correct = 0
    for (const q of questions) {
      if (selectedAnswers[q.id] === q.correctAnswerId) correct++
    }
    return correct
  }, [selectedAnswers, questions])

  const scorePercent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
  const passed = scorePercent >= activity.passingScore

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    if (answeredQuestions.has(questionId)) return
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswers[currentQuestion.id]) return
    setAnsweredQuestions((prev) => new Set(prev).add(currentQuestion.id))
    setShowFeedback(true)
  }

  const handleNext = () => {
    setShowFeedback(false)
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      setQuizState("review")
    }
  }

  const handleRetry = () => {
    setQuizState("in-progress")
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setShowFeedback(false)
    setAnsweredQuestions(new Set())
  }

  const handleStart = () => {
    setQuizState("in-progress")
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setShowFeedback(false)
    setAnsweredQuestions(new Set())
  }

  // Intro screen
  if (quizState === "intro") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card p-8 sm:p-12 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <HelpCircle className="h-8 w-8 text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold text-foreground">Ready for the Quiz?</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            This quiz has <strong className="text-foreground">{totalQuestions} questions</strong>. 
            You need <strong className="text-foreground">{activity.passingScore}%</strong> to pass. 
            Each question has immediate feedback so you can learn as you go.
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleStart}
        >
          Start Quiz
          <ChevronRight className="ml-1.5 h-4 w-4" />
        </Button>
      </motion.div>
    )
  }

  // Review / results screen
  if (quizState === "review") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        {/* Score card */}
        <div
          className={cn(
            "flex flex-col items-center gap-4 rounded-xl border p-8 sm:p-12 text-center",
            passed ? "border-emerald-500/20 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5"
          )}
        >
          <div
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full",
              passed ? "bg-emerald-500/15" : "bg-destructive/15"
            )}
          >
            {passed ? (
              <Trophy className="h-10 w-10 text-emerald-400" />
            ) : (
              <AlertCircle className="h-10 w-10 text-destructive" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-foreground">
              {passed ? "Congratulations!" : "Not quite there yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              You scored <strong className="text-foreground">{score}/{totalQuestions}</strong> ({scorePercent}%)
              {passed
                ? ` -- above the ${activity.passingScore}% passing threshold.`
                : ` -- below the ${activity.passingScore}% passing threshold.`}
            </p>
          </div>
        </div>

        {/* Question review */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-foreground">Question Review</h4>
          {questions.map((q, idx) => {
            const userAnswer = selectedAnswers[q.id]
            const isCorrect = userAnswer === q.correctAnswerId
            const correctOption = q.options.find((o) => o.id === q.correctAnswerId)
            const userOption = q.options.find((o) => o.id === userAnswer)

            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-lg border p-4",
                  isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5"
                )}
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                  )}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      Q{idx + 1}: {q.question}
                    </p>
                    {!isCorrect && (
                      <p className="text-xs text-muted-foreground">
                        Your answer: <span className="text-destructive">{userOption?.text}</span>
                        {" | "}Correct: <span className="text-emerald-400">{correctOption?.text}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/80 italic">{q.explanation}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {!passed && (
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-secondary"
              onClick={handleRetry}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry Quiz
            </Button>
          )}
          {passed && !isCompleted && (
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onMarkComplete}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark as Complete
            </Button>
          )}
        </div>
      </motion.div>
    )
  }

  // In-progress: question view
  const isAnswered = answeredQuestions.has(currentQuestion.id)
  const selectedOption = selectedAnswers[currentQuestion.id]
  const isCorrect = selectedOption === currentQuestion.correctAnswerId

  return (
    <div className="flex flex-col gap-5">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + (isAnswered ? 1 : 0)) / totalQuestions) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {currentQuestionIndex + 1}/{totalQuestions}
        </span>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-border bg-card p-6 sm:p-8"
        >
          {/* Question type badge */}
          <div className="mb-4">
            <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground">
              {currentQuestion.type === "true-false" ? "True / False" : "Multiple Choice"}
            </span>
          </div>

          {/* Question text */}
          <h3 className="text-base font-semibold text-foreground mb-5 leading-relaxed">
            {currentQuestion.question}
          </h3>

          {/* Options */}
          <div className="flex flex-col gap-2.5">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option.id
              const isCorrectOption = option.id === currentQuestion.correctAnswerId
              const showCorrect = isAnswered && isCorrectOption
              const showIncorrect = isAnswered && isSelected && !isCorrectOption

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectAnswer(currentQuestion.id, option.id)}
                  disabled={isAnswered}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all",
                    !isAnswered && isSelected && "border-primary bg-primary/10 text-foreground",
                    !isAnswered && !isSelected && "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-secondary/40",
                    showCorrect && "border-emerald-500/40 bg-emerald-500/10 text-foreground",
                    showIncorrect && "border-destructive/40 bg-destructive/10 text-foreground",
                    isAnswered && !showCorrect && !showIncorrect && "border-border bg-card text-muted-foreground/50 opacity-60"
                  )}
                >
                  {/* Radio indicator */}
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      !isAnswered && isSelected && "border-primary bg-primary",
                      !isAnswered && !isSelected && "border-border",
                      showCorrect && "border-emerald-400 bg-emerald-400",
                      showIncorrect && "border-destructive bg-destructive",
                      isAnswered && !showCorrect && !showIncorrect && "border-border"
                    )}
                  >
                    {(isSelected || showCorrect) && (
                      <div className="h-2 w-2 rounded-full bg-foreground" />
                    )}
                  </div>
                  <span className="flex-1">{option.text}</span>
                  {showCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                  {showIncorrect && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {showFeedback && isAnswered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className={cn(
                    "mt-5 rounded-lg border p-4",
                    isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">
                        {isCorrect ? "Correct!" : "Incorrect"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
        {!isAnswered ? (
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!selectedOption}
            onClick={handleSubmitAnswer}
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleNext}
          >
            {currentQuestionIndex < totalQuestions - 1 ? (
              <>
                Next Question
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </>
            ) : (
              "View Results"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
