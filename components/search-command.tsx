'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from '@/components/ui/command'
import { BookOpen, Loader2 } from 'lucide-react'

interface SearchItem {
    type: 'course'
    courseId: number
    title: string
}

export function SearchCommand() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [items, setItems] = useState<SearchItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    // keyboard shortcut handler (Ctrl+K or ⌘K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((prev) => !prev)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    // custom trigger handler for header search magnifier button clicks
    useEffect(() => {
        const handleOpenSearch = () => {
            setOpen(true)
        }
        window.addEventListener('open-search', handleOpenSearch)
        return () => window.removeEventListener('open-search', handleOpenSearch)
    }, [])

    // data fetch trigger on transition to open, query cleanup on close
    useEffect(() => {
        if (open) {
            setQuery('')
            setError(false)
            setLoading(true)
            setItems([])

            fetch('/api/search/index')
                .then((res) => {
                    if (!res.ok) throw new Error()
                    return res.json()
                })
                .then((data) => {
                    setItems(data.items ?? [])
                    setLoading(false)
                })
                .catch(() => {
                    setError(true)
                    setLoading(false)
                })
        } else {
            setQuery('')
        }
    }, [open])

    const handleSelect = (item: SearchItem) => {
        setOpen(false)
        setQuery('')
        router.push(`/dashboard/courses/${item.courseId}`)
    }

    const showResults = query.trim().length >= 2

    return (
        <CommandDialog
            open={open}
            onOpenChange={setOpen}
            className="bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)]"
            showCloseButton={false}
        >
            <div className="px-2 pt-2">
                <CommandInput
                    placeholder="Search courses..."
                    value={query}
                    onValueChange={setQuery}
                    className="border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-0 focus:outline-hidden"
                />
            </div>
            <CommandList className="border-t border-[var(--border-subtle)] px-2 pb-3 max-h-80 overflow-y-auto">
                {!showResults ? (
                    <div className="py-6 text-center text-sm text-[var(--text-muted)]">
                        Type to search your courses…
                    </div>
                ) : (
                    <>
                        {loading && (
                            <CommandGroup heading="Loading index...">
                                {[1, 2, 3].map((i) => (
                                    <CommandItem key={i} disabled className="opacity-50 pointer-events-none flex items-center gap-2 rounded-lg px-3 py-3">
                                        <Loader2 className="h-4 w-4 animate-spin shrink-0 text-[var(--glow-primary)]" />
                                        <div className="h-4 w-40 bg-[var(--bg-elevated)] rounded animate-pulse" />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {error && (
                            <CommandGroup heading="Error">
                                <CommandItem disabled className="text-destructive pointer-events-none rounded-lg px-3 py-3">
                                    Search unavailable — try again
                                </CommandItem>
                            </CommandGroup>
                        )}

                        {!loading && !error && (
                            <>
                                <CommandEmpty>No results.</CommandEmpty>

                                {items.length > 0 && (
                                    <CommandGroup heading="Courses">
                                        {items.map((course) => (
                                            <CommandItem
                                                key={`course-${course.courseId}`}
                                                value={course.title}
                                                onSelect={() => handleSelect(course)}
                                                className="flex items-center gap-2 rounded-lg px-3 py-3 cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                                            >
                                                <BookOpen className="h-4 w-4 shrink-0 text-[var(--glow-primary)]" />
                                                <span className="text-sm font-medium truncate">{course.title}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </>
                        )}
                    </>
                )}
            </CommandList>
        </CommandDialog>
    )
}
