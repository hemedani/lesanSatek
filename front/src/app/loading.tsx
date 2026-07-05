import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-4 w-64 rounded-md" />
        <Skeleton className="mt-8 h-40 w-80 rounded-xl" />
      </div>
    </div>
  )
}
