"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { api, type Memory, type StatsResponse } from "@/lib/api-client"

const moodEmoji: Record<string, string> = {
  happy: "😊",
  calm: "🌿",
  reflective: "🤔",
  peaceful: "🌙",
  sadness: "😔",
  anger: "😠",
  fear: "😟",
  surprise: "😮",
  disgust: "🤢",
  neutral: "📝",
}


export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        const [statsRes, memoriesRes] = await Promise.all([api.getStats(), api.getMemories()])
        if (!mounted) return
        setStats(statsRes)
        setMemories(memoriesRes)
        setError("")
      } catch (err) {
        if (!mounted) return
        const message = err instanceof Error ? err.message : "Failed to load analytics"
        setError(message)
      }
    }

    loadData()
    return () => {
      mounted = false
    }
  }, [])

  const thisWeekCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return memories.filter((memory) => new Date(memory.created_at).getTime() >= weekAgo).length
  }, [memories])

  const moodDistribution = useMemo(() => {
    const total = memories.length || 1
    const counts = new Map<string, number>()

    memories.forEach((memory) => {
      const mood = (memory.mood || "neutral").toLowerCase()
      counts.set(mood, (counts.get(mood) || 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([name, count]) => ({name, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
  }, [memories])

  const topTags = useMemo(() => {
    const counts = new Map<string, number>()
    memories.forEach((memory) => {
      ;(memory.tags || []).forEach((tag) => {
        const key = tag.toLowerCase()
        counts.set(key, (counts.get(key) || 0) + 1)
      })
    })

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag)
  }, [memories])

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6 md:space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Live memory analytics</p>
        </div>

        {error && (
          <Card className="glass border-destructive/30 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="glass-gradient-primary border-0 p-6 space-y-4 md:col-span-2">
            <p className="text-sm text-muted-foreground">AI Insights</p>
            <div className="pt-2 border-t border-border/50">
              <p className="text-sm font-medium">Coming soon</p>
            </div>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
            <Card className="glass-gradient-primary border-0 p-4 text-center space-y-2">
              <p className="text-2xl font-bold">{stats?.total_memories ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Memories</p>
            </Card>
            <Card className="glass-gradient-secondary border-0 p-4 text-center space-y-2">
              <p className="text-2xl font-bold">{thisWeekCount}</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </Card>
            <Card className="glass-gradient-cool border-0 p-4 text-center space-y-2">
              <p className="text-2xl font-bold capitalize">{stats?.most_common_mood || "-"}</p>
              <p className="text-xs text-muted-foreground">Most Common Mood</p>
            </Card>
            <Card className="glass-gradient-accent border-0 p-4 text-center space-y-2">
              <p className="text-2xl font-bold">{(stats?.top_topics || []).length}</p>
              <p className="text-xs text-muted-foreground">Top Topics</p>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="glass-gradient-primary border-0 p-6 space-y-4">
          <h2 className="text-sm font-semibold">Mood Distribution</h2>
          {moodDistribution.length > 0 ? (
            <div className="space-y-3">
              {moodDistribution.map((mood) => (
                <div key={mood.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 capitalize">
                      <span>{moodEmoji[mood.name] || "📝"}</span>
                      {mood.name}
                    </span>
                    <span className="font-medium">{mood.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-linear-to-r from-primary to-accent h-full rounded-full" style={{ width: `${mood.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No mood data available yet.</p>
          )}
        </Card>

        <Card className="glass-gradient-secondary border-0 p-6 space-y-4">
          <h2 className="text-sm font-semibold">Frequent Tags</h2>
          <div className="flex flex-wrap gap-2">
            {topTags.length > 0 ? (
              topTags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No tags available yet.</p>
            )}
          </div>
        </Card>
        </div>
      </div>
    </main>
  )
}
