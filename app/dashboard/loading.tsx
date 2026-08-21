import { DashboardSkeleton } from "@/components/dashboard-skeleton"

export default function Loading() {
  return <DashboardSkeleton summaryCards={4} cards={3} variant="grid" />
}
