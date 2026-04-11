// ──────────────────────────────────────────────────────────────────────────────
// Quiz Question Parser — lib/quiz-question-parser.ts
//
// Parses Moodle's rendered question HTML into structured data that can be
// rendered with our custom UI instead of dumping raw HTML.
//
// Moodle renders each question as a `.que` div with type-specific markup.
// We parse the HTML using regex (safe here because the input is DOMPurify'd
// and we're running on the server/client where no DOM parsing overhead matters).
// ──────────────────────────────────────────────────────────────────────────────

export interface ParsedOption {
  value: string
  label: string
  letter: string // a, b, c, d...
  checked: boolean
}

export interface ParsedQuestion {
  slot: number
  type: string
  number: number
  questionText: string
  options: ParsedOption[]
  inputName: string        // The form input name for submitting answers
  sequenceCheckName: string
  sequenceCheckValue: string
  selectedValue: string | null
  flagged: boolean
  status: string
  maxMark: number
  rawHtml: string          // Fallback: original HTML if parsing fails
  parsed: boolean          // Whether we successfully parsed the question
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

/**
 * Parse a Moodle question HTML blob into structured data.
 * 
 * Moodle question HTML structure (multichoice example):
 * <div class="qtext">Question text here</div>
 * <div class="ablock">
 *   <div class="answer">
 *     <div><input type="radio" name="q123:1_answer" value="0"> <label>Option A</label></div>
 *     <div><input type="radio" name="q123:1_answer" value="1"> <label>Option B</label></div>
 *   </div>
 * </div>
 * <input type="hidden" name="q123:1_:sequencecheck" value="1">
 */
export function parseQuestionHtml(
  html: string,
  slot: number,
  type: string,
  number: number,
  flagged: boolean,
  status: string,
): ParsedQuestion {
  const result: ParsedQuestion = {
    slot,
    type,
    number,
    questionText: '',
    options: [],
    inputName: '',
    sequenceCheckName: '',
    sequenceCheckValue: '',
    selectedValue: null,
    flagged,
    status,
    maxMark: 1,
    rawHtml: html,
    parsed: false,
  }

  try {
    // Extract question text from .qtext div
    const qtextMatch = html.match(/<div[^>]*class="[^"]*qtext[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    if (qtextMatch) {
      result.questionText = qtextMatch[1].trim()
    }

    // Extract max mark
    const markMatch = html.match(/Marked out of\s*([\d.]+)/i)
    if (markMatch) {
      result.maxMark = parseFloat(markMatch[1])
    }

    // Extract sequence check hidden input
    const seqMatch = html.match(
      /<input[^>]*name="([^"]*:sequencecheck)"[^>]*value="([^"]*)"[^>]*>/i
    )
    if (seqMatch) {
      result.sequenceCheckName = seqMatch[1]
      result.sequenceCheckValue = seqMatch[2]
    }

    // Parse based on question type
    if (type === 'multichoice' || type === 'truefalse') {
      // Try DOM parsing first (in browser) for robust extraction
      let parsedOptions: ParsedOption[] = []
      let inputName = ''
      let selectedValue: string | null = null

      if (typeof DOMParser !== 'undefined') {
        try {
          const doc = new DOMParser().parseFromString(html, 'text/html')

          // Extract question text from qtext if not already set
          const qtextEl = doc.querySelector('.qtext')
          if (qtextEl) {
            const text = qtextEl.innerHTML.trim()
            if (text) result.questionText = text
          }

          // Extract sequence check hidden input if missing
          if (!result.sequenceCheckName) {
            const seqEl = doc.querySelector('input[name$=":sequencecheck"]')
            if (seqEl instanceof HTMLInputElement) {
              result.sequenceCheckName = seqEl.name
              result.sequenceCheckValue = seqEl.value
            }
          }

          const answerInputs = Array.from(
            doc.querySelectorAll('input[type="radio"], input[type="checkbox"]'),
          )

          let optionIndex = 0
          for (const input of answerInputs) {
            const inputEl = input as HTMLInputElement
            const name = inputEl.name || inputEl.getAttribute('name')
            const value = inputEl.value || inputEl.getAttribute('value')
            if (!name || value === null) continue

            // Skip hidden sequencecheck / flag inputs
            if (name.endsWith(':sequencecheck') || name.endsWith(':flagged') || name.includes('_:flagged')) continue

            if (!inputName) inputName = name
            const checked = inputEl.checked

            // Determine label text by aria-labelledby or nearby answer label
            let labelText = ''
            const labelledBy = input.getAttribute('aria-labelledby')
            if (labelledBy) {
              const labelEl = doc.getElementById(labelledBy)
              if (labelEl) {
                labelText = labelEl.textContent?.trim() ?? ''
              }
            }

            if (!labelText) {
              // Find nearby answer text within common Moodle answer wrappers
              const answerWrapper = input.closest('.r0, .r1, .answer')
              if (answerWrapper) {
                const labelEl = answerWrapper.querySelector('.answer, [data-region="answer-label"], label')
                if (labelEl) {
                  labelText = labelEl.textContent?.trim() ?? ''
                }
              }
            }

            if (!labelText) {
              // Fallback: text nodes after input
              const nextText = input.nextElementSibling?.textContent?.trim()
              if (nextText) labelText = nextText
            }

            if (!labelText) labelText = `Option ${optionIndex + 1}`

            parsedOptions.push({
              value,
              label: labelText.replace(/\s+/g, ' ').trim(),
              letter: LETTERS[optionIndex] ?? String(optionIndex + 1),
              checked,
            })

            if (checked) selectedValue = value
            optionIndex++
          }

          if (parsedOptions.length > 0) {
            result.options = parsedOptions
            result.inputName = inputName
            result.selectedValue = selectedValue
            result.parsed = true
          }
        } catch {
          // DOMParser may fail in non-browser contexts; fallback to regex below
        }
      }

      // Fallback to regex parser for environments without DOMParser or if DOM parsing failed
      if (!result.parsed) {
        const answerBlockMatch = html.match(
          /<div[^>]*class="[^"]*answer[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        )
        const answerHtml = answerBlockMatch ? answerBlockMatch[1] : html

        const inputRegex = /<input[^>]*type="(?:radio|checkbox)"[^>]*name="([^"]*)"[^>]*value="([^"]*)"([^>]*)>/gi
        let inputM
        let idx = 0
        while ((inputM = inputRegex.exec(answerHtml)) !== null) {
          const name = inputM[1]
          const value = inputM[2]
          const attrs = inputM[3]
          if (!result.inputName) result.inputName = name
          const checked = attrs.includes('checked')
          result.options.push({
            value,
            label: `Option ${idx + 1}`,
            letter: LETTERS[idx] ?? String(idx + 1),
            checked,
          })
          if (checked) result.selectedValue = value
          idx++
        }

        if (result.options.length > 0) {
          result.parsed = true
        }
      }
    } else if (type === 'shortanswer' || type === 'numerical') {
      // Extract text input
      const inputMatch = html.match(
        /<input[^>]*type="text"[^>]*name="([^"]*)"[^>]*value="([^"]*)"[^>]*>/i
      )
      if (inputMatch) {
        result.inputName = inputMatch[1]
        result.selectedValue = inputMatch[2] || null
        result.parsed = true
      }
    } else if (type === 'essay') {
      // Extract textarea
      const textareaMatch = html.match(
        /<textarea[^>]*name="([^"]*)"[^>]*>([\s\S]*?)<\/textarea>/i
      )
      if (textareaMatch) {
        result.inputName = textareaMatch[1]
        result.selectedValue = textareaMatch[2].trim() || null
        result.parsed = true
      }
    } else if (type === 'match') {
      // Match questions have select dropdowns — fall back to raw HTML
      // since these are complex to parse and render
      result.parsed = false
    }

    // If we got question text but no parsed options, still mark as partially parsed
    if (result.questionText && !result.parsed && (type === 'multichoice' || type === 'truefalse')) {
      // Try alternate parsing: look for answer divs directly
      const altRegex = /<div[^>]*class="[^"]*r\d+[^"]*"[^>]*>[\s\S]*?<input[^>]*name="([^"]*)"[^>]*value="([^"]*)"([^>]*)>[\s\S]*?<label[^>]*>([\s\S]*?)<\/label>/gi
      let altMatch
      let idx = 0
      while ((altMatch = altRegex.exec(html)) !== null) {
        if (!result.inputName) result.inputName = altMatch[1]
        const checked = altMatch[3].includes('checked')
        const text = altMatch[4].replace(/<[^>]*>/g, '').trim()
        result.options.push({
          value: altMatch[2],
          label: text || `Option ${idx + 1}`,
          letter: LETTERS[idx] ?? String(idx + 1),
          checked,
        })
        if (checked) result.selectedValue = altMatch[2]
        idx++
      }
      if (idx > 0) result.parsed = true
    }

    // Filter out "clear choice" options that Moodle sometimes injects into the HTML
    result.options = result.options.filter(opt =>
      !opt.label.toLowerCase().includes('clear my choice') &&
      !opt.label.toLowerCase().includes('clear choice')
    )
  } catch {
    // If parsing fails, fall back to raw HTML
    result.parsed = false
  }

  return result
}

/**
 * Parse all questions from a Moodle quiz attempt page.
 */
export function parseQuizQuestions(
  questions: Array<{
    slot: number
    type: string
    number: number
    html: string
    flagged: boolean
    status: string
  }>,
): ParsedQuestion[] {
  return questions.map((q) =>
    parseQuestionHtml(q.html, q.slot, q.type, q.number, q.flagged, q.status),
  )
}
