import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface LoadingSkeletonProps {
  type?: "table" | "card" | "list"
  count?: number
  className?: string
}

function LoadingSkeleton({ type = "table", count = 5, className }: LoadingSkeletonProps) {
  if (type === "card") {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl bg-graphite-plate p-4 shadow-subtle">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (type === "list") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg bg-graphite-plate p-3 shadow-subtle">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-2.5 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-4 rounded-lg bg-graphite-plate p-3 shadow-subtle">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg bg-graphite-plate p-3 shadow-subtle">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export { LoadingSkeleton }
