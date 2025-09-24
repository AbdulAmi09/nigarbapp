import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to dashboard for now - will add proper auth later
  redirect("/dashboard")
}
