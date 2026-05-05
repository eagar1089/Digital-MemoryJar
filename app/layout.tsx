import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/lib/theme-provider"
import { FloatingNav } from "@/components/floating-nav"
import { ClientAuthProvider } from "@/components/auth-provider"
import { PWARegister } from "@/components/pwa-register"
import "./globals.css"
import "sweetalert2/dist/sweetalert2.min.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Digital Memory Jar",
  description: "AI-powered personal life logger",
  generator: "v0.app",
  // 
  // icons are defined in manifest.webmanifest for PWA support, but we can also add them here for better compatibility with various platforms and crawlers
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <ClientAuthProvider>
          <ThemeProvider>
            <PWARegister />
            {children}
            <FloatingNav />
          </ThemeProvider>
        </ClientAuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
