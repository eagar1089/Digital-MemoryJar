"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Bell, Lock, Database, Eye, Download, LogOut, Sun, Moon, UserCircle2 } from "lucide-react"
import { api } from "@/lib/api-client"
import { useTheme } from "@/lib/theme-provider"
import { useAuth } from "@/lib/auth-context"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import {
  showErrorAlert,
  showInfoAlert,
  showQuestionAlert,
  showSuccessAlert,
  showWarningAlert,
} from "@/lib/glass-alert"

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  const [notifications, setNotifications] = useState(true)
  const [aiSummary, setAiSummary] = useState(true)
  const [dataBackup, setDataBackup] = useState(true)
  const [showProfileCard, setShowProfileCard] = useState(true)
  const [actionError, setActionError] = useState("")
  const [actionSuccess, setActionSuccess] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("showProfileCard")
    if (stored === "false") {
      setShowProfileCard(false)
    }
  }, [])

  useEffect(() => {
    if (!actionSuccess) return
    const timer = window.setTimeout(() => setActionSuccess(""), 2500)
    return () => window.clearTimeout(timer)
  }, [actionSuccess])

  const persistShowProfileCard = (value: boolean) => {
    setShowProfileCard(value)
    localStorage.setItem("showProfileCard", value ? "true" : "false")
  }

  const accountAvatar =
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || "User")}&background=0D8ABC&color=fff&rounded=true`

  const handleExportMemories = async () => {
    setIsExporting(true)
    setActionError("")
    setActionSuccess("")
    try {
      const memories = await api.getMemories()
      const content = JSON.stringify(memories, null, 2)
      const blob = new Blob([content], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `memoryjar-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
      setActionSuccess("Memories exported successfully")
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to export memories")
    } finally {
      setIsExporting(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setActionError("")
    setActionSuccess("")
    try {
      setActionSuccess("Signed out successfully")
      await new Promise((resolve) => setTimeout(resolve, 600))
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to sign out")
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        {actionError && (
          <Card className="glass border-destructive/30 p-4">
            <p className="text-sm text-destructive">{actionError}</p>
          </Card>
        )}

        {actionSuccess && (
          <Card className="glass border-green-500/30 p-4">
            <p className="text-sm text-green-600 dark:text-green-400">{actionSuccess}</p>
          </Card>
        )}

        <Card className="glass border-primary/20 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <UserCircle2 className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold">Profile</h2>
          </div>

          <div className="flex items-center gap-3">
            <img src={accountAvatar} alt="Account avatar" className="w-12 h-12 rounded-full object-cover border border-primary/20" />
            <div>
              <p className="text-sm font-medium">Profile picture is managed by your email account</p>
              <p className="text-xs text-muted-foreground">Custom profile updates are disabled.</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Show Profile Card</p>
              <p className="text-xs text-muted-foreground">Enable or remove the profile card on profile page</p>
            </div>
            <button
              onClick={() => persistShowProfileCard(!showProfileCard)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showProfileCard ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showProfileCard ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </Card>

        <Card className="glass border-primary/20 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold">Theme</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["light", "dark", "auto"] as const).map((themeOption) => (
              <Button
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                variant={theme === themeOption ? "default" : "outline"}
                className={theme === themeOption ? "" : "border-primary/30 hover:bg-primary/5 bg-transparent"}
              >
                {themeOption === "light" && <Sun className="w-4 h-4 mr-1" />}
                {themeOption === "dark" && <Moon className="w-4 h-4 mr-1" />}
                {themeOption === "auto" ? "Auto" : themeOption[0].toUpperCase() + themeOption.slice(1)}
              </Button>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="glass border-primary/20 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold">Notifications</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Daily Reminders</p>
                <p className="text-xs text-muted-foreground">Get reminded to log your thoughts</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* AI Features */}
        <Card className="glass border-primary/20 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold">AI Features</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">AI Summaries</p>
                <p className="text-xs text-muted-foreground">Auto-generate summaries of your entries</p>
              </div>
              <button
                onClick={() => setAiSummary(!aiSummary)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  aiSummary ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aiSummary ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mood Detection</p>
                <p className="text-xs text-muted-foreground">Automatically detect your mood</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
              </button>
            </div>
          </div>
        </Card>

        {/* Privacy & Data */}
        <Card className="glass border-primary/20 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold">Privacy & Data</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto Backup</p>
                <p className="text-xs text-muted-foreground">Automatically backup your memories</p>
              </div>
              <button
                onClick={() => setDataBackup(!dataBackup)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  dataBackup ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    dataBackup ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="glass border-primary/20 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold">Data Management</h2>
          </div>
          <div className="space-y-2">
            <Button
              onClick={handleExportMemories}
              disabled={isExporting}
              variant="outline"
              className="w-full border-primary/30 hover:bg-primary/5 bg-transparent text-sm"
            >
              <Download size={14} className="mr-2" />
              {isExporting ? "Exporting..." : "Export Memories"}
            </Button>
            <Button
              onClick={handleSignOut}
              disabled={isSigningOut}
              variant="outline"
              className="w-full border-destructive/30 hover:bg-destructive/5 bg-transparent text-sm text-destructive hover:text-destructive"
            >
              <LogOut size={14} className="mr-2" />
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </Button>
          </div>
        </Card>

        {/* About */}
        <Card className="glass border-primary/20 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">SweetAlert2 Demo</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={showSuccessAlert}>
              Launch Success Toast
            </Button>
            <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={showInfoAlert}>
              Launch Info Toast
            </Button>
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={showErrorAlert}>
              Launch Error Toast
            </Button>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black" onClick={showWarningAlert}>
              Launch Warning Toast
            </Button>
            <Button size="sm" variant="outline" onClick={showQuestionAlert}>
              Launch Question Toast
            </Button>
          </div>
        </Card>

        <Card className="glass border-primary/20 p-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">Digital Memory Jar v1.0.0</p>
          <Link href="/about" className="text-xs text-primary hover:underline">
            Learn more about us
          </Link>
        </Card>
      </div>
    </main>
  )
}
