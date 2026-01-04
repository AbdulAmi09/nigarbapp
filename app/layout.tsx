import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

// Use Google Fonts (Vercel-compatible)
import { Inter, Source_Serif_4 } from 'next/font/google'

const inter = Inter({
  subsets: ["latin"],
  weight: ["100","200","300","400","500","600","700","800","900"],
  variable: "--font-inter",
})

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["200","300","400","500","600","700","800","900"],
  variable: '--font-source-serif-4',
})

const fontVariables = `${inter.variable} ${sourceSerif4.variable}`

export const metadata: Metadata = {
  title: "NCAA Dashboard - Nigeria Chess Arbiters Association",
  description: "Official dashboard for Nigeria Chess Arbiters Association members",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVariables} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Suspense fallback={null}>{children}</Suspense>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
