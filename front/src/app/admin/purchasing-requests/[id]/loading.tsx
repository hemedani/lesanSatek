import { Skeleton } from "@/components/ui/skeleton"

export default function PurchasingRequestDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-steel-border/50">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-36 mt-1" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
