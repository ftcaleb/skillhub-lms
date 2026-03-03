"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  User,
  Mail,
  Building2,
  MapPin,
  Camera,
  Pencil,
  Check,
  X,
  Shield,
  CalendarDays,
} from "lucide-react"
import { userProfile } from "@/lib/data"
import { MilestoneTimeline } from "@/components/milestone-timeline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfileView() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: userProfile.name,
    title: userProfile.title,
    email: userProfile.email,
    company: userProfile.company,
    location: userProfile.location,
    bio: userProfile.bio,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSave() {
    if (validate()) {
      setIsEditing(false)
      setErrors({})
    }
  }

  function handleCancel() {
    setFormData({
      name: userProfile.name,
      title: userProfile.title,
      email: userProfile.email,
      company: userProfile.company,
      location: userProfile.location,
      bio: userProfile.bio,
    })
    setIsEditing(false)
    setErrors({})
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Glassmorphism header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-border/50 p-6 sm:p-8"
        style={{
          background:
            "linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(15, 23, 42, 0.4) 50%, rgba(100, 116, 139, 0.08) 100%)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, oklch(0.75 0.16 65), transparent)" }}
        />

        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="group relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/30 bg-secondary text-muted-foreground">
              <User className="h-8 w-8" />
            </div>
            <button
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              aria-label="Upload avatar"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {formData.name}
            </h1>
            <p className="mt-0.5 text-sm text-primary font-medium">
              {formData.title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formData.company} &middot; {formData.location}
            </p>
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
              Edit Profile
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

      {/* Personal Details */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h2 className="text-sm font-semibold text-card-foreground mb-5">
          Personal Details
        </h2>
        <div className="grid gap-5">
          <FieldRow
            icon={User}
            label="Full Name"
            value={formData.name}
            isEditing={isEditing}
            error={errors.name}
            onChange={(v) => setFormData((p) => ({ ...p, name: v }))}
          />
          <FieldRow
            icon={Mail}
            label="Email"
            value={formData.email}
            isEditing={isEditing}
            error={errors.email}
            onChange={(v) => setFormData((p) => ({ ...p, email: v }))}
          />
          <FieldRow
            icon={Building2}
            label="Company"
            value={formData.company}
            isEditing={isEditing}
            onChange={(v) => setFormData((p) => ({ ...p, company: v }))}
          />
          <FieldRow
            icon={MapPin}
            label="Location"
            value={formData.location}
            isEditing={isEditing}
            onChange={(v) => setFormData((p) => ({ ...p, location: v }))}
          />
        </div>
      </motion.section>

      {/* Professional Credentials */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h2 className="text-sm font-semibold text-card-foreground mb-5">
          Professional Credentials
        </h2>
        <div className="grid gap-3">
          {userProfile.credentials.map((cred) => (
            <div
              key={cred.name}
              className="flex items-center gap-4 rounded-lg border border-border bg-secondary/50 px-4 py-3 transition-colors hover:bg-secondary"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground">{cred.name}</p>
                <p className="text-xs text-muted-foreground">
                  {cred.issuer}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                {cred.dateEarned}
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                {cred.status}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Milestone Timeline */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h2 className="text-sm font-semibold text-card-foreground mb-5">
          Career Milestone Tracker
        </h2>
        <MilestoneTimeline milestones={userProfile.milestones} />
      </motion.section>
    </div>
  )
}

interface FieldRowProps {
  icon: React.ElementType
  label: string
  value: string
  isEditing: boolean
  error?: string
  onChange?: (value: string) => void
}

function FieldRow({ icon: Icon, label, value, isEditing, error, onChange }: FieldRowProps) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Label>
      {isEditing ? (
        <div>
          <Input
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-9 bg-input border-border text-foreground text-sm placeholder:text-muted-foreground"
          />
          {error && (
            <p className="mt-1 text-xs text-destructive">{error}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-card-foreground">{value}</p>
      )}
    </div>
  )
}
