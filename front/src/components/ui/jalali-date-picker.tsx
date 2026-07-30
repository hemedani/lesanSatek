"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format as jalaliFormat } from "date-fns-jalali"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverPositioner,
  PopoverPopup,
} from "@/components/ui/popover"

interface JalaliDatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

function JalaliDatePicker({
  date,
  onSelect,
  placeholder = "انتخاب تاریخ",
  disabled,
  required,
}: JalaliDatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            variant="outline"
            size="default"
            className={cn(
              "w-full justify-start text-start font-normal",
              !date && "text-muted-foreground"
            )}
          />
        }
      >
        <CalendarIcon className="ms-0.5 size-4 shrink-0 opacity-50" />
        <span>
          {date
            ? jalaliFormat(date, "yyyy/MM/dd")
            : placeholder}
        </span>
        {required && <span className="text-destructive me-auto ms-0.5">*</span>}
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner side="bottom" align="start" sideOffset={4}>
           <PopoverPopup className="w-auto min-w-[300px] p-0" dir="rtl">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                onSelect?.(selectedDate)
                setOpen(false)
              }}
              autoFocus
            />
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  )
}

export { JalaliDatePicker }
