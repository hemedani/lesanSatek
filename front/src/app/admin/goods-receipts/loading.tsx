import { Skeleton } from "@/components/ui/skeleton"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

export default function GoodsReceiptsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-9 w-56 rounded-sm" />
      <LoadingSkeleton type="table" count={4} />
    </div>
  );
}
