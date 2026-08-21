import { DashboardSkeleton } from "@/components/dashboard-skeleton"

export default function Loading() {
  return <DashboardSkeleton summaryCards={2} cards={4} variant="grid" />
}
