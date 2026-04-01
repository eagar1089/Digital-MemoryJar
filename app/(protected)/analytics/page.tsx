"use client"
import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { api, type Memory, type StatsResponse } from "@/lib/api-client"

type MoodDistributionItem = { name: string; value: number; emoji: string }

const moodEmojis: Record<string, string> = {
  happy: "😊",
  calm: "🌿",
  reflective: "🤔",
  peaceful: "🌙",
  excited: "🎉",
  grateful: "🙏",
  neutral: "📝",
  joy: "😊",
  sadness: "📝",
  anger: "📝",
  fear: "📝",
  surprise: "🎉",
  disgust: "📝",
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMonthlyView, setIsMonthlyView] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      try {
        const [statsData, memoriesData] = await Promise.all([api.getStats(), api.getMemories()])
        if (!mounted) return
        setStats(statsData)
        setMemories(memoriesData)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Failed to load analytics")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      mounted = false
    }
  }, [])

  const moodDistribution = useMemo<MoodDistributionItem[]>(() => {
    const source = stats?.top_emotions
    if (!source) return []
    const entries = Object.entries(source)
      .filter(([, value]) => Number.isFinite(value))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)

    return entries.map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round(value * 100),
      emoji: moodEmojis[name] || "📝",
    }))
  }, [stats?.top_emotions])

  const topWords = useMemo(() => {
    const counts = new Map<string, number>()
    for (const memory of memories) {
      for (const keyword of memory.nlp_insights?.keywords || []) {
        const key = keyword.toLowerCase()
        counts.set(key, (counts.get(key) || 0) + 1)
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([word]) => word)
  }, [memories])

  const weeklyMoodData = useMemo(() => {
    const now = new Date()
    const mondayBasedIndex = (now.getDay() + 6) % 7
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - mondayBasedIndex)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const dayMap = new Map<number, number>()
    for (const memory of memories) {
      const date = memory.created_at ? new Date(memory.created_at) : null
      if (!date || Number.isNaN(date.getTime())) continue

      if (date < weekStart || date >= weekEnd) continue

      const dayIndex = (date.getDay() + 6) % 7
      dayMap.set(dayIndex, (dayMap.get(dayIndex) || 0) + 1)
    }

    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => ({
      day,
      memories: dayMap.get(index) || 0,
    }))
  }, [memories])

  const monthlyMoodData = useMemo(() => {
    const now = new Date()
    const weekMap = new Map<string, number>()
    
    for (const memory of memories) {
      const date = memory.created_at ? new Date(memory.created_at) : null
      if (!date || Number.isNaN(date.getTime())) continue
      
      const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff < 7) {
        weekMap.set("Week 4", (weekMap.get("Week 4") || 0) + 1)
      } else if (daysDiff < 14) {
        weekMap.set("Week 3", (weekMap.get("Week 3") || 0) + 1)
      } else if (daysDiff < 21) {
        weekMap.set("Week 2", (weekMap.get("Week 2") || 0) + 1)
      } else if (daysDiff < 28) {
        weekMap.set("Week 1", (weekMap.get("Week 1") || 0) + 1)
      }
    }

    return ["Week 1", "Week 2", "Week 3", "Week 4"].map((week) => ({
      day: week,
      memories: weekMap.get(week) || 0,
    }))
  }, [memories])

  const moodData = isMonthlyView ? monthlyMoodData : weeklyMoodData

  const insights = useMemo(() => {
    const items: string[] = []
    if (stats?.most_common_mood) {
      items.push(`Most common mood: ${stats.most_common_mood}.`)
    }
    if (stats?.top_topics && stats.top_topics.length > 0) {
      items.push(`Top topics: ${stats.top_topics.slice(0, 3).join(", ")}.`)
    }
    if (memories.length > 0) {
      items.push(`You have logged ${memories.length} recent memories.`)
    }
    if (items.length === 0) {
      items.push("Add more memories to unlock analytics insights.")
    }
    return items
  }, [stats?.most_common_mood, stats?.top_topics, memories.length])

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Your emotional journey this week</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Mood distribution */}
        <Card className="glass-gradient-primary border-0 p-6 space-y-4">
          <h2 className="text-sm font-semibold">Mood Distribution</h2>
          <div className="space-y-3">
            {moodDistribution.map((mood) => (
              <div key={mood.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{mood.emoji}</span>
                    {mood.name}
                  </span>
                  <span className="font-medium">{mood.value}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-primary to-accent h-full rounded-full"
                    style={{ width: `${mood.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Mood trend chart */}
        <Card className="glass-gradient-secondary border-0 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Mood Trend</h2>
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                {isMonthlyView ? "Monthly" : "Weekly"}
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isMonthlyView}
                  onChange={(e) => setIsMonthlyView(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors duration-200 border border-primary/20"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white dark:bg-background rounded-full transition-transform duration-200 peer-checked:translate-x-5 shadow-sm"></div>
              </div>
            </label>
          </div>
          <div className="w-full h-48 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
                <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="memories" stroke="oklch(0.65 0.15 280)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Word cloud */}
        <Card className="glass-gradient-cool border-0 p-6 space-y-4">
          <h2 className="text-sm font-semibold">Most Frequent Words</h2>
          <div className="flex flex-wrap gap-2">
            {topWords.map((word, i) => (
              <span
                key={word}
                className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                style={{ opacity: 1 - i * 0.1 }}
              >
                {word}
              </span>
            ))}
            {topWords.length === 0 && <p className="text-sm text-muted-foreground">No keywords yet</p>}
          </div>
        </Card>

        {/* AI Insights */}
        <Card className="glass-gradient-accent border-0 p-6 space-y-4">
          <h2 className="text-sm font-semibold">AI Insights</h2>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5"></div>
                <p className="text-sm text-muted-foreground">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
        </div>

        {error && <Card className="glass border-destructive/20 p-4 text-sm text-destructive">{error}</Card>}
        {loading && <Card className="glass border-primary/20 p-4 text-sm text-muted-foreground">Loading analytics...</Card>}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="glass-gradient-primary border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">{stats?.total_memories ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total Memories</p>
          </Card>
          <Card className="glass-gradient-secondary border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">{memories.length}</p>
            <p className="text-xs text-muted-foreground">Loaded Memories</p>
          </Card>
          <Card className="glass-gradient-cool border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">{stats?.top_topics?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Top Topics</p>
          </Card>
          <Card className="glass-gradient-accent border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">{stats?.most_common_mood ? "✓" : "-"}</p>
            <p className="text-xs text-muted-foreground">Mood Detected</p>
          </Card>
        </div>
      </div>
    </main>
  )
}
