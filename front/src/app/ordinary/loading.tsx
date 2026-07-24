import { Skeleton } from "@/components/ui/skeleton"

export default function OrdinaryLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="rounded-xl border border-steel-border/30 bg-graphite-plate/50 p-6 sm:p-8 space-y-4">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Skeleton className="size-20 shrink-0 rounded-full" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-steel-border/30 bg-graphite-plate/50 p-6 sm:p-8 space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  )
}
