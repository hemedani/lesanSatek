import { Skeleton } from "@/components/ui/skeleton"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

export default function OrganizationsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-steel-border/50">
        <div>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-3 w-44 mt-1.5" />
        </div>
        <Skeleton className="h-9 w-32 rounded-sm" />
      </div>
      <Skeleton className="h-9 w-56 rounded-sm" />
      <LoadingSkeleton type="table" count={5} />
    </div>
  );
}
