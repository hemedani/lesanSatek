"use client"

import { ArrowDown, Pencil, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface RelationCardTone {
  icon: string
  badge: string
}

interface RelationCardProps {
  label: string
  name: string
  icon: React.ElementType
  tone: RelationCardTone
  isLast?: boolean
  deletable?: boolean
  busy?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

function RelationCard({
  label,
  name,
  icon: Icon,
  tone,
  isLast,
  deletable = true,
  busy,
  onEdit,
  onDelete,
}: RelationCardProps) {
  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border ring-1 ring-inset",
              tone.icon
            )}
          >
            <Icon className="size-5" />
          </div>
          {!isLast && (
            <div className="flex flex-col items-center py-1">
              <span className="h-3.5 w-px bg-gradient-to-b from-steel-border/40 to-electric-iris/30" aria-hidden="true" />
              <span className="flex size-7 items-center justify-center rounded-full border border-electric-iris/25 bg-electric-iris/10 shadow-[0_0_14px_-3px_rgba(102,58,243,0.55)]">
                <ArrowDown className="size-4 text-electric-iris" />
              </span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "min-w-0 flex-1 rounded-2xl border border-white/8 bg-graphite-plate/40 p-5 backdrop-blur-md",
            "shadow-[inset_0_0_0_1px_rgba(186,215,247,0.05),0_16px_32px_-20px_rgba(0,0,0,0.6)]",
            "transition-all duration-200 hover:border-frost-link/20 hover:bg-graphite-plate/60 hover:shadow-[inset_0_0_0_1px_rgba(186,215,247,0.1),0_0_24px_-8px_rgba(182,217,252,0.25),0_20px_40px_-20px_rgba(0,0,0,0.7)]"
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                tone.badge
              )}
            >
              {label}
            </span>
            <span className="min-w-0 flex-1 truncate text-body font-semibold text-glacier">{name}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="size-10 text-fog/60 hover:text-frost-link hover:bg-frost-link/5"
            onClick={onEdit}
            disabled={busy}
            title={`ویرایش ${label}`}
            aria-label={`ویرایش ${label}: ${name}`}
          >
            <Pencil className="size-5" />
          </Button>
          {deletable && (
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="size-10 text-fog/60 hover:text-ember hover:bg-ember/5"
              onClick={onDelete}
              disabled={busy}
              title={`حذف ${label}`}
              aria-label={`حذف ${label}: ${name}`}
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export { RelationCard }
export type { RelationCardProps }
