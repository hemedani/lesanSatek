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
import { ArrowUpDown, LayoutGrid, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  className?: string
  hideOnCard?: boolean
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
  cardView?: boolean
  onViewToggle?: () => void
  renderCard?: (item: T) => React.ReactNode
}

const TABLE_BREAKPOINT = "lg"

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
  cardView,
  onViewToggle,
  renderCard,
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

  const renderTableView = (
    <div className={cn("rounded-lg glass-card glass-card-hover-active", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-[#282c35] border-b border-steel-border/30">
            {columns.map((col, colIdx) => (
              <TableHead
                key={col.key}
                className={cn(
                  "text-caption font-medium text-fog/80 tracking-wide h-10 px-3 py-0",
                  colIdx === 0 && "sticky start-0 z-10 bg-[#282c35]",
                  col.sortable && "cursor-pointer select-none",
                  col.hideOnCard && "hidden lg:table-cell",
                  col.className
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className="flex items-center gap-1.5">
                  {col.label}
                  {col.sortable && (
                    <ArrowUpDown className={cn(
                      "size-3.5 transition-colors duration-200",
                      sortKey === col.key ? "text-frost-link" : "text-fog/40"
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
                "group/row transition-all duration-200 border-b border-steel-border/10",
                index % 2 === 1 && "bg-white/[0.012]",
                "hover:bg-white/[0.02]"
              )}
            >
              {columns.map((col, colIdx) => (
                <TableCell key={col.key} className={cn(
                  "py-3 px-3 align-middle",
                  colIdx === 0 && "sticky start-0 z-10",
                  colIdx === 0 && (index % 2 === 1 ? "bg-[#2d313a]" : "bg-graphite-plate"),
                  col.hideOnCard && "hidden lg:table-cell",
                  col.className
                )}>
                  <div className={cn(
                    "transition-all duration-200",
                    "group-hover/row:translate-x-0.5"
                  )}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "—")}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const renderCardView = renderCard ? (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={keyExtractor(item)}>
          {renderCard(item)}
        </div>
      ))}
    </div>
  ) : null

  return (
    <div>
      {onViewToggle && (
        <div className="flex items-center justify-end mb-3 gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onViewToggle}
            className={cn(
              "rounded-lg transition-all duration-200",
              cardView ? "text-fog/50" : "text-frost-link bg-white/[0.03]"
            )}
          >
            <Table2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onViewToggle}
            className={cn(
              "rounded-lg transition-all duration-200",
              cardView ? "text-frost-link bg-white/[0.03]" : "text-fog/50"
            )}
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
      )}

      {/* Table view — hidden on mobile when card view is active */}
      <div className={cn(
        cardView ? "hidden" : "block",
      )}>
        {renderTableView}
      </div>

      {/* Card view — shown on mobile or when toggled */}
      <div className={cn(cardView ? "block" : "hidden")}>
        {renderCardView || (
          <div className="space-y-3 lg:hidden">
            {data.map((item) => (
              <div
                key={keyExtractor(item)}
                className="glass-card glass-card-hover-active rounded-xl p-4 space-y-3"
              >
                {columns.filter(c => !c.hideOnCard).map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-2">
                    <span className="text-caption text-fog/60 font-medium tracking-wide shrink-0">
                      {col.label}
                    </span>
                    <span className="text-sm text-moonlight text-end">
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "—")}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { DataTable }
export type { Column }