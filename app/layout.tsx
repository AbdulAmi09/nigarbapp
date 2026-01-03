import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

// Geist is not exported from `geist/font`. Load Geist as a local font instead.
import localFont from "next/font/local"
import { Source_Serif_4 } from "next/font/google"
import { Inter } from "next/font/google"

// Initialize fonts
const _geist = localFont({
  src: "./fonts/Geist-Regular.woff2",
  variable: '--v0-font-geist',
})

const _geistMono = localFont({
  src: "./fonts/GeistMono-Regular.woff2",
  variable: '--v0-font-geist-mono',
})

const _sourceSerif_4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["200","300","400","500","600","700","800","900"],
  variable: '--v0-font-source-serif-4'
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["100","200","300","400","500","600","700","800","900"],
  variable: "--font-inter"
})

const _v0_fontVariables = `${_geist.variable} ${_geistMono.variable} ${_sourceSerif_4.variable}`

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
      <body className={`${inter.variable} ${_sourceSerif_4.variable} font-sans ${_v0_fontVariables}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Suspense fallback={null}>{children}</Suspense>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
