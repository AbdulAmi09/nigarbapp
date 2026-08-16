import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CallProvider from "@/components/call-provider"
import PresenceProvider from "@/components/presence-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal && aal.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
    redirect("/auth/mfa-challenge")
  }

  return (
    <PresenceProvider>
      <CallProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 p-6 bg-muted/20">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </CallProvider>
    </PresenceProvider>
  )
}
