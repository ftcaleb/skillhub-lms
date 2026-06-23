'use client'

import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

const cardRevealVariants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 24,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1], // outEase
    },
  },
}

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'animate'> {
  variant?: 'default' | 'featured' | 'elevated'
  size?: 'sm' | 'md' | 'lg'
  shouldAnimate?: boolean
  conicBorder?: boolean
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      shouldAnimate = true,
      conicBorder = false,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'rounded-[10px] p-4',
      md: 'rounded-[14px] p-6',
      lg: 'rounded-[20px] p-8',
    }

    const variantClasses = {
      default: '',
      featured: 'border-indigo/20',
      elevated: 'bg-obsidian-3/60',
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative glass',
          sizeClasses[size],
          variantClasses[variant],
          conicBorder && 'conic-border',
          className
        )}
        variants={shouldAnimate ? cardRevealVariants : undefined}
        initial={shouldAnimate ? 'hidden' : undefined}
        whileInView={shouldAnimate ? 'visible' : undefined}
        viewport={{ once: true, amount: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

export { GlassCard }
