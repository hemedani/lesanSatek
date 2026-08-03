import { Skeleton } from "@/components/ui/skeleton"

export default function BudgetLinesLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-col gap-3 border-b border-steel-border/30 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-11 w-44 rounded-sm" />
        </div>
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <Skeleton className="h-11 w-full lg:max-w-md lg:flex-1" />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <Skeleton className="h-11 min-w-40 flex-1 sm:flex-none" />
          <Skeleton className="h-11 min-w-40 flex-1 sm:flex-none" />
          <Skeleton className="h-11 min-w-40 flex-1 sm:flex-none" />
          <Skeleton className="h-11 min-w-44 flex-1 sm:flex-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Skeleton className="size-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="bg-[#05060f]/60 p-3 text-center space-y-2">
                  <Skeleton className="h-3 w-16 mx-auto" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-steel-border/15 pt-3">
              <Skeleton className="h-3 w-28" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-sm" />
                <Skeleton className="h-9 w-9 rounded-sm" />
                <Skeleton className="h-9 w-9 rounded-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
