import { Skeleton } from "@/components/ui/skeleton"

export default function MyRequestsLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-col gap-3 border-b border-steel-border/30 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-36 rounded-sm" />
          <Skeleton className="h-10 w-40 rounded-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-10 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <Skeleton className="h-11 w-full lg:max-w-md lg:flex-1" />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <Skeleton className="h-11 min-w-44 flex-1 sm:flex-none" />
          <Skeleton className="h-11 min-w-44 flex-1 sm:flex-none" />
          <Skeleton className="h-11 min-w-44 flex-1 sm:flex-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Skeleton className="size-11 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="space-y-2 border-t border-steel-border/15 pt-3">
              <Skeleton className="h-3 w-52" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
