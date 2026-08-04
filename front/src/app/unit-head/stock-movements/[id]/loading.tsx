import { Skeleton } from "@/components/ui/skeleton"

export default function StockMovementDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-40" />

      <div className="glass-card-conic-top glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <Skeleton className="size-14 rounded-2xl" />
          <div className="space-y-2.5">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
