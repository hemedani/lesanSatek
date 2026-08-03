import { Skeleton } from "@/components/ui/skeleton"

export default function ManufacturersLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-col gap-3 border-b border-steel-border/30 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-11 w-44 rounded-sm" />
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <Skeleton className="h-11 w-full lg:max-w-md lg:flex-1" />
        <div className="flex flex-wrap items-stretch gap-2.5">
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
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-14 w-full rounded-xl" />
            <div className="flex items-center justify-between border-t border-steel-border/15 pt-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-9 w-20 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
