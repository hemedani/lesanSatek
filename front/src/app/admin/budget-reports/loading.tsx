import { Skeleton } from "@/components/ui/skeleton"

export default function BudgetReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-col gap-3 border-b border-steel-border/30 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>

      <div className="flex flex-wrap items-stretch gap-2.5">
        <Skeleton className="h-11 min-w-48 flex-1 sm:flex-none" />
        <Skeleton className="h-11 min-w-48 flex-1 sm:flex-none" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 flex items-start gap-3">
              <Skeleton className="size-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
          ))}
        </div>
        <div className="glass-card rounded-2xl p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.04]">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}