"use client"
import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function DashboardPage() {
  // Mock data for mood over time
  const moodData = [
    { day: "Mon", happy: 3, calm: 2, reflective: 1, peaceful: 2 },
    { day: "Tue", happy: 2, calm: 3, reflective: 2, peaceful: 1 },
    { day: "Wed", happy: 4, calm: 1, reflective: 2, peaceful: 2 },
    { day: "Thu", happy: 3, calm: 2, reflective: 3, peaceful: 1 },
    { day: "Fri", happy: 5, calm: 2, reflective: 1, peaceful: 3 },
    { day: "Sat", happy: 2, calm: 4, reflective: 1, peaceful: 4 },
    { day: "Sun", happy: 3, calm: 3, reflective: 2, peaceful: 3 },
  ]

  // Mock data for mood distribution
  const moodDistribution = [
    { name: "Happy", value: 22, emoji: "😊" },
    { name: "Calm", value: 17, emoji: "🌿" },
    { name: "Reflective", value: 12, emoji: "🤔" },
    { name: "Peaceful", value: 16, emoji: "🌙" },
  ]

  const topWords = ["growth", "achievement", "peace", "connection", "reflection", "joy", "mindfulness"]

  const insights = [
    "You've been more reflective this week. Consider exploring what's on your mind.",
    "Your mood tends to be most positive on Fridays and Saturdays.",
    "You mention 'growth' and 'achievement' frequently in your entries.",
    "Meditation and nature activities correlate with peaceful moods.",
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Your emotional journey this week</p>
        </div>

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
                    className="bg-gradient-to-r from-primary to-accent h-full rounded-full"
                    style={{ width: `${mood.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Mood trend chart */}
        <Card className="glass-gradient-secondary border-0 p-6 space-y-4">
          <h2 className="text-sm font-semibold">Mood Trend</h2>
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
                <Line type="monotone" dataKey="happy" stroke="oklch(0.65 0.15 280)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="calm" stroke="oklch(0.72 0.12 200)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

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
          </div>
        </Card>

        {/* AI Insights */}
        <Card className="glass-gradient-accent border-0 p-6 space-y-4">
          <h2 className="text-sm font-semibold">AI Insights</h2>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5"></div>
                <p className="text-sm text-muted-foreground">{insight}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="glass-gradient-primary border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">47</p>
            <p className="text-xs text-muted-foreground">Total Memories</p>
          </Card>
          <Card className="glass-gradient-secondary border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </Card>
          <Card className="glass-gradient-cool border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">8.2</p>
            <p className="text-xs text-muted-foreground">Avg. Mood</p>
          </Card>
          <Card className="glass-gradient-accent border-0 p-4 text-center space-y-2">
            <p className="text-2xl font-bold">92%</p>
            <p className="text-xs text-muted-foreground">Positive</p>
          </Card>
        </div>
      </div>
    </main>
  )
}
