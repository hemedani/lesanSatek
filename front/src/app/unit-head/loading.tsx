import { Skeleton } from "@/components/ui/skeleton"

export default function UnitHeadLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-steel-border/30 bg-graphite-plate/60 backdrop-blur-md p-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-steel-border/30 bg-graphite-plate/60 backdrop-blur-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}