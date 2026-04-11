'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface MoodleProfile {
  userid: number
  fullname: string
  firstname: string
  lastname: string
  username: string
  userpictureurl: string
  sitename: string
  email: string | null
  timecreated: number | null
}

interface ProfileContextValue {
  profile: MoodleProfile | null
  loading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
  updateProfileOptimistically: (updates: Partial<MoodleProfile>) => void
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<MoodleProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setError(null)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to fetch profile')
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfileOptimistically = useCallback((updates: Partial<MoodleProfile>) => {
    setProfile((prev) => prev ? { ...prev, ...updates } : null)
  }, [])

  return (
    <ProfileContext.Provider value={{ profile, loading, error, refreshProfile: fetchProfile, updateProfileOptimistically }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
