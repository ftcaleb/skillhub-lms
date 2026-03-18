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
      // Extract radio/checkbox inputs and their labels
      // Look for any div that contains "answer" in its class
      const answerBlockMatch = html.match(
        /<div[^>]*class="[^"]*answer[^"]*"[^>]*>([\s\S]*?)<\/div>/i
      )
      const answerHtml = answerBlockMatch ? answerBlockMatch[1] : html

      // Match individual options
      // 1. Look for <div class="r0"> or <div class="r1"> which usually wraps an option
      const optionBlockRegex = /<div[^>]*class="[^"]*r[01][^"]*"[^>]*>([\s\S]*?)<\/div>/gi
      let optionMatch
      let idx = 0

      while ((optionMatch = optionBlockRegex.exec(answerHtml)) !== null) {
        const blockHtml = optionMatch[1]
        const inputMatch = blockHtml.match(/<input[^>]*type="(?:radio|checkbox)"[^>]*name="([^"]*)"[^>]*value="([^"]*)"([^>]*)>/i)
        const labelMatch = blockHtml.match(/<label[^>]*>([\s\S]*?)<\/label>/i)

        if (inputMatch) {
          if (!result.inputName) result.inputName = inputMatch[1]
          
          const checked = inputMatch[3].includes('checked')
          // Strip inner tags from label, but keep content
          const labelText = labelMatch ? labelMatch[1].replace(/<[^>]*>/g, '').trim() : `Option ${idx + 1}`
          
          result.options.push({
            value: inputMatch[2],
            label: labelText,
            letter: LETTERS[idx] ?? String(idx + 1),
            checked,
          })

          if (checked) result.selectedValue = inputMatch[2]
          idx++
        }
      }

      // If that failed, fall back to the old aggressive regex
      if (result.options.length === 0) {
        const inputRegex = /<input[^>]*type="(?:radio|checkbox)"[^>]*name="([^"]*)"[^>]*value="([^"]*)"([^>]*)>/gi
        let inputM
        while ((inputM = inputRegex.exec(answerHtml)) !== null) {
          if (!result.inputName) result.inputName = inputM[1]
          const isChecked = inputM[3].includes('checked')
          result.options.push({
            value: inputM[2],
            label: `Option ${result.options.length + 1}`,
            letter: LETTERS[result.options.length] ?? String(result.options.length + 1),
            checked: isChecked,
          })
          if (isChecked) result.selectedValue = inputM[2]
        }
      }

      if (result.options.length > 0) result.parsed = true
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
