import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '/Users/batie/Desktop/skillhub-lms/.env.local' })

async function run() {
  const moodleUrl = process.env.MOODLE_URL?.replace(/\/$/, '')
  const token = process.env.MOODLE_ADMIN_TOKEN
  
  if (!moodleUrl || !token) {
    console.error('Missing env vars')
    return
  }

  const fileHtml = Buffer.from('test content')
  
  const uploadFormData = new FormData()
  uploadFormData.append('token', token)
  uploadFormData.append('component', 'user')
  uploadFormData.append('filearea', 'draft')
  uploadFormData.append('itemid', '0')
  uploadFormData.append('filepath', '/')
  uploadFormData.append('filename', 'test.txt')
  uploadFormData.append('file', new Blob(['test content']), 'test.txt')

  try {
    const res = await fetch(`${moodleUrl}/webservice/upload.php`, {
      method: 'POST',
      body: uploadFormData,
    })
    const text = await res.text()
    console.log('Status:', res.status)
    console.log('Response:', text)
  } catch (err) {
    console.error('Error:', err)
  }
}

run()
