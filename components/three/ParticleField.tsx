'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from 'framer-motion'

interface ParticleFieldInnerProps {
  count?: number
  connectionDistance?: number
  mouseInfluenceRadius?: number
}

function ParticleFieldInner({
  count = 240,
  connectionDistance = 120,
  mouseInfluenceRadius = 200,
}: ParticleFieldInnerProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const { viewport, size } = useThree()

  // Generate initial particle positions
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      pos[i3] = (Math.random() - 0.5) * viewport.width * 1.5
      pos[i3 + 1] = (Math.random() - 0.5) * viewport.height * 1.5
      pos[i3 + 2] = (Math.random() - 0.5) * 2

      vel[i3] = (Math.random() - 0.5) * 0.002
      vel[i3 + 1] = (Math.random() - 0.5) * 0.002
      vel[i3 + 2] = 0
    }

    return [pos, vel]
  }, [count, viewport.width, viewport.height])

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Convert to normalized device coordinates
      mouseRef.current.x = ((e.clientX / size.width) * 2 - 1) * (viewport.width / 2)
      mouseRef.current.y = (-(e.clientY / size.height) * 2 + 1) * (viewport.height / 2)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [size.width, size.height, viewport.width, viewport.height])

  // Animation frame
  useFrame(() => {
    if (!pointsRef.current || !linesRef.current) return

    const positionsArray = pointsRef.current.geometry.attributes.position.array as Float32Array
    const linePositions: number[] = []

    // Normalized mouse influence radius in world space
    const influenceRadius = (mouseInfluenceRadius / size.width) * viewport.width

    // Update particle positions
    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      // Apply velocity
      positionsArray[i3] += velocities[i3]
      positionsArray[i3 + 1] += velocities[i3 + 1]

      // Wrap around edges
      const halfWidth = viewport.width * 0.75
      const halfHeight = viewport.height * 0.75

      if (positionsArray[i3] > halfWidth) positionsArray[i3] = -halfWidth
      if (positionsArray[i3] < -halfWidth) positionsArray[i3] = halfWidth
      if (positionsArray[i3 + 1] > halfHeight) positionsArray[i3 + 1] = -halfHeight
      if (positionsArray[i3 + 1] < -halfHeight) positionsArray[i3 + 1] = halfHeight

      // Mouse magnetic attraction (subtle)
      const dx = mouseRef.current.x - positionsArray[i3]
      const dy = mouseRef.current.y - positionsArray[i3 + 1]
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < influenceRadius && distance > 0.1) {
        const force = Math.min(0.0003, 0.01 / distance)
        positionsArray[i3] += dx * force
        positionsArray[i3 + 1] += dy * force
      }
    }

    // Calculate connections
    const connDist = (connectionDistance / size.width) * viewport.width

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      for (let j = i + 1; j < count; j++) {
        const j3 = j * 3
        const dx = positionsArray[i3] - positionsArray[j3]
        const dy = positionsArray[i3 + 1] - positionsArray[j3 + 1]
        const dz = positionsArray[i3 + 2] - positionsArray[j3 + 2]
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (distance < connDist) {
          linePositions.push(
            positionsArray[i3],
            positionsArray[i3 + 1],
            positionsArray[i3 + 2],
            positionsArray[j3],
            positionsArray[j3 + 1],
            positionsArray[j3 + 2]
          )
        }
      }
    }

    // Update geometries
    pointsRef.current.geometry.attributes.position.needsUpdate = true

    const lineGeometry = linesRef.current.geometry as THREE.BufferGeometry
    lineGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3)
    )
    lineGeometry.attributes.position.needsUpdate = true
  })

  return (
    <>
      {/* Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color="#6366f1"
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>

      {/* Connection lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.15}
          linewidth={1}
        />
      </lineSegments>
    </>
  )
}

interface ParticleFieldProps {
  className?: string
  count?: number
}

export function ParticleField({ className, count = 240 }: ParticleFieldProps) {
  const [isMounted, setIsMounted] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't render on server or when reduced motion is preferred
  if (!isMounted || prefersReducedMotion) {
    return <div className={className} />
  }

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ParticleFieldInner count={count} />
      </Canvas>
    </div>
  )
}