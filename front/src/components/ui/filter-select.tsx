"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { ChevronDownIcon, ChevronUpIcon, CheckIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FilterOption {
  value: string
  label: string
}

interface FilterSelectProps {
  icon?: React.ElementType
  placeholder: string
  value: string
  onValueChange: (value: string | null) => void
  options: FilterOption[]
  loading?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
  ariaLabel?: string
}

function FilterSelect({
  icon: Icon,
  placeholder,
  value,
  onValueChange,
  options,
  loading = false,
  triggerClassName,
  contentClassName,
  ariaLabel,
}: FilterSelectProps) {
  const selected = options.find((opt) => opt.value === value)

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        dir="rtl"
        className={cn(
          "group flex h-11 min-w-44 items-center gap-2.5 rounded-sm border border-steel-border/60 bg-graphite-plate/40 px-3 text-body-sm whitespace-nowrap shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] outline-none transition-all duration-200 ease-in-out select-none",
          "hover:border-frost-link/25 data-popup-open:border-frost-link/40 data-popup-open:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_0_0_1px_rgba(102,58,243,0.2),0_0_20px_-8px_rgba(102,58,243,0.35)]",
          "focus-visible:border-frost-link focus-visible:ring-3 focus-visible:ring-frost-link/50",
          triggerClassName,
        )}
      >
        {Icon && (
          <Icon
            aria-hidden="true"
            strokeWidth={2}
            className={cn(
              "size-5 shrink-0 transition-colors",
              selected ? "text-electric-iris" : "text-moonlight/60",
            )}
          />
        )}
        <SelectPrimitive.Value>
          {(rawValue) => {
            const current = rawValue ?? ""
            const option = options.find((opt) => opt.value === current)
            return (
              <span
                className={cn(
                  "block max-w-44 truncate text-start transition-colors",
                  option ? "text-moonlight" : "text-fog",
                )}
              >
                {option ? option.label : placeholder}
              </span>
            )
          }}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon className="ms-auto flex shrink-0 items-center">
          <ChevronDownIcon
            aria-hidden="true"
            strokeWidth={2}
            className="size-5 text-fog transition-transform duration-200 group-data-[popup-open]:rotate-180"
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          side="bottom"
          sideOffset={6}
          align="start"
          alignItemWithTrigger={false}
          className="isolate z-50"
        >
          <SelectPrimitive.Popup
            dir="rtl"
            className={cn(
              "relative isolate z-50 min-w-(--anchor-width) max-w-[min(90vw,24rem)] max-h-[min(var(--available-height),18rem)] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl bg-graphite-plate/85 p-1.5 text-moonlight backdrop-blur-xl shadow-[0_0_0_1px_rgba(186,215,247,0.12)_inset,0_0_40px_-16px_rgba(182,217,252,0.32),0_24px_48px_-16px_rgba(0,0,0,0.7)] ring-1 ring-frost-link/20 duration-150",
              "[scrollbar-width:thin] [scrollbar-color:rgba(182,217,252,0.3)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-frost-link/25",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none motion-reduce:transition-none",
              contentClassName,
            )}
          >
            <SelectPrimitive.ScrollUpArrow className="flex w-full items-center justify-center py-1 text-fog">
              <ChevronUpIcon className="size-4" strokeWidth={2} />
            </SelectPrimitive.ScrollUpArrow>
            <SelectPrimitive.List className="scroll-my-1">
              {loading ? (
                <div className="flex items-center gap-2 px-3 py-3 text-caption leading-5 text-fog">
                  <Loader2 className="size-5 animate-spin text-frost-link" strokeWidth={2} />
                  در حال بارگذاری…
                </div>
              ) : options.length === 0 ? (
                <div className="px-3 py-3 text-caption leading-5 text-fog">موردی یافت نشد</div>
              ) : (
                options.map((opt) => (
                  <SelectPrimitive.Item
                    key={opt.value}
                    value={opt.value}
                    className={cn(
                      "relative flex min-h-10 w-full cursor-default items-center rounded-md py-2 pe-10 ps-3 text-moonlight outline-none transition-colors select-none",
                      "data-highlighted:bg-frost-link/10 data-highlighted:text-glacier data-highlighted:ring-1 data-highlighted:ring-inset data-highlighted:ring-frost-link/25",
                      "data-selected:bg-frost-link/5 data-selected:font-medium data-selected:text-frost-link",
                    )}
                  >
                    <SelectPrimitive.ItemText className="min-w-0 grow line-clamp-2 text-caption leading-5">
                      {opt.label}
                    </SelectPrimitive.ItemText>
                    <SelectPrimitive.ItemIndicator className="pointer-events-none absolute end-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center">
                      <CheckIcon className="size-5 text-frost-link" strokeWidth={2.5} />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))
              )}
            </SelectPrimitive.List>
            <SelectPrimitive.ScrollDownArrow className="flex w-full items-center justify-center py-1 text-fog">
              <ChevronDownIcon className="size-4" strokeWidth={2} />
            </SelectPrimitive.ScrollDownArrow>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export { FilterSelect }
