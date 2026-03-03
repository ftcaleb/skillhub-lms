"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ReadingActivity } from "@/lib/types"

interface ReadingContentProps {
  activity: ReadingActivity
  isCompleted: boolean
  onMarkComplete: () => void
}

function parseMarkdown(content: string): string {
  let html = content
  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold text-foreground mt-6 mb-2">$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold text-foreground mt-8 mb-3">$1</h2>')
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  // Blockquote
  html = html.replace(
    /^> (.*$)/gm,
    '<blockquote class="border-l-2 border-primary pl-4 py-1 my-4 text-muted-foreground italic">$1</blockquote>'
  )
  // Unordered list items
  html = html.replace(/^- (.*$)/gm, '<li class="ml-4 text-muted-foreground leading-relaxed list-disc">$1</li>')
  // Table rows (simple)
  html = html.replace(/^\| (.*) \|$/gm, (match, content) => {
    const cells = content.split(" | ")
    const isHeader = cells.every((c: string) => c.trim().match(/^-+$/))
    if (isHeader) return ""
    const tag = "td"
    const cellHtml = cells.map((c: string) => `<${tag} class="px-3 py-2 text-xs text-muted-foreground border-b border-border">${c.trim()}</${tag}>`).join("")
    return `<tr>${cellHtml}</tr>`
  })
  // Wrap table rows in table
  html = html.replace(/((?:<tr>.*<\/tr>\n?)+)/g, '<div class="overflow-x-auto my-4"><table class="w-full border border-border rounded-lg text-left">$1</table></div>')
  // Newlines to paragraphs (simple approach)
  html = html.replace(/\n\n/g, '</p><p class="text-sm leading-relaxed text-muted-foreground mb-3">')
  html = html.replace(/\n/g, "<br/>")
  html = `<p class="text-sm leading-relaxed text-muted-foreground mb-3">${html}</p>`
  return html
}

export function ReadingContent({ activity, isCompleted, onMarkComplete }: ReadingContentProps) {
  const [showAll, setShowAll] = useState(false)
  const htmlContent = parseMarkdown(activity.content)

  // Split content for "show more" on long readings
  const isLong = activity.content.length > 1500
  const displayContent = isLong && !showAll ? parseMarkdown(activity.content.slice(0, 1500) + "...") : htmlContent

  return (
    <div className="flex flex-col gap-5">
      {/* Reading panel */}
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <article
          className="prose-custom max-w-none"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />

        {isLong && !showAll && (
          <div className="relative mt-2">
            <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80"
              onClick={() => setShowAll(true)}
            >
              <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
              Read more
            </Button>
          </div>
        )}
      </div>

      {/* Mark complete */}
      {!isCompleted && (
        <Button
          className="w-fit bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onMarkComplete}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark as Complete
        </Button>
      )}
    </div>
  )
}
