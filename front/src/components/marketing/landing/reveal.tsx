"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  "aria-hidden"?: boolean | "true" | "false"
}

export function Reveal({ children, className, delay = 0, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -48px 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-reveal
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
      {...rest}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        revealed ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.98] opacity-0",
        className
      )}
    >
      {children}
    </div>
  )
}
