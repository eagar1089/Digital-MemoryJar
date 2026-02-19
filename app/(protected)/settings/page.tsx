"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Bell, Lock, Database, Eye } from "lucide-react"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [aiSummary, setAiSummary] = useState(true)
  const [dataBackup, setDataBackup] = useState(true)

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
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
            <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/5 bg-transparent text-sm">
              Download My Data
            </Button>
            <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/5 bg-transparent text-sm">
              Clear Cache
            </Button>
          </div>
        </Card>

        {/* About */}
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
