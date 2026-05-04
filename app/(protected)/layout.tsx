"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import Link from "next/link"
import Image from "next/image"
import { LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import ModelHealthMonitor from "@/components/model-health-monitor"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

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
      <header className="fixed top-4 left-4 right-4 z-40">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/home"
              className="px-3 py-2 rounded-md"
            >
                <Image src="/logo.png" alt="Digital Memory Jar Logo" width={56} height={56} className="h-14 w-14 md:h-16 md:w-16" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="px-2 py-2 rounded-md text-foreground hover:bg-white/5 dark:hover:bg-black/10"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="pt-16">{children}</div>
    </>
  )
}
