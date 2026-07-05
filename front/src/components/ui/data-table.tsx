"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { cn } from "@/lib/utils"
import { ArrowUpDown } from "lucide-react"

interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  sortKey?: string
  onSort?: (key: string) => void
  className?: string
}

function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading,
  emptyTitle = "موردی یافت نشد",
  emptyDescription,
  emptyAction,
  sortKey,
  onSort,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingSkeleton type="table" count={5} />
  }

  if (!data.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  return (
    <div className={cn("rounded-lg bg-graphite-plate shadow-subtle-4 overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-[#282c35]">
            {columns.map((col, colIdx) => (
              <TableHead
                key={col.key}
                className={cn(
                  "text-caption font-medium text-fog tracking-wide h-9",
                  colIdx === 0 && "sticky start-0 z-10 bg-[#282c35]",
                  col.sortable && "cursor-pointer select-none",
                  col.className
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <ArrowUpDown className={cn(
                      "size-3.5",
                      sortKey === col.key ? "text-frost-link" : "text-fog"
                    )} />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={keyExtractor(item)}
              className={cn(
                "transition-all duration-200",
                index % 2 === 1 && "bg-white/[0.015]",
                "hover:bg-[rgba(182,217,252,0.03)] hover:border-s-2 hover:border-s-frost-link/30"
              )}
            >
              {columns.map((col, colIdx) => (
                <TableCell key={col.key} className={cn(
                  "py-2.5",
                  colIdx === 0 && "sticky start-0 z-10",
                  colIdx === 0 && (index % 2 === 1 ? "bg-[#2d313a]" : "bg-graphite-plate"),
                  col.className
                )}>
                  {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "—")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export { DataTable }
export type { Column }
