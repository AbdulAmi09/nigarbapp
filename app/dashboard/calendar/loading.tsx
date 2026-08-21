import { DashboardSkeleton } from "@/components/dashboard-skeleton"

export default function Loading() {
  return <DashboardSkeleton summaryCards={4} cards={2} variant="detail" />
}
