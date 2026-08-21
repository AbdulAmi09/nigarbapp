import { DashboardSkeleton } from "@/components/dashboard-skeleton"

export default function Loading() {
  return <DashboardSkeleton summaryCards={3} cards={5} variant="list" />
}
