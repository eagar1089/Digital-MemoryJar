"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Settings, Download, LogOut, Moon, Sun } from "lucide-react"
import { api, type Memory, type StatsResponse } from "@/lib/api-client"
import { useTheme } from "@/lib/theme-provider"
import { useAuth } from "@/lib/auth-context"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"

export default function ProfilePage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [name, setName] = useState("User")
  const [email, setEmail] = useState("-")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showProfileCard, setShowProfileCard] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        const [me, statsRes, memoriesRes] = await Promise.all([api.getMe(), api.getStats(), api.getMemories()])
        if (!mounted) return
        setStats(statsRes)
        setMemories(memoriesRes)
        setEmail(me?.email || "-")
        setName(me?.email ? me.email.split("@")[0] : "User")
        setError("")
      } catch (err) {
        if (!mounted) return
        const message = err instanceof Error ? err.message : "Failed to load profile"
        setError(message)
      }
    }

    loadData()

    const stored = localStorage.getItem("showProfileCard")
    if (stored === "false") {
      setShowProfileCard(false)
    }

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => setSuccess(""), 2500)
    return () => window.clearTimeout(timer)
  }, [success])

  const thisMonthCount = useMemo(() => {
    const now = new Date()
    return memories.filter((memory) => {
      const date = new Date(memory.created_at)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length
  }, [memories])

  const initials = name.slice(0, 2).toUpperCase()

  const handleExportMemories = async () => {
    setIsExporting(true)
    setError("")
    setSuccess("")
    try {
      const data = await api.getMemories()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `memoryjar-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
      setSuccess("Memories exported successfully")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export memories")
    } finally {
      setIsExporting(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setError("")
    setSuccess("")
    try {
      setSuccess("Signed out successfully")
      await new Promise((resolve) => setTimeout(resolve, 600))
      await signOut(auth)
      router.push("/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign out")
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          <Link href="/settings">
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Settings size={20} />
            </Button>
          </Link>
        </div>

        {error && (
          <Card className="glass border-destructive/30 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {success && (
          <Card className="glass border-green-500/30 p-4">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </Card>
        )}

        {showProfileCard && (
          <Card className="glass-gradient-primary border-0 p-6 space-y-4">
            <div className="flex items-center gap-4">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border border-primary/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl">
                  {initials}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-bold">{name}</h2>
                <p className="text-sm text-muted-foreground">{email}</p>
                <p className="text-xs text-muted-foreground mt-1">Account connected</p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card className="glass-gradient-primary border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">{stats?.total_memories ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total Memories</p>
          </Card>
          <Card className="glass-gradient-secondary border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold capitalize">{stats?.most_common_mood || "-"}</p>
            <p className="text-xs text-muted-foreground">Common Mood</p>
          </Card>
          <Card className="glass-gradient-cool border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">{thisMonthCount}</p>
            <p className="text-xs text-muted-foreground">This Month</p>
          </Card>
          <Card className="glass-gradient-accent border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">{stats?.top_topics?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Top Topics</p>
          </Card>
        </div>

        <Card className="glass-gradient-secondary border-0 p-4 space-y-3">
          <p className="text-sm font-semibold">Theme</p>
          <div className="flex gap-2">
            {(["light", "dark", "auto"] as const).map((t) => (
              <Button
                key={t}
                onClick={() => setTheme(t)}
                variant={theme === t ? "default" : "outline"}
                size="sm"
                className={`flex-1 ${
                  theme === t
                    ? "bg-primary text-primary-foreground"
                    : "border-primary/30 hover:bg-primary/5 bg-transparent"
                }`}
              >
                {t === "light" && <Sun size={16} className="mr-1" />}
                {t === "dark" && <Moon size={16} className="mr-1" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
        </Card>

        <div className="space-y-2 pt-4">
          <Button
            onClick={handleExportMemories}
            disabled={isExporting}
            variant="outline"
            className="w-full border-primary/30 hover:bg-primary/5 bg-transparent"
          >
            <Download size={16} className="mr-2" />
            {isExporting ? "Exporting..." : "Export Memories"}
          </Button>
          <Button
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="outline"
            className="w-full border-destructive/30 hover:bg-destructive/5 bg-transparent text-destructive hover:text-destructive"
          >
            <LogOut size={16} className="mr-2" />
            {isSigningOut ? "Signing Out..." : "Sign Out"}
          </Button>
        </div>
      </div>
    </main>
  )
}
