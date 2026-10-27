"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ACCOUNT_TYPE_LABELS } from "@/components/accounting/labels"
import type { Account } from "@/components/accounting/types"

interface AccountSelectProps {
  accounts: Account[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  ariaLabel?: string
  includeInactive?: boolean
  postableOnly?: boolean
}

function AccountSelect({
  accounts,
  value,
  onChange,
  placeholder = "انتخاب حساب…",
  disabled,
  className,
  ariaLabel = "انتخاب حساب",
  includeInactive = false,
  postableOnly = false,
}: AccountSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const options = React.useMemo(
    () =>
      accounts
        .filter((account) => includeInactive || account.isActive !== false)
        .filter((account) => !postableOnly || account.isPostable !== false)
        .sort(
          (a, b) =>
            (a.code || "").localeCompare(b.code || "", "en") ||
            (a.name || "").localeCompare(b.name || "", "fa"),
        ),
    [accounts, includeInactive, postableOnly],
  )

  const selected = options.find((account) => account._id === value)
  const query = search.trim().toLowerCase()
  const filtered = query
    ? options.filter(
        (account) =>
          (account.code || "").toLowerCase().includes(query) ||
          (account.name || "").toLowerCase().includes(query),
      )
    : options

  const grouped = filtered.reduce<Record<string, Account[]>>((acc, account) => {
    const type = account.accountType || "other"
    acc[type] = acc[type] ? [...acc[type], account] : [account]
    return acc
  }, {})

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-sm border border-steel-border/60 bg-transparent px-3 py-2 text-sm outline-none transition-all duration-200",
          "hover:border-frost-link/25 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          className,
        )}
        dir="rtl"
      >
        <span className={cn("min-w-0 flex-1 truncate text-start", !selected && "text-fog/60")}>
          {selected
            ? `${selected.code ? `${selected.code} — ` : ""}${selected.name || "بدون نام"}`
            : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-fog/60" />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner side="bottom" align="start" sideOffset={4} className="z-50 w-(--anchor-width)">
          <PopoverPopup className="w-full overflow-hidden p-0" dir="rtl">
            <Command shouldFilter={false} className="rounded-xl! bg-[rgba(47,52,62,0.95)]">
              <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
                <Search className="size-4 shrink-0 text-fog/60" />
                <CommandInput
                  value={search}
                  onValueChange={setSearch}
                  placeholder="جستجوی کد یا نام حساب…"
                  className="flex-1 bg-transparent text-sm text-moonlight outline-none placeholder:text-fog/40"
                />
              </div>
              <CommandList className="max-h-64" dir="rtl">
                <CommandEmpty className="py-6 text-center text-sm text-fog/60">حسابی یافت نشد</CommandEmpty>
                {Object.entries(grouped).map(([type, group]) => (
                  <CommandGroup key={type} heading={ACCOUNT_TYPE_LABELS[type] || "سایر"}>
                    {group.map((account) => (
                      <CommandItem
                        key={account._id}
                        value={account._id}
                        onSelect={() => {
                          onChange(account._id)
                          setOpen(false)
                          setSearch("")
                        }}
                        className="gap-2"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          <span dir="ltr" className="me-2 font-mono text-xs text-fog/60">
                            {account.code || "—"}
                          </span>
                          {account.name || "بدون نام"}
                        </span>
                        {value === account._id && <Check className="size-4 text-electric-iris" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  )
}

export { AccountSelect }
