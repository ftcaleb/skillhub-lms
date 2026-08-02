# Handoff Notes — 2026-08-02

Session covering the quiz UI responsiveness fix and a set of build/environment
problems uncovered along the way. Read the **Open Items** section first if you
are picking this up cold.

Commits: `68c4226` (quiz), `c1fcd67` (build config). Both merged to `main` and
pushed to `origin`.

---

## 1. Quiz UI — clamped layout (FIXED)

### Symptom

In the material reader, the in-progress quiz was squeezed into roughly a 160px
answer column. Every option wrapped to three lines, tap targets were unusable,
and the quiz got **worse** on large monitors rather than better.

### Root cause

Three width clamps compounded on the same element:

| # | Location | Clamp |
|---|---|---|
| 1 | `components/course/material-reader-view.tsx` | `max-w-[72ch]` prose measure on the reader content body |
| 2 | `components/course/reader-content.tsx` | `max-w-2xl` (672px) on the quiz wrapper |
| 3 | `components/course/quiz-content.tsx` | `lg:grid-cols-[200px_1fr_240px]` + `gap-5` — 480px of fixed rails inside ~640px |

```
reader shell 1280 -> main col 808 -> card padding -96 -> 712
  -> max-w-[72ch]                                     -> ~660
  -> max-w-2xl                                        -> ~660
  -> 200px + 240px rails + 40px gaps                  -> answer column ~160px
```

The underlying design flaw was using **viewport** breakpoints for a component
living inside a much narrower **container**. `lg:` fires at 1024px of screen
while the runner sat in a 672px box, so the 3-column grid was forced into a
space that could never hold it.

### Fix

Rebuilt the runner on **CSS container queries** so it responds to its own
inline width in any host surface (reader ~808px, module renderer ~600px, or
full-page).

- `.quiz-runner` declares `container-type: inline-size` / `container-name: quiz`
- Layout switches to two columns at `@container quiz (min-width: 720px)`
- The fixed 200px meta rail is gone — its content (question no., status, marks,
  flag) is now a wrapping chip strip in the question header
- 72ch reading measure now applies **only to prose modules**; quiz modules use
  the full surface and a wider 1440px reader shell
- One shared timer ticker (`useQuizTimer`) feeds both the header chip (narrow)
  and the rail card (wide); exactly one is visible at a time

**Answer column at 1440px+: ~160px → 552px.**

### Also fixed in the same pass

- **Duplicated option letters.** Moodle injects
  `<span class="answernumber">a. </span>` into every label, so the UI rendered
  `a │ a. A method of…`. `stripAnswerNumber()` in
  `lib/quiz-question-parser.ts` removes it, matched against the expected letter
  so genuine content like "b. tree is the answer" survives.
- **Submit modal was `absolute inset-0`** — only covered the quiz box, so on a
  scrolled page it could land off-screen. Now portaled to `document.body`.
  This became load-bearing: `container-type` implies `contain: layout`, which
  makes the runner a containing block for fixed descendants, so an in-tree
  overlay would have been trapped inside it.
- Submit button was `bg-red-600` (red reads as destructive) → success token.
- Accessibility/polish: `role="radiogroup"`, `focus-visible` rings, 56px option
  rows, `overflow-wrap` so long options never overflow, arrow-key question
  paging, real progress meter, `prefers-reduced-motion` handling, labelled
  short-answer/essay inputs.

### Files touched

- `app/globals.css` — quiz runner CSS system (container queries, chips, options, navigator, progress)
- `components/course/quiz-content.tsx` — layout rebuild, timer hook, portal modal
- `components/course/material-reader-view.tsx` — conditional measure + wider shell for quiz
- `components/course/reader-content.tsx` — removed `max-w-2xl`
- `lib/quiz-question-parser.ts` — `stripAnswerNumber()`

### Verified

- `tsc --noEmit` clean project-wide
- `globals.css` compiles through the real Tailwind v4 PostCSS pipeline, container query intact
- Confirmed visually in-app before merge

---

## 2. `Module not found: @react-three/fiber` (FIXED)

Not a code bug. Commit `9b2b77a` ("updated bg, and profile view") added
`three`, `@react-three/fiber`, `@types/three` to `package.json` and
`package-lock.json`, but `npm install` was never run afterwards.

- committed lockfile declared **312** packages
- installed tree had **243**, with zero three-related entries

`ParticleField.tsx` imports them and sits on the critical path
(`app/dashboard/layout.tsx` → `dashboard-shell.tsx` → `ParticleField`), so
every dashboard page failed to build.

Fixed by `npm install` (added 30, changed 59). The 51 packages still not
installed are all platform-gated optional binaries for other OSes — verified
zero genuinely missing.

---

## 3. Turbopack rooting at the home directory (FIXED)

Error paths read `./OneDrive/Documents/GitHub/skillhub-lms/...` — relative to
`C:\Users\brend`, not the project. Turbopack infers the workspace root by
walking up for lockfiles and found a stray npm project in the user profile:

```
C:\Users\brend\package.json          <- name: "brend", 12 packages
C:\Users\brend\package-lock.json
C:\Users\brend\node_modules\         <- @reduxjs, react-redux, redux, and react
```

A second copy of React on the resolution path is a classic source of "invalid
hook call" and broken context — this was a live landmine independent of the
missing deps.

Fixed by pinning `turbopack.root` in `next.config.mjs`. Side benefit: dev
startup went from ~20s to ~3s, since it no longer scans from the profile dir.

---

## 4. OneDrive corrupts the Turbopack cache (NOT FIXED — see Open Items)

### Symptom

`An unexpected Turbopack error occurred. Please see the output of next dev`

### Cause

The repo lives at `C:\Users\brend\OneDrive\Documents\GitHub\skillhub-lms`, so
OneDrive syncs `.next` — a multi-GB tree (1.3 GB / 2,779 files when measured)
that Turbopack rewrites continuously. OneDrive locks, replaces and dehydrates
those files mid-write, corrupting the persistent cache.

Evidence:

```
.next attributes : ReadOnly, Directory, Archive, ReparsePoint
ReparsePoint     : True          <- OneDrive Files-On-Demand placeholder
OneDrive process : running
```

### Workarounds tested — BOTH FAIL, do not retry

1. **`distDir` outside the project.** Rejected outright by Turbopack's Rust
   core (the JS-side config validation only checks type/`public`/empty, so it
   looks viable until you start the server):
   ```
   Invalid distDirRoot: "../../../../.next-cache/skillhub-lms".
   distDirRoot should not navigate out of the projectPath.
   ```
2. **`.next` as a directory junction.** Next starts fine, then every route
   500s. Node resolves generated chunks from the junction's *real* path and
   walks up `C:\Users\brend\` looking for `node_modules/next`:
   ```
   Failed to load external module next/dist/server/app-render/work-async-storage.external.js
     at C:\Users\brend\.next-cache\skillhub-lms\dev\server\chunks\ssr\[externals]__*.js
   ```

Both dead ends are documented in `next.config.mjs` so nobody re-attempts them.

### Stopgap

```powershell
# Ctrl+C the dev server first
Remove-Item -Recurse -Force .next
npm run dev
```

Note: strip the OneDrive ReadOnly attribute first if deletion stalls part-way —
`attrib -R .next /S /D`.

---

## Open Items

### A. Move the repo off OneDrive — the real fix for §4

Everything is pushed, so this is safe to do now.

```powershell
mkdir C:\dev
cd C:\dev
git clone https://github.com/ftcaleb/skillhub-lms.git
cd skillhub-lms
npm install
```

Env files are git-ignored, so copy them across:

```powershell
copy "C:\Users\brend\OneDrive\Documents\GitHub\skillhub-lms\.env.local" .
copy "C:\Users\brend\OneDrive\Documents\GitHub\skillhub-lms\.env" .
npm run dev
```

Confirm it runs from `C:\dev\skillhub-lms`, **then** delete the OneDrive copy.
Expect a slow first `npm install` and cold compile; after that it should be
faster than it is today, since Turbopack writes no longer pass through
OneDrive's sync filter driver.

Unverified alternative: OneDrive's "Choose folders" selective sync *might* be
able to exclude `.next`, but it was not confirmed whether the exclusion
survives `.next` being deleted and recreated on every build.

### B. Delete the stray home-directory npm project

`C:\Users\brend\package.json`, `package-lock.json`, `node_modules`. Someone ran
`npm install @reduxjs/toolkit react-redux` from the home directory on
2026-07-14. `turbopack.root` neutralises it for this project, but it will
confuse any other tool run from there. Safe to delete.

### C. Pick one package manager

`package-lock.json` **and** `pnpm-lock.yaml` are both committed, plus
`pnpm-workspace.yaml`. `node_modules` carries npm's `.package-lock.json` marker
*and* a leftover pnpm `.pnpm` store — the tree was installed by both at
different times, which is how it drifted 30 packages behind and caused §2.

npm is what is actually in use. Removing `pnpm-lock.yaml` and
`pnpm-workspace.yaml` would prevent a repeat. Not done — tracked files, needs
a decision.

### D. `tsconfig.tsbuildinfo` is tracked

It is a regenerated build artifact and shows as permanently dirty. Consider
`git rm --cached tsconfig.tsbuildinfo` and adding it to `.gitignore`.

---

## Quick reference

```powershell
npm run dev                              # dev server, port 3000
npx tsc --noEmit                         # type-check (currently clean)
Remove-Item -Recurse -Force .next        # clear corrupted Turbopack cache
```

Quiz layout breakpoint: the runner switches between one and two columns at a
**container** width of 720px — not a viewport width. In the reader that
corresponds to roughly an 1100px window. Resize past it and the clock should
move between the header chip strip and the side rail.
