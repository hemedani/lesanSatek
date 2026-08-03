"use client"

import * as React from "react"
import { Pencil, Share2, Trash2, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EntityCardProps {
  icon: React.ElementType
  iconClassName?: string
  title: string
  titleHref?: string
  subtitle?: string
  badge?: string
  badgeClassName?: string
  stats?: { label: string; value: string }[]
  children?: React.ReactNode
  meta?: React.ReactNode
  date?: string
  onEdit?: () => void
  onRelations?: () => void
  onDelete?: () => void
  className?: string
}

function faDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function EntityCard({
  icon: Icon,
  iconClassName,
  title,
  titleHref,
  subtitle,
  badge,
  badgeClassName,
  stats,
  children,
  meta,
  date,
  onEdit,
  onRelations,
  onDelete,
  className,
}: EntityCardProps) {
  const titleEl = titleHref ? (
    <a
      href={titleHref}
      className="block truncate text-base font-semibold text-moonlight transition-colors hover:text-electric-iris"
    >
      {title}
    </a>
  ) : (
    <span className="block truncate text-base font-semibold text-moonlight">{title}</span>
  )

  return (
    <div className={cn("glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
              iconClassName || "bg-electric-iris/10 text-electric-iris ring-electric-iris/15",
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 space-y-1.5">
            {titleEl}
            {subtitle && <p className="truncate text-xs text-fog/70">{subtitle}</p>}
          </div>
        </div>
        {badge && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 font-mono text-xs",
              badgeClassName || "border-white/10 bg-white/[0.03] text-fog",
            )}
            dir="ltr"
          >
            {badge}
          </span>
        )}
      </div>

      {stats && (
        <div className="grid gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0 bg-[#05060f]/60 p-3 text-center">
              <p className="text-[11px] text-fog/60">{stat.label}</p>
              <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6">{stat.value || "—"}</p>
            </div>
          ))}
        </div>
      )}

      {children}

      {meta && (
        <div className="mt-auto flex items-start gap-2 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
          {meta}
        </div>
      )}

      {(onEdit || onRelations || onDelete || date) && (
        <div className="flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
          <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70">
            <CalendarDays className="size-4 text-fog/60" />
            {date ? faDate(date) : "—"}
          </span>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon-lg"
                className="size-9 text-fog/60 hover:text-moonlight"
                onClick={onEdit}
                title="ویرایش"
              >
                <Pencil className="size-5" />
              </Button>
            )}
            {onRelations && (
              <Button
                variant="ghost"
                size="icon-lg"
                className="size-9 text-fog/60 hover:text-frost-link"
                onClick={onRelations}
                title="روابط"
              >
                <Share2 className="size-5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-lg"
                className="size-9 text-fog/60 hover:text-ember hover:bg-ember/5"
                onClick={onDelete}
                title="حذف"
              >
                <Trash2 className="size-5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { EntityCard, faDate }
export type { EntityCardProps }
