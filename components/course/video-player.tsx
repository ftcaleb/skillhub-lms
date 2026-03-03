"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Play, Pause, Volume2, VolumeX, Maximize, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { VideoActivity } from "@/lib/types"

interface VideoPlayerProps {
  activity: VideoActivity
  isCompleted: boolean
  onMarkComplete: () => void
}

export function VideoPlayer({ activity, isCompleted, onMarkComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState("0:00")
  const [duration, setDuration] = useState(activity.duration)
  const [showControls, setShowControls] = useState(true)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100
    setProgress(pct)
    const mins = Math.floor(videoRef.current.currentTime / 60)
    const secs = Math.floor(videoRef.current.currentTime % 60)
    setCurrentTime(`${mins}:${secs.toString().padStart(2, "0")}`)
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    const mins = Math.floor(videoRef.current.duration / 60)
    const secs = Math.floor(videoRef.current.duration % 60)
    setDuration(`${mins}:${secs.toString().padStart(2, "0")}`)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pct * videoRef.current.duration
  }

  const handleFullscreen = () => {
    if (!videoRef.current) return
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Video container */}
      <div
        className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-card"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(isPlaying ? false : true)}
      >
        <video
          ref={videoRef}
          src={activity.videoUrl}
          className="h-full w-full object-cover"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          crossOrigin="anonymous"
        />

        {/* Play overlay for initial state */}
        {!isPlaying && progress === 0 && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm transition-opacity"
            aria-label="Play video"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110">
              <Play className="h-7 w-7 ml-1" />
            </div>
          </button>
        )}

        {/* Controls overlay */}
        <motion.div
          initial={false}
          animate={{ opacity: showControls ? 1 : 0 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent px-4 pb-3 pt-8"
        >
          {/* Seek bar */}
          <div
            className="group mb-3 h-1.5 cursor-pointer rounded-full bg-secondary"
            onClick={handleSeek}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            tabIndex={0}
          >
            <div
              className="relative h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-primary bg-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground hover:bg-secondary/60"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground hover:bg-secondary/60"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                {currentTime} / {duration}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-foreground hover:bg-secondary/60"
              onClick={handleFullscreen}
              aria-label="Fullscreen"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Transcript */}
      {activity.transcript && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Transcript</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{activity.transcript}</p>
        </div>
      )}

      {/* Mark complete */}
      {!isCompleted && (
        <Button
          className="w-fit bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onMarkComplete}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark as Complete
        </Button>
      )}
    </div>
  )
}
