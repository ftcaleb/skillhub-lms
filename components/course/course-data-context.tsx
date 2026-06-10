'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import type { MoodleCourse, HydratedMoodleSection, HydratedMoodleModule } from '@/lib/moodle/types'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CompletionStats {
    total: number
    completed: number
    percentage: number
}

export interface CourseDataState {
    course: MoodleCourse | null
    sections: HydratedMoodleSection[]
    completion: CompletionStats
    loading: boolean
    error: string | null
}

interface CourseDataContextValue extends CourseDataState {
    /** Fetch (or re-fetch) all track data for the given courseId */
    fetchTrackData: (courseId: number) => Promise<void>
    /** Optimistic completion toggle — updates context state, calls API, rolls back on failure */
    toggleCompletion: (cmid: number, courseId: number) => Promise<void>
    /** Get a flattened, ordered list of all navigable modules */
    flatModules: HydratedMoodleModule[]
    /** Whether the initial load is done (even if error) */
    isHydrated: boolean
}

const CourseDataContext = createContext<CourseDataContextValue | null>(null)

// ── Helpers ────────────────────────────────────────────────────────────────────

function isModuleNavigable(mod: HydratedMoodleModule): boolean {
    return mod.modname !== 'label' && mod.modname !== 'customcert'
}

function isCompleted(mod: HydratedMoodleModule): boolean {
    return (mod.completiondata?.state ?? 0) >= 1
}

function computeCompletion(sections: HydratedMoodleSection[]): CompletionStats {
    let total = 0
    let completed = 0
    for (const section of sections) {
        for (const mod of section.modules) {
            if (!isModuleNavigable(mod)) continue
            total++
            if (isCompleted(mod)) completed++
        }
    }
    return {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
}

function flattenModules(sections: HydratedMoodleSection[]): HydratedMoodleModule[] {
    const result: HydratedMoodleModule[] = []
    for (const section of sections) {
        for (const mod of section.modules) {
            if (isModuleNavigable(mod)) result.push(mod)
        }
    }
    return result
}

// ── Provider ───────────────────────────────────────────────────────────────────

/**
 * CourseDataProvider
 *
 * Cache strategy:
 * - Fetch once into context on mount (via the track page or reader page).
 * - Optimistic mutations update context state directly — no refetch.
 * - No refetch on route change within the same course.
 * - Revalidate on hard error (e.g. 401) triggers a fresh fetch.
 * - Hard refresh on a deep URL triggers a fresh fetch from the route's useEffect.
 */
export function CourseDataProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<CourseDataState>({
        course: null,
        sections: [],
        completion: { total: 0, completed: 0, percentage: 0 },
        loading: false,
        error: null,
    })

    const [isHydrated, setIsHydrated] = useState(false)
    const loadedCourseIdRef = useRef<number | null>(null)

    const fetchTrackData = useCallback(async (courseId: number) => {
        // Don't re-fetch if we already have data for this course
        if (loadedCourseIdRef.current === courseId && isHydrated && !state.error) {
            return
        }

        setState((prev) => ({ ...prev, loading: true, error: null }))

        try {
            const res = await fetch(`/api/courses/${courseId}/track`, { cache: 'no-store' })

            if (res.status === 401) {
                // Redirect happens in the page component
                setState((prev) => ({ ...prev, loading: false, error: 'Not authenticated.' }))
                return
            }

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error ?? 'Failed to load course.')
            }

            loadedCourseIdRef.current = courseId
            setState({
                course: data.course,
                sections: data.sections,
                completion: data.completion,
                loading: false,
                error: null,
            })
            setIsHydrated(true)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error.'
            setState((prev) => ({ ...prev, loading: false, error: message }))
            setIsHydrated(true) // Mark as hydrated even on error so we don't infinite loop
        }
    }, [isHydrated, state.error])

    const toggleCompletion = useCallback(async (cmid: number, courseId: number) => {
        // Find the module in sections
        let targetMod: HydratedMoodleModule | null = null
        for (const section of state.sections) {
            for (const mod of section.modules) {
                if (mod.id === cmid) {
                    targetMod = mod
                    break
                }
            }
            if (targetMod) break
        }

        if (!targetMod) return

        // Check if manual completion is allowed
        if (!targetMod.completiondata?.hascompletion) return
        if (targetMod.completiondata.isautomatic) return

        const wasCompleted = isCompleted(targetMod)
        const newState = wasCompleted ? 0 : 1

        // Optimistic update
        setState((prev) => {
            const newSections = prev.sections.map((section) => ({
                ...section,
                modules: section.modules.map((mod) => {
                    if (mod.id !== cmid) return mod
                    return {
                        ...mod,
                        completiondata: {
                            ...mod.completiondata!,
                            state: newState,
                            timecompleted: newState >= 1 ? Math.floor(Date.now() / 1000) : 0,
                        },
                    }
                }),
            }))

            return {
                ...prev,
                sections: newSections,
                completion: computeCompletion(newSections),
            }
        })

        // API call
        try {
            const res = await fetch(`/api/courses/${courseId}/completion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cmid, completed: !wasCompleted }),
            })

            if (!res.ok) {
                throw new Error('Failed to update completion.')
            }
        } catch {
            // Rollback
            setState((prev) => {
                const rolledBackSections = prev.sections.map((section) => ({
                    ...section,
                    modules: section.modules.map((mod) => {
                        if (mod.id !== cmid) return mod
                        return {
                            ...mod,
                            completiondata: {
                                ...mod.completiondata!,
                                state: wasCompleted ? 1 : 0,
                                timecompleted: wasCompleted
                                    ? mod.completiondata!.timecompleted
                                    : 0,
                            },
                        }
                    }),
                }))

                return {
                    ...prev,
                    sections: rolledBackSections,
                    completion: computeCompletion(rolledBackSections),
                }
            })

            toast.error('Failed to update completion', {
                description: 'Please try again.',
            })
        }
    }, [state.sections])

    const flatModules = useMemo(() => flattenModules(state.sections), [state.sections])

    const value: CourseDataContextValue = useMemo(() => ({
        ...state,
        fetchTrackData,
        toggleCompletion,
        flatModules,
        isHydrated,
    }), [state, fetchTrackData, toggleCompletion, flatModules, isHydrated])

    return (
        <CourseDataContext.Provider value={value}>
            {children}
        </CourseDataContext.Provider>
    )
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useCourseData(): CourseDataContextValue {
    const ctx = useContext(CourseDataContext)
    if (!ctx) {
        throw new Error('useCourseData must be used within a CourseDataProvider')
    }
    return ctx
}
