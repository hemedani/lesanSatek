"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Popover } from "@base-ui/react/popover"
import { Command } from "cmdk"
import { CheckIcon, ChevronDownIcon, Loader2, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export interface SearchFieldSelectOption {
  _id: string
  name: string
}

interface SearchFieldSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: React.ElementType
  fetcher: (search?: string) => Promise<SearchFieldSelectOption[]>
  displayLabel?: string
  onSelectData?: (option: SearchFieldSelectOption) => void
  ariaLabel?: string
  id?: string
  hasError?: boolean
  disabled?: boolean
  className?: string
}

function SearchFieldSelect({
  value,
  onChange,
  placeholder = "انتخاب کنید…",
  icon: Icon,
  fetcher,
  displayLabel,
  onSelectData,
  ariaLabel,
  id,
  hasError,
  disabled,
  className,
}: SearchFieldSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [options, setOptions] = useState<SearchFieldSelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fetchedRef = useRef(false)
  const fetcherRef = useRef(fetcher)

  useEffect(() => { fetcherRef.current = fetcher }, [fetcher])

  const loadOptions = useCallback(async (q?: string) => {
    setLoading(true)
    try {
      const result = await fetcherRef.current(q)
      setOptions(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      loadOptions()
    }
  }, [loadOptions])

  const handleSearchChange = useCallback((nextSearch: string) => {
    setSearch(nextSearch)
    loadOptions(nextSearch || undefined)
  }, [loadOptions])

  const handleSelect = useCallback((idValue: string) => {
    const option = options.find((o) => o._id === idValue)
    onChange(idValue)
    if (option) onSelectData?.(option)
    setOpen(false)
    setSearch("")
  }, [onChange, onSelectData, options])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setSearch("")
      loadOptions()
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [loadOptions])

  const selectedOption = options.find((o) => o._id === value)
  const label = value ? displayLabel || selectedOption?.name || "" : ""

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange} modal>
      <Popover.Trigger
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        dir="rtl"
        className={cn(
          "flex h-11 w-full min-w-0 items-center gap-2.5 rounded-sm border border-steel-border/60 bg-graphite-plate/40 px-3 text-body-sm whitespace-nowrap shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] outline-none transition-all duration-200 ease-in-out select-none cursor-pointer",
          "hover:border-frost-link/25",
          "data-popup-open:border-frost-link/40 data-popup-open:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_0_0_1px_rgba(102,58,243,0.18),0_0_20px_-8px_rgba(102,58,243,0.4)]",
          "focus-visible:border-frost-link focus-visible:ring-3 focus-visible:ring-frost-link/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          hasError && "border-ember ring-3 ring-ember/10",
          className
        )}
      >
        {Icon && (
          <Icon
            aria-hidden="true"
            strokeWidth={2}
            className={cn(
              "size-5 shrink-0 transition-colors",
              value ? "text-electric-iris" : "text-moonlight/50"
            )}
          />
        )}
        <span
          className={cn(
            "block min-w-0 flex-1 truncate text-start transition-colors",
            value ? "text-moonlight" : "text-fog"
          )}
        >
          {value ? label || placeholder : placeholder}
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          strokeWidth={2}
          className={cn(
            "size-5 shrink-0 text-fog transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" sideOffset={6} align="start" className="isolate z-50">
          <Popover.Popup
            dir="rtl"
            className={cn(
              "origin-(--transform-origin) min-w-(--anchor-width) max-w-[min(90vw,24rem)] max-h-[min(var(--available-height),18rem)] overflow-hidden rounded-xl bg-graphite-plate/85 p-1.5 text-moonlight backdrop-blur-xl shadow-[0_0_0_1px_rgba(186,215,247,0.12)_inset,0_0_40px_-16px_rgba(182,217,252,0.3),0_24px_48px_-16px_rgba(0,0,0,0.7)] ring-1 ring-frost-link/20 duration-150",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              "motion-reduce:animate-none motion-reduce:transition-none"
            )}
          >
            <Command label={ariaLabel || placeholder} shouldFilter={false} className="flex flex-col">
              <div className="flex items-center gap-2.5 border-b border-steel-border/20 px-3 py-2.5">
                <SearchIcon aria-hidden="true" strokeWidth={2} className="size-5 shrink-0 text-moonlight/60" />
                <Command.Input
                  ref={inputRef}
                  value={search}
                  onValueChange={handleSearchChange}
                  placeholder="جستجو…"
                  dir="rtl"
                  className="h-8 flex-1 bg-transparent text-body-sm text-moonlight outline-none placeholder:text-fog/50"
                />
                {loading && (
                  <Loader2 aria-hidden="true" strokeWidth={2} className="size-5 shrink-0 animate-spin text-frost-link" />
                )}
              </div>

              <Command.List className="max-h-60 overflow-y-auto p-1 scroll-my-1 [scrollbar-width:thin] [scrollbar-color:rgba(182,217,252,0.35)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-frost-link/25">
                {!loading && options.length === 0 && (
                  <Command.Empty className="py-8 text-center text-caption text-fog">
                    موردی یافت نشد
                  </Command.Empty>
                )}

                {loading && options.length === 0 && (
                  <div className="space-y-1 p-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 animate-pulse rounded-md bg-white/[0.04]" />
                    ))}
                  </div>
                )}

                <Command.Group>
                  {options.map((option) => (
                    <Command.Item
                      key={option._id}
                      value={option._id}
                      onSelect={() => handleSelect(option._id)}
                      className={cn(
                        "relative flex min-h-10 w-full cursor-default items-center rounded-md py-2 pe-10 ps-3 text-caption leading-5 text-moonlight outline-none transition-colors select-none",
                        "data-disabled:pointer-events-none data-disabled:opacity-50",
                        "data-selected:bg-frost-link/10 data-selected:text-glacier data-selected:ring-1 data-selected:ring-inset data-selected:ring-frost-link/25",
                        value === option._id && "bg-frost-link/5 font-medium text-frost-link"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.name}</span>
                      {value === option._id && (
                        <span className="pointer-events-none absolute end-2.5 flex size-5 items-center justify-center">
                          <CheckIcon aria-hidden="true" strokeWidth={2.5} className="size-5 text-frost-link" />
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

export { SearchFieldSelect }
export type { SearchFieldSelectProps }
