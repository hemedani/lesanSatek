import { Skeleton } from "@/components/ui/skeleton"

export default function UnitHeadRequestsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-steel-border/30 bg-graphite-plate/60 backdrop-blur-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <Skeleton className="h-11 w-full rounded-sm lg:min-w-64 lg:flex-1" />
        <div className="flex gap-2.5">
          <Skeleton className="h-11 w-44 rounded-sm" />
          <Skeleton className="h-11 w-44 rounded-sm" />
          <Skeleton className="h-11 w-36 rounded-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-steel-border/30 bg-graphite-plate/60 backdrop-blur-md p-5 space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="size-11 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}