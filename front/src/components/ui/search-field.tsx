"use client"

import { useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SearchFieldProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  debounce?: number
  className?: string
  inputClassName?: string
  ariaLabel?: string
}

function SearchField({
  value = "",
  onChange,
  placeholder = "جستجو…",
  debounce = 300,
  className,
  inputClassName,
  ariaLabel,
}: SearchFieldProps) {
  const [local, setLocal] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement | null>(null)

  if (prevValue !== value) {
    setPrevValue(value)
    setLocal(value)
  }

  const handleChange = (val: string) => {
    setLocal(val)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(val), debounce)
  }

  const clear = () => {
    handleChange("")
    inputRef.current?.focus()
  }

  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden="true"
        strokeWidth={2}
        className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-moonlight/60"
      />
      <Input
        ref={inputRef}
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        dir="rtl"
        className={cn(
          "h-11 bg-graphite-plate/40 ps-11 pe-11 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] placeholder:text-fog/70",
          inputClassName,
        )}
      />
      {local && (
        <button
          type="button"
          onClick={clear}
          aria-label="پاک کردن جستجو"
          className="absolute end-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-pebble outline-none transition-colors hover:bg-white/5 hover:text-moonlight focus-visible:ring-2 focus-visible:ring-frost-link/50"
        >
          <X className="size-5" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

export { SearchField }
