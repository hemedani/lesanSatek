import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 pb-4 border-b border-steel-border/50">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-44" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} variant="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded-sm" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 mb-3" />
              <Skeleton className="h-px w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="glass">
          <CardHeader>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-28 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-5 w-36 rounded-md" />
            </div>
            <div className="flex gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
