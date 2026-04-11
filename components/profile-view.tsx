'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Globe,
  Camera,
  Pencil,
  Check,
  X,
  AlertCircle,
  Loader2,
  LogOut,
} from 'lucide-react'
import { MilestoneTimeline } from '@/components/milestone-timeline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfile } from '@/components/profile-context'

// Editing only modifies local state — Moodle profile mutation
// requires core_user_update_users which is not in the service whitelist
interface EditableFields {
  firstname: string
  lastname: string
}

export function ProfileView() {
  const router = useRouter()
  const { profile, loading, error, refreshProfile, updateProfileOptimistically } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<EditableFields>({ firstname: '', lastname: '' })
  const [loggingOut, setLoggingOut] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [milestones, setMilestones] = useState<any[]>([
    { title: 'Joined the platform', date: null, completed: false },
    { title: 'First course enrolled', date: null, completed: false },
    { title: 'First certificate earned', date: null, completed: false },
  ])
  
  // Sync edit data when profile is loaded or edit mode turns on
  useEffect(() => {
    if (profile) {
      setEditData({ firstname: profile.firstname, lastname: profile.lastname })
    }
  }, [profile, isEditing])

  // Fetch milestone data
  useEffect(() => {
    if (profile?.userid) {
      Promise.allSettled([
        fetch(`/api/user/profile`).then(res => res.json()),
        fetch(`/api/courses`).then(res => res.json()),
        fetch(`/api/user/certificates`).then(res => res.json())
      ]).then(([profileRes, coursesRes, certsRes]) => {
        const nextMilestones = [
            { title: 'Joined the platform', date: null as string | null, completed: false },
            { title: 'First course enrolled', date: null as string | null, completed: false },
            { title: 'First certificate earned', date: null as string | null, completed: false },
        ]

        // Joined the platform
        const joinDate = 
            profile.timecreated && profile.timecreated > 0 ? profile.timecreated :
            (profileRes.value as any)?.timecreated && (profileRes.value as any)?.timecreated > 0 
                ? (profileRes.value as any)?.timecreated :
            (profileRes.value as any)?.firstaccess && (profileRes.value as any)?.firstaccess > 0 
                ? (profileRes.value as any)?.firstaccess :
            null

        if (joinDate) {
            nextMilestones[0].date = String(joinDate) // Store raw timestamp for formatting in render
            nextMilestones[0].completed = true
        } else {
            nextMilestones[0].completed = true // Always completed since they're logged in
        }

        if (coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value) && coursesRes.value.length > 0) {
            const earliest = coursesRes.value.reduce((prev: any, curr: any) => prev.startdate < curr.startdate ? prev : curr)
            nextMilestones[1].title = earliest.fullname || earliest.displayname
            nextMilestones[1].date = new Date(earliest.startdate * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            nextMilestones[1].completed = true
        } else {
            nextMilestones[1].title = 'Not yet enrolled'
            nextMilestones[1].date = ''
            nextMilestones[1].completed = false
        }

        if (certsRes.status === 'fulfilled' && certsRes.value?.certificates?.length > 0) {
            const earliest = certsRes.value.certificates.reduce((prev: any, curr: any) => prev.timestamp < curr.timestamp ? prev : curr)
            nextMilestones[2].date = `${earliest.courseName} • ${earliest.dateEarned}`
            nextMilestones[2].completed = true
        } else {
            nextMilestones[2].date = 'Not yet earned'
        }

        setMilestones(nextMilestones)
      })
    }
  }, [profile?.userid])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 1MB to prevent Moodle NGINX 413 "Request Entity Too Large" errors
    const MAX_MB = 1
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`Image is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Please choose a file under ${MAX_MB}MB.`)
      e.target.value = ''
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/user/picture', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to upload image to Moodle')
      }

      const data = await res.json()
      if (data.success && data.userpictureurl) {
        updateProfileOptimistically({ userpictureurl: data.userpictureurl })
      }
    } catch (err: any) {
      alert(err.message || 'Image upload failed. Please try again.')
    } finally {
      setUploadingImage(false)
      // reset input
      e.target.value = ''
    }
  }

  async function handleSave() {
    if (!editData.firstname.trim() && !editData.lastname.trim()) return
    setIsEditing(false)
    updateProfileOptimistically({ 
      firstname: editData.firstname, 
      lastname: editData.lastname,
      fullname: `${editData.firstname} ${editData.lastname}`.trim()
    })
    
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      })
      refreshProfile()
    } catch (err) {
      console.error('Failed to save profile changes:', err)
    }
  }

  function handleCancel() {
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-8 max-w-2xl mx-auto">
        <div className="rounded-2xl p-8 animate-pulse" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full skeleton shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-5 w-40 rounded skeleton" />
              <div className="h-3 w-24 rounded skeleton" />
              <div className="h-3 w-32 rounded skeleton" />
            </div>
          </div>
        </div>
        <div className="rounded-xl p-6 animate-pulse" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="h-4 w-28 rounded skeleton mb-5" />
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-6 rounded skeleton" />)}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium text-foreground">Failed to load profile</p>
        <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
      </div>
    )
  }

  if (!profile) return null

  const initials = `${profile.firstname?.[0] ?? ''}${profile.lastname?.[0] ?? ''}`.toUpperCase() || profile.username.substring(0, 2).toUpperCase()

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Glassmorphism header card */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="profile-hero-card relative overflow-hidden rounded-2xl p-6 sm:p-8"
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, var(--glow-primary), transparent)' }}
        />

        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="group relative">
            {profile.userpictureurl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/courses/file?url=${encodeURIComponent(profile.userpictureurl)}`}
                alt={profile.fullname}
                className="h-20 w-20 rounded-full object-cover"
                style={{
                  border: '3px solid var(--border-glow)',
                  background: 'var(--bg-elevated)',
                  boxShadow: 'var(--shadow-glow-sm)',
                }}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold"
                style={{
                  border: '3px solid var(--border-glow)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-glow-sm)',
                  fontFamily: "'Sora', sans-serif",
                }}
              >
                {initials}
              </div>
            )}
            <Label
              htmlFor="avatar-upload"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground cursor-pointer"
              aria-label="Upload avatar"
            >
              {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg, image/png, image/gif, image/webp"
                className="hidden"
                disabled={uploadingImage}
                onChange={handleImageUpload}
              />
            </Label>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: "'Sora', sans-serif", color: 'var(--text-primary)' }}
            >
              {isEditing ? `${editData.firstname} ${editData.lastname}`.trim() || profile.fullname : profile.fullname}
            </h1>
            <p
              className="mt-0.5 text-sm font-medium"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--glow-accent)' }}
            >
              @{profile.username}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{profile.sitename}</p>
          </div>

          {/* Edit toggle */}
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-secondary"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSave}
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-secondary"
                onClick={handleCancel}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Account Details */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl p-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <h2
          className="text-sm font-semibold mb-5"
          style={{ fontFamily: "'Sora', sans-serif", color: 'var(--text-primary)' }}
        >
          Account Details
        </h2>
        <div className="grid gap-5">
          <FieldRow
            icon={User}
            label="First Name"
            value={isEditing ? editData.firstname : profile.firstname}
            isEditing={isEditing}
            onChange={(v) => setEditData((p) => ({ ...p, firstname: v }))}
          />
          <FieldRow
            icon={User}
            label="Last Name"
            value={isEditing ? editData.lastname : profile.lastname}
            isEditing={isEditing}
            onChange={(v) => setEditData((p) => ({ ...p, lastname: v }))}
          />
          <FieldRow
            icon={User}
            label="Username (Read-only)"
            value={profile.username}
            isEditing={false}
          />
          {profile.email && (
            <FieldRow
              icon={Mail}
              label="Email (Read-only)"
              value={profile.email}
              isEditing={false}
            />
          )}
          <FieldRow
            icon={Globe}
            label="Learning Platform"
            value={profile.sitename}
            isEditing={false}
          />
        </div>
      </motion.section>


      {/* Career Milestones — static placeholder (Moodle badges/completions could populate this) */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-xl p-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <h2
          className="text-sm font-semibold mb-5"
          style={{ fontFamily: "'Sora', sans-serif", color: 'var(--text-primary)' }}
        >
          Career Milestones
        </h2>
        <MilestoneTimeline 
          milestones={milestones
            .map(m => ({
              ...m,
              date: m.title === 'Joined the platform' && m.date && !isNaN(Number(m.date))
                ? new Date(Number(m.date) * 1000).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
                : m.date ?? null
            }))
          } 
        />
      </motion.section>

      {/* Account Actions */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="rounded-xl p-6 mb-8"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <h2
          className="text-sm font-semibold mb-5"
          style={{ fontFamily: "'Sora', sans-serif", color: 'var(--text-primary)' }}
        >
          Account Actions
        </h2>
        <div className="flex flex-col gap-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Signing out will end your current session on this device.
          </p>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-6 rounded-lg text-sidebar-foreground transition-all hover:bg-destructive/10 hover:text-destructive group"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex flex-col items-start transition-opacity">
              <span className="text-sm font-semibold">{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
              <span className="text-[10px] opacity-70">End your current session</span>
            </div>
          </Button>
        </div>
      </motion.section>
    </div>
  )
}

interface FieldRowProps {
  icon: React.ElementType
  label: string
  value: string
  isEditing: boolean
  onChange?: (v: string) => void
}

function FieldRow({ icon: Icon, label, value, isEditing, onChange }: FieldRowProps) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Label>
      {isEditing && onChange ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 bg-input border-border text-foreground text-sm"
        />
      ) : (
        <p className="text-sm text-card-foreground">{value || '—'}</p>
      )}
    </div>
  )
}
