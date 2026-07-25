import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

export default function RequestsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="flex gap-1">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>

      <Card variant="glass">
        <CardContent className="p-0">
          <LoadingSkeleton count={8} />
        </CardContent>
      </Card>
    </div>
  )
}
