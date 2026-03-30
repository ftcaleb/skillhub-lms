import { NextRequest, NextResponse } from 'next/server'
import moodleService from '@/lib/moodle/service'
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/moodle/session'

export async function POST(request: NextRequest) {
    try {
        const cookie = request.cookies.get(SESSION_COOKIE_NAME)
        if (!cookie?.value) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
        }

        const session = decodeSession(cookie.value)
        if (!session) {
            return NextResponse.json({ error: 'Invalid session.' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
        }

        const moodleUrl = process.env.MOODLE_URL?.replace(/\/$/, '')
        if (!moodleUrl) {
            throw new Error('MOODLE_URL is not configured.')
        }

        // 1. Upload the file as a draft item to Moodle's upload.php using admin token
        const uploadFormData = new FormData()
        uploadFormData.append('token', session.token)
        uploadFormData.append('component', 'user')
        uploadFormData.append('filearea', 'draft')
        uploadFormData.append('itemid', '0') // 0 generates a new draft item id
        uploadFormData.append('filepath', '/')
        uploadFormData.append('filename', file.name)
        
        // Ensure perfect serialization by converting File to standard Blob
        const fileBuffer = await file.arrayBuffer()
        const blob = new Blob([fileBuffer], { type: file.type })
        uploadFormData.append('file', blob, file.name)

        const uploadRes = await fetch(`${moodleUrl}/webservice/upload.php`, {
            method: 'POST',
            body: uploadFormData,
        })

        if (!uploadRes.ok) {
            const errText = await uploadRes.text()
            console.error('Moodle upload.php returned non-OK:', uploadRes.status, errText)
            throw new Error(`Moodle upload failed: ${uploadRes.status} ${errText}`)
        }

        const uploadData = await uploadRes.json()
        
        // Moodle can return an array or single object for uploads depending on the plugin
        const uploadResult = Array.isArray(uploadData) ? uploadData[0] : uploadData
        
        if (uploadResult?.error || uploadResult?.exception) {
            console.error('\n--- MOODLE UPLOAD ERROR ---')
            console.error(JSON.stringify(uploadResult, null, 2))
            console.error('---------------------------\n')
            throw new Error(uploadResult.error ?? uploadResult.exception ?? 'Upload error')
        }

        if (typeof uploadResult?.itemid === 'undefined') {
            throw new Error('Upload successful but no itemid returned.')
        }

        // 2. Set the uploaded draft item as the user's profile picture using admin token
        const updateRes = await moodleService.updateUserPicture(
            session.token,
            uploadResult.itemid as number,
            session.userId,
        )

        if (!updateRes.success) {
            console.error('Core user update picture failed:', JSON.stringify(updateRes, null, 2))
            throw new Error(`Failed to update user picture: ${JSON.stringify(updateRes.warnings)}`)
        }

        // 3. Re-fetch user details to get the new profileimageurl using admin token
        const users = await moodleService.getUsersByField(session.token, 'id', [session.userId])
        if (!users || users.length === 0) {
            throw new Error('Could not retrieve updated user details.')
        }

        return NextResponse.json({
            success: true,
            userpictureurl: users[0].profileimageurl,
        })
    } catch (err: any) {
        console.error('Picture upload error:', err)
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
    }
}
