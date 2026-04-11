"use client";
import React, { useRef } from "react";
import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface MovingBorderProps {
  children: React.ReactNode;
  duration?: number;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  as?: React.ElementType;
  [key: string]: unknown;
}

export function MovingBorder({
  children,
  duration = 2000,
  className,
  containerClassName,
  borderClassName,
  as: Component = "button",
  ...props
}: MovingBorderProps) {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength?.() ?? 0;
    if (length) {
      const pxPerMs = length / duration;
      progress.set((time * pxPerMs) % length);
    }
  });

  const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val)?.x ?? 0);
  const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val)?.y ?? 0);

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <Component
      className={cn("relative overflow-hidden rounded-lg p-[1px]", containerClassName)}
      {...props}
    >
      <div className="absolute inset-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute h-full w-full"
          width="100%"
          height="100%"
        >
          <rect
            fill="none"
            width="100%"
            height="100%"
            rx="8"
            ry="8"
            ref={pathRef}
          />
        </svg>
        <motion.div
          style={{ position: "absolute", top: 0, left: 0, display: "inline-block", transform }}
          className={cn(
            "h-4 w-4 rounded-full",
            borderClassName ?? "bg-[radial-gradient(circle,#10b981,#34d399,transparent_70%)]"
          )}
        />
      </div>
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center rounded-lg text-sm font-semibold",
          className
        )}
      >
        {children}
      </div>
    </Component>
  );
}
