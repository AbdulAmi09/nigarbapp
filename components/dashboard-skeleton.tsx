import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton({
  summaryCards = 0,
  cards = 6,
  variant = "grid",
}: {
  summaryCards?: number
  cards?: number
  variant?: "grid" | "list" | "detail"
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {summaryCards > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: summaryCards }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {variant === "grid" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      )}

      {variant === "list" && (
        <div className="space-y-3">
          {Array.from({ length: cards }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {variant === "detail" && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}
