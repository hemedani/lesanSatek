"use client"

import * as React from "react"
import { DayPicker, UI, DayFlag, SelectionState } from "react-day-picker"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { createJalaliDateLibOverrides, jalaliFaIR } from "@/lib/jalali-date-lib"

const DEFAULT_START = new Date(1901, 2, 21) // Jalali 1280
const DEFAULT_END = new Date(2051, 2, 21)   // Jalali 1430 (170-year range)

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  startMonth = DEFAULT_START,
  endMonth = DEFAULT_END,
  ...props
}: CalendarProps) {
  const dateLibOverrides = React.useMemo(() => createJalaliDateLibOverrides(), [])

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={jalaliFaIR}
      dir="rtl"
      weekStartsOn={6}
      dateLib={dateLibOverrides as any}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      className={cn("p-3", className)}
      classNames={{
        [UI.Root]: "p-3",
        [UI.Months]: "flex flex-col sm:flex-row gap-2",
        [UI.Month]: "flex flex-col gap-4",
        [UI.MonthCaption]: "flex justify-center pt-1 relative items-center w-full",
        [UI.CaptionLabel]: "text-sm font-medium",
        [UI.Nav]: "flex items-center gap-1",
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: "outline", size: "icon-xs" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute start-1"
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: "outline", size: "icon-xs" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute end-1"
        ),
        [UI.Dropdowns]: "flex gap-1 items-center justify-center",
        [UI.DropdownRoot]: "relative inline-flex items-center",
        [UI.Dropdown]:
          "absolute inset-0 opacity-0 cursor-pointer w-full text-[inherit]",
        [UI.MonthGrid]: "w-full border-collapse",
        [UI.Weekdays]: "flex",
        [UI.Weekday]: "text-muted-foreground rounded-sm w-10 text-[0.8rem] font-normal",
        [UI.Weeks]: "",
        [UI.Week]: "flex w-full mt-2",
        [UI.Day]: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[:has([aria-selected])]:bg-accent/50"
        ),
        [UI.DayButton]: cn(
          buttonVariants({ variant: "ghost", size: "icon-xs" }),
          "size-10 p-0 font-normal aria-selected:opacity-100"
        ),
        [DayFlag.today]: "bg-accent text-accent-foreground",
        [DayFlag.outside]: "text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        [DayFlag.disabled]: "text-muted-foreground opacity-50",
        [DayFlag.hidden]: "invisible",
        [SelectionState.selected]: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        [SelectionState.range_start]: "rounded-l-sm",
        [SelectionState.range_end]: "rounded-r-sm",
        [SelectionState.range_middle]: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          const { orientation, ...rest } = props as any
          if (orientation === "left") {
            return <ChevronRight className="size-4" {...rest} />
          }
          if (orientation === "right") {
            return <ChevronLeft className="size-4" {...rest} />
          }
          return <ChevronDown className="size-4" {...rest} />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
