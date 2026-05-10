"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import Link from "next/link"
import Image from "next/image"
import { LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import ModelHealthMonitor from "@/components/model-health-monitor"

const navContent: Record<string, { title: string; subtitle: string }> = {
  "/home": { title: "Home", subtitle: "Your memory dashboard" },
  "/dashboard": { title: "Dashboard", subtitle: "Live memory analytics" },
  "/analytics": { title: "Analytics", subtitle: "Your emotional journey this week" },
  "/timeline": { title: "Timeline", subtitle: "Browse your memories chronologically" },
  "/add": { title: "Add Memory", subtitle: "Capture a new moment" },
  "/profile": { title: "Profile", subtitle: "Manage your account and preferences" },
  "/settings": { title: "Settings", subtitle: "Tune your experience" },
  "/companion": { title: "AI Companion", subtitle: "Ask questions about your memories" },
}

function getNavContent(pathname: string) {
  if (/^\/[^/]+\/[^/]+$/.test(pathname) && pathname !== "/home") {
    return { title: "Memory Detail", subtitle: "Review a single memory in context" }
  }

  return navContent[pathname] ?? { title: "Digital Memory Jar", subtitle: "Your memory workspace" }
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const { title, subtitle } = getNavContent(pathname)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login")
      } else {
        setAuthorized(true)
      }
      setChecking(false)
    })

    return () => unsub()
  }, [router])

  if (checking) return null
  if (!authorized) return null

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.replace("/login")
    } catch (err) {
      console.error("Sign out failed", err)
    }
  }

  return (
    <>
      <ModelHealthMonitor />
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-border/60 bg-background shadow-lg shadow-slate-900/10 dark:border-border/60 dark:bg-background dark:shadow-black/30">
      <div
        role="navigation"
        aria-label="Primary"
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background px-4 shadow-[0_8px_32px_rgba(15,23,42,0.12)] sm:px-6 lg:px-8 dark:border-border/60 dark:bg-background dark:shadow-[0_8px_32px_rgba(0,0,0,0.28)]"
      >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link href="/home" className="flex shrink-0 items-center rounded-xl p-1 transition-colors hover:bg-muted/60">
              <Image
                src="/logo.png"
                alt="Digital Memory Jar Logo"
                width={150}
                height={150}
                className="h-31 w-31 shrink-0"
              />
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <LogOut size={20} />
            </button>
          </div>
      </div>
      </header>

      <div className="pt-16">{children}</div>
    </>
  )
}
