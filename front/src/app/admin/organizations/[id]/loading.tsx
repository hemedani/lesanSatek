import { Skeleton } from "@/components/ui/skeleton"

export default function EditOrganizationLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="mb-8 flex flex-col gap-3 border-b border-steel-border/30 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-6 w-28 rounded-lg" />
      </div>

      <div className="sticky bottom-0 z-10">
        <div className="glass-card-conic-top flex items-center justify-between gap-6 rounded-xl border border-white/8 bg-graphite-plate/70 p-6 backdrop-blur-xl">
          <Skeleton className="h-4 w-44" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-11 w-36 rounded-xl" />
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
