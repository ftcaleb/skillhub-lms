/**
 * Test quiz attempt API functions against live Moodle instance.
 * 
 * Run: npx ts-node --project tsconfig.json scripts/test-quiz-api.ts
 * 
 * This script verifies that:
 * - startQuizAttempt returns the correct attempt object
 * - getAttemptData returns questions with all required fields
 * - processAttempt correctly submits answers
 */

import moodleService from '../lib/moodle/service'

async function main() {
    try {
        // ── Step 1: Login ─────────────────────────────────────────────────────
        console.log('\n=== STEP 1: LOGIN ===')
        const token = await moodleService.login('Boikanyo', 'Calebmokoka@2005')
        console.log(`✓ Token obtained (length: ${token.length})`)

        // ── Step 2: Get site info ─────────────────────────────────────────────
        console.log('\n=== STEP 2: GET SITE INFO ===')
        const siteInfo = await moodleService.getSiteInfo(token)
        console.log(`✓ User: ${siteInfo.fullname} (ID: ${siteInfo.userid})`)

        // ── Step 3: Get enrolled courses ──────────────────────────────────────
        console.log('\n=== STEP 3: GET ENROLLED COURSES ===')
        const courses = await moodleService.getUserCourses(token, siteInfo.userid)
        console.log(`✓ Found ${courses.length} course(s)`)
        courses.forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.fullname} (ID: ${c.id})`)
        })

        if (courses.length === 0) {
            console.log('❌ No courses found. Cannot test quiz API.')
            return
        }

        // ── Step 4: Get quizzes from first course ────────────────────────────
        console.log('\n=== STEP 4: GET QUIZZES FROM COURSE ===')
        const courseId = courses[0].id
        const quizzes = await moodleService.getQuizzesByCourseId(token, courseId)
        console.log(`✓ Found ${quizzes.length} quiz(zes) in course "${courses[0].fullname}"`)

        if (quizzes.length === 0) {
            console.log('❌ No quizzes found. Cannot test quiz attempt API.')
            return
        }

        quizzes.forEach((q, i) => {
            console.log(`  ${i + 1}. ${q.name} (ID: ${q.id}, instance: ${q.coursemodule})`)
        })

        // ── Step 5: Start a quiz attempt ─────────────────────────────────────
        console.log('\n=== STEP 5: START QUIZ ATTEMPT ===')
        const quizId = quizzes[0].id
        const startResponse = await moodleService.startQuizAttempt(token, quizId, 0)
        console.log(`✓ Started attempt`)
        console.log('Raw Response (for field validation):')
        console.log(JSON.stringify(startResponse, null, 2))

        const attemptId = startResponse.attempt.id
        console.log(`\nAttempt ID: ${attemptId}`)

        // ── Step 6: Get attempt data (page 0) ────────────────────────────────
        console.log('\n=== STEP 6: GET ATTEMPT DATA ===')
        const attemptData = await moodleService.getAttemptData(token, attemptId, 0)
        console.log(`✓ Fetched page 0 data`)
        console.log(`Attempt state: ${attemptData.attempt.state}`)
        console.log(`Questions found: ${attemptData.questions.length}`)
        console.log(`Messages: ${attemptData.messages.join(', ') || '(none)'}`)

        console.log('\nRaw Response (for field validation):')
        console.log(JSON.stringify(attemptData, null, 2))

        if (attemptData.questions.length > 0) {
            console.log('\n--- QUESTION 0 ANALYSIS ---')
            const q = attemptData.questions[0]
            console.log(`Type: ${q.type}`)
            console.log(`Number: ${q.number}`)
            console.log(`Slot: ${q.slot}`)
            console.log(`State: ${q.state}`)
            console.log(`Status: ${q.status}`)
            console.log(`Flagged: ${q.flagged}`)
            console.log(`HTML length: ${q.html.length} chars`)
            console.log(`HTML preview (first 300 chars):`)
            console.log(q.html.substring(0, 300))
        }

        // ── Step 7: Submit a test answer ─────────────────────────────────────
        console.log('\n=== STEP 7: PROCESS ATTEMPT (SUBMIT PAGE) ===')
        // Build a simple test submission — leave answers blank to just save
        const submitData: Array<{ name: string; value: string }> = []
        if (attemptData.questions.length > 0) {
            // Try to extract input names from the first question's HTML
            const firstQHtml = attemptData.questions[0].html
            // Look for input name patterns from Moodle quiz HTML
            const inputMatches = firstQHtml.match(/name="([^"]+)"/g)
            if (inputMatches) {
                console.log(`Found input patterns: ${inputMatches.join(', ')}`)
                // For this test, just submit empty (Moodle may allow skipping)
                submitData.push({ name: inputMatches[0].replace('name="', '').replace('"', ''), value: '' })
            }
        }

        const processResponse = await moodleService.processAttempt(
            token,
            attemptId,
            submitData,
            0, // finishattempt: 0 (save, don't finish yet)
            0, // timeup: 0
        )
        console.log(`✓ Page submitted`)
        console.log('Raw Response (for field validation):')
        console.log(JSON.stringify(processResponse, null, 2))

        console.log('\n=== TEST COMPLETE ===')
        console.log('✓ All quiz attempt functions executed successfully')
        console.log('\nNext steps:')
        console.log('1. Review the raw responses above')
        console.log('2. Update MoodleAttemptQuestion interface if new fields are present')
        console.log('3. Verify question HTML structure in question 0 analysis above')
        console.log('4. Update quiz-content.tsx with the actual HTML parsing logic')
    } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error)
        process.exit(1)
    }
}

main()
