"use client"

import * as React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Popover } from "@base-ui/react/popover"
import { Command } from "cmdk"
import { CheckIcon, ChevronDownIcon, Loader2, SearchIcon } from "lucide-react"
import { type Control, type FieldPath, type FieldValues } from "react-hook-form"

import { cn } from "@/lib/utils"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface SearchSelectOption {
  _id: string
  name: string
  sublabel?: string
}

interface FormSearchSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>
  name: TName
  label: string
  placeholder?: string
  fetcher: (search?: string) => Promise<SearchSelectOption[]>
  disabled?: boolean
  required?: boolean
}

const SearchSelect = React.forwardRef(function SearchSelect({
  value,
  onChange,
  placeholder = "انتخاب کنید...",
  fetcher,
  disabled,
  label,
  hasError,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  fetcher: (search?: string) => Promise<SearchSelectOption[]>
  disabled?: boolean
  label: string
  hasError?: boolean
  className?: string
}, ref: React.Ref<HTMLButtonElement>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [options, setOptions] = useState<SearchSelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fetchedRef = useRef(false)
  const fetcherRef = useRef(fetcher)

  useEffect(() => { fetcherRef.current = fetcher }, [fetcher])

  const selectedOption = options.find((o) => o._id === value)

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

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    loadOptions(value || undefined)
  }, [loadOptions])

  const handleSelect = useCallback((selectedValue: string) => {
    onChange(selectedValue)
    setOpen(false)
    setSearch("")
  }, [onChange])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setSearch("")
      loadOptions()
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [loadOptions])

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange} modal>
      <Popover.Trigger
        ref={ref}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full min-w-0 items-center justify-between gap-1.5 rounded-sm border bg-transparent px-3 py-2 text-sm whitespace-nowrap transition-all duration-200 ease-in-out outline-none select-none cursor-pointer",
          "border-steel-border/60 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          hasError && "border-[#e46d4c] ring-3 ring-[rgba(228,109,76,0.1)]",
          "dark:bg-input/30 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]",
          !value && "text-muted-foreground",
          className
        )}
        dir="rtl"
      >
        <span className={cn(
          "flex-1 text-start truncate",
          value && "text-moonlight"
        )}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDownIcon className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
          open && "rotate-180"
        )} />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          sideOffset={4}
          className="z-50 w-(--anchor-width)"
        >
          <Popover.Popup
            className={cn(
              "origin-(--transform-origin) overflow-hidden rounded-lg bg-[rgba(47,52,62,0.85)] backdrop-blur-xl text-popover-foreground shadow-lg ring-1 ring-frost-link/12",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              "duration-100"
            )}
            dir="rtl"
          >
            <Command
              label={label}
              shouldFilter={false}
              className="flex flex-col"
            >
              <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
                <SearchIcon className="size-4 shrink-0 text-fog/60" />
                <Command.Input
                  ref={inputRef}
                  value={search}
                  onValueChange={handleSearchChange}
                  placeholder="جستجو..."
                  className="flex-1 bg-transparent text-sm text-moonlight outline-none placeholder:text-fog/40"
                />
                {loading && (
                  <Loader2 className="size-4 shrink-0 animate-spin text-fog/60" />
                )}
              </div>

              <Command.List className="max-h-60 overflow-y-auto p-1 scroll-py-1">
                {!loading && options.length === 0 && (
                  <Command.Empty className="py-8 text-center text-sm text-fog/60">
                    نتیجه‌ای یافت نشد
                  </Command.Empty>
                )}

                {loading && options.length === 0 && (
                  <div className="space-y-1 p-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-9 animate-pulse rounded-sm bg-white/[0.03]" />
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
                        "relative flex cursor-default items-center gap-2 rounded-sm px-2.5 py-2 text-sm outline-none select-none",
                        "data-disabled:pointer-events-none data-disabled:opacity-50",
                        "data-selected:bg-white/[0.06] data-selected:text-glacier",
                        value === option._id && "bg-electric-iris/8 text-frost-link"
                      )}
                    >
                      <span className="flex-1 truncate">{option.name}</span>
                      {option.sublabel && (
                        <span className="shrink-0 text-xs text-fog/50">{option.sublabel}</span>
                      )}
                      {value === option._id && (
                        <CheckIcon className="size-4 shrink-0 text-electric-iris" />
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
})

function FormSearchSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  placeholder = "انتخاب کنید...",
  fetcher,
  disabled,
  required,
}: FormSearchSelectProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ms-1">*</span>}
          </FormLabel>
          <FormControl>
            <SearchSelect
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              placeholder={placeholder}
              fetcher={fetcher}
              disabled={disabled}
              label={label}
              hasError={!!fieldState.error}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export { FormSearchSelect, SearchSelect }
export type { SearchSelectOption }
