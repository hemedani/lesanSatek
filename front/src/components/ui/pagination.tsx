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
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <p className="text-sm text-fog">
        صفحه {page}{totalPages ? ` از ${totalPages}` : ""}
      </p>
      <div className="flex items-center gap-2">
        <Link href={prevUrl} aria-disabled={!prevUrl}>
          <Button
            variant="ghost"
            size="sm"
            disabled={!prevUrl}
            className="gap-1 rounded-full text-moonlight disabled:opacity-50 disabled:text-fog"
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
            قبلی
          </Button>
        </Link>
        <Link href={nextUrl} aria-disabled={!nextUrl}>
          <Button
            variant="ghost"
            size="sm"
            disabled={!nextUrl}
            className="gap-1 rounded-full text-moonlight disabled:opacity-50 disabled:text-fog"
          >
            بعدی
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

export { Pagination }
