"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  prevUrl: string
  nextUrl: string
  page: number
  totalPages?: number
  className?: string
}

function Pagination({ prevUrl, nextUrl, page, totalPages, className }: PaginationProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="text-sm text-fog order-2 sm:order-1 text-center sm:text-start">
        صفحه {page}{totalPages ? ` از ${totalPages}` : ""}
      </p>
      <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
        <Link href={prevUrl} aria-disabled={!prevUrl}>
          <Button
            variant="ghost"
            size="sm"
            disabled={!prevUrl}
            className="gap-1 rounded-full text-moonlight disabled:opacity-50 disabled:text-fog h-8"
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
            <span className="hidden sm:inline">قبلی</span>
          </Button>
        </Link>
        <Link href={nextUrl} aria-disabled={!nextUrl}>
          <Button
            variant="ghost"
            size="sm"
            disabled={!nextUrl}
            className="gap-1 rounded-full text-moonlight disabled:opacity-50 disabled:text-fog h-8"
          >
            <span className="hidden sm:inline">بعدی</span>
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

export { Pagination }
