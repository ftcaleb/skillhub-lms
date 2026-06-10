# Design Notes — SkillHub LMS Course Experience

This document details the design system extensions, motion guidelines, and interaction patterns implemented for the new two-level Course Track & Material Reader layout.

---

## 1. CSS Design Tokens

The styling for the new experience leverages existing root custom properties and introduces scoped tokens for clarity, layout-spacing consistency, and animations.

```css
/* Scoped custom variables appended to app/globals.css */

/* ── Course Track tokens ──────────────────────────── */
--track-level-bg:     rgba(14, 165, 233, 0.06);
--track-level-border: rgba(14, 165, 233, 0.12);
--track-upnext-bg:    rgba(249, 115, 22, 0.06);
--track-upnext-border:rgba(249, 115, 22, 0.18);
--track-upnext-text:  var(--glow-accent);

/* ── Reader prose tokens ─────────────────────────── */
--prose-body:         var(--text-secondary);
--prose-heading:      var(--text-primary);
--prose-link:         var(--glow-primary);
--prose-code-bg:      var(--bg-elevated);
--prose-blockquote:   var(--border-glow);
--prose-measure:      70ch;

/* ── Completion states ───────────────────────────── */
--completion-done:    var(--glow-green);
--completion-pending: var(--text-muted);

/* ── Motion tokens ───────────────────────────────── */
--duration-fast:      150ms;
--duration-normal:    200ms;
--duration-slow:      300ms;
--spring-bounce:      0.15;
```

---

## 2. Typography & Layout Systems

### Display vs. Body Fonts
- **Sora (Display)**: Used for high-impact display text, including the Course Header Title (Sora Extra Bold, `clamp(1.75rem, 4vw, 2.5rem)`), Level Card headers, and quiz titles.
- **DM Sans (Body)**: Used for descriptions, prose, details, and normal UI copy (`text-sm`, `leading-relaxed`).
- **JetBrains Mono (Monospace/Labels)**: Used for metadata tags, course code badges (`shortname`), and count-up percentage readouts.

### Reading Prose (`.reader-prose`)
For long-form educational content rendered from Moodle (`mod_page`), we restrict the readable width to a comfortable measure (`--prose-measure: 70ch` / ~670px) and use a generous line-height (`1.75`) to optimize reading comfort:
- **Heading spacing**: Generous margin-top and margin-bottom to indicate sections clearly.
- **Lists & nested markers**: Custom markers colored with `--glow-primary` to make formatting look premium and integrated.
- **Code snippets**: Rounded inlines styled with `var(--bg-elevated)` + thin border.
- **Images/Iframes**: Render block-level with maximum-width limits and rounded corners.

---

## 3. Motion & Micro-Animations

All Framer Motion elements respect the user's OS preference via the `useReducedMotion` hook.

### Key Motion Elements:
1. **Collapsible Section Height**:
   Uses Framer Motion `AnimatePresence` with `height: auto` on toggle, utilizing a spring curve with low bounce (`--spring-bounce: 0.15`).
2. **Progress Bar Fill**:
   The track overall progress bar uses spring animation on width changes.
3. **Completion Pop**:
   Clicking "Mark Done" triggers a brief scale spring scaling from `0.8` to `1` combined with an opacity fade.
4. **Reduced Motion Fallback**:
   When `prefers-reduced-motion` is detected:
   - Spring curves are swapped for instant `duration: 0` transitions.
   - Scale animations on completion are omitted.
   - Scrolling becomes `behavior: auto` (instant jump rather than smooth scroll).

---

## 4. Interaction Patterns & Component Architectures

### Two-Level Structure
- **Level 1 (Track Page)**:
  Overview of course levels (sections) represented by collapsible cards. The first incomplete section is automatically expanded, while others remain collapsed to minimize cognitive overload.
- **Level 2 (Material Reader)**:
  Dedicated content workspace with page navigation and a sticky right-sidebar roadmap. The roadmap sidebar provides high-fidelity, independent-scrolling progression indicators for the current section modules.

### Optimistic Mutations & Context Caching
- **Context Cache**: The course sections, modules, and completion percentages are cached in `CourseDataContext`. Navigating between track and reader does not re-fetch.
- **Optimistic completion toggle**: Clicking "Mark Done" (on manual modules) updates the state immediately and kicks off a backend `POST`. On failure, the changes are rolled back, and an error toast is fired using Sonner's toast manager.
- **Single Source of Truth**: Completion is derived exclusively from the module's `completiondata` payload in `core_course_get_contents`.

### Keyboard Accessibility
- **Level Cards**: Focusable headers with `aria-expanded` and keyboard toggle support.
- **Keyboard navigation**: In the reader page, users can navigate to the previous or next module using the `ArrowLeft` and `ArrowRight` keys (automatically ignored when input fields, select boxes, or editable areas are focused).
- **Semantics**: Layout outlines use HTML5 elements (`<nav>`, `<main>`, `<aside>`) with appropriate ARIA roles.
