import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function ConsumptionLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-6 w-36" />
      <LoadingSkeleton type="table" count={3} />
    </div>
  );
}
