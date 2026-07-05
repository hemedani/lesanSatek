"use client"

import { useState, useRef } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SearchInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  debounce?: number
  className?: string
}

function SearchInput({
  value = "",
  onChange,
  placeholder = "جستجو...",
  debounce = 300,
  className,
}: SearchInputProps) {
  const [local, setLocal] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleChange = (val: string) => {
    setLocal(val)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(val), debounce)
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-fog" />
      <Input
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="ps-8 pe-8"
        dir="rtl"
      />
      {local && (
        <button
          onClick={() => handleChange("")}
          className="absolute end-2 top-1/2 -translate-y-1/2 text-pebble hover:text-moonlight transition-colors rounded-full p-0.5 hover:bg-white/5"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

export { SearchInput }
