"use client"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MemoryCard } from "@/components/memory-card"
import { Search } from "lucide-react"
import { api, type Memory } from "@/lib/api-client"

function formatMemoryDate(value?: string) {
  if (!value) return "Unknown date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown date"
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function TimelinePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const moods = ["all", "happy", "calm", "reflective", "peaceful", "excited", "grateful"]
  const moodEmojis: Record<string, string> = {
    all: "📋",
    happy: "😊",
    calm: "🌿",
    reflective: "🤔",
    peaceful: "🌙",
    excited: "🎉",
    grateful: "🙏",
  }

  useEffect(() => {
    let mounted = true

    const loadMemories = async () => {
      try {
        const data = await api.getMemories()
        if (!mounted) return
        setMemories(data)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Failed to load memories")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadMemories()
    return () => {
      mounted = false
    }
  }, [])

  const timelineMemories = useMemo(
    () =>
      memories.map((memory) => ({
        id: memory.id,
        date: formatMemoryDate(memory.created_at),
        summary: memory.ai_summary || memory.content,
        mood: (memory.mood || "reflective").toLowerCase(),
        tags: memory.tags || [],
      })),
    [memories],
  )

  const filteredMemories = timelineMemories.filter((memory) => {
    const normalizedQuery = searchQuery.toLowerCase()
    const matchesSearch =
      memory.summary.toLowerCase().includes(normalizedQuery) ||
      memory.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    const matchesMood = !selectedMood || selectedMood === "all" || memory.mood === selectedMood
    return matchesSearch && matchesMood
  })

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Memory Timeline</h1>
          <p className="text-muted-foreground">Browse your memories and reflections</p>
        </div>

        {/* Search */}
        <Card className="glass border-primary/20 p-3 flex items-center gap-2">
          <Search size={18} className="text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent focus:outline-none text-sm"
          />
        </Card>

        {/* Mood filters */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Filter by mood</p>
          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => (
              <Button
                key={mood}
                onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
                variant={selectedMood === mood ? "default" : "outline"}
                size="sm"
                className={`${
                  selectedMood === mood
                    ? "bg-primary text-primary-foreground"
                    : "border-primary/30 hover:bg-primary/5 bg-transparent"
                }`}
              >
                <span className="mr-1">{moodEmojis[mood]}</span>
                {mood.charAt(0).toUpperCase() + mood.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <Card className="glass border-destructive/20 p-4 text-sm text-destructive">{error}</Card>
        )}

        {/* Memories list */}
        <div className="space-y-3">
          {loading ? (
            <Card className="glass border-primary/20 p-8 text-center space-y-2">
              <p className="text-muted-foreground">Loading memories...</p>
            </Card>
          ) : filteredMemories.length > 0 ? (
            filteredMemories.map((memory) => <MemoryCard key={memory.id} {...memory} />)
          ) : (
            <Card className="glass border-primary/20 p-8 text-center space-y-2">
              <p className="text-muted-foreground">No memories found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
