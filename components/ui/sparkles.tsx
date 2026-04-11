"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SparklesProps {
  className?: string;
  children?: React.ReactNode;
  sparkleCount?: number;
}

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
  lifespan: number;
}

function generateSparkle(color: string): Sparkle {
  return {
    id: Math.random().toString(36).slice(2),
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    color,
    delay: Math.random() * 0.6,
    scale: Math.random() * 0.6 + 0.4,
    lifespan: Math.random() * 1000 + 800,
  };
}

export function Sparkles({
  className,
  children,
  sparkleCount = 8,
}: SparklesProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const colors = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];

  useEffect(() => {
    const initial = Array.from({ length: sparkleCount }, () =>
      generateSparkle(colors[Math.floor(Math.random() * colors.length)])
    );
    setSparkles(initial);

    const interval = setInterval(() => {
      setSparkles((prev) => {
        const next = [...prev];
        const index = Math.floor(Math.random() * next.length);
        next[index] = generateSparkle(
          colors[Math.floor(Math.random() * colors.length)]
        );
        return next;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [sparkleCount]);

  return (
    <span className={cn("relative inline-block", className)}>
      {sparkles.map((sparkle) => (
        <motion.span
          key={sparkle.id}
          className="pointer-events-none absolute"
          style={{ left: sparkle.x, top: sparkle.y }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: sparkle.scale, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.4, delay: sparkle.delay }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
          >
            <path
              d="M5 0L6.12 3.88L10 5L6.12 6.12L5 10L3.88 6.12L0 5L3.88 3.88L5 0Z"
              fill={sparkle.color}
            />
          </svg>
        </motion.span>
      ))}
      <span className="relative z-10">{children}</span>
    </span>
  );
}
