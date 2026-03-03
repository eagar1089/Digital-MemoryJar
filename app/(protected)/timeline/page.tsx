"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MemoryCard } from "@/components/memory-card"
import { Search } from "lucide-react"
import { api, type Memory } from "@/lib/api-client"

export default function TimelinePage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [error, setError] = useState("")
  const selectedDate = searchParams.get("date")

  useEffect(() => {
    let mounted = true

    async function loadMemories() {
      try {
        const memoriesRes = await api.getMemories()
        if (!mounted) return
        setMemories(memoriesRes)
        setError("")
      } catch (err) {
        if (!mounted) return
        const message = err instanceof Error ? err.message : "Failed to load memories"
        setError(message)
      }
    }

    loadMemories()
    return () => {
      mounted = false
    }
  }, [])

  const moods = useMemo(() => {
    const set = new Set<string>()
    memories.forEach((memory) => {
      if (memory.mood) set.add(memory.mood)
    })
    return ["all", ...Array.from(set)]
  }, [memories])

  const moodEmojis: Record<string, string> = {
    all: "📋",
    happy: "😊",
    calm: "🌿",
    reflective: "🤔",
    peaceful: "🌙",
    excited: "🎉",
    grateful: "🙏",
    neutral: "📝",
  }

  const filteredMemories = memories.filter((memory) => {
    const searchableText = `${memory.ai_summary || ""} ${memory.content || ""}`.toLowerCase()
    const matchesSearch =
      searchableText.includes(searchQuery.toLowerCase()) ||
      (memory.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesMood = !selectedMood || selectedMood === "all" || (memory.mood || "") === selectedMood
    const memoryDate = memory.created_at ? new Date(memory.created_at).toISOString().slice(0, 10) : ""
    const matchesDate = !selectedDate || memoryDate === selectedDate
    return matchesSearch && matchesMood && matchesDate
  })

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Memory Timeline</h1>
          <p className="text-muted-foreground">Browse your memories and reflections</p>
        </div>

        {error && (
          <Card className="glass border-destructive/30 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        <Card className="glass border-primary/20 p-3 flex items-center gap-2">
          <Search size={18} className="text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent focus:outline-none text-sm"
          />
        </Card>

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
                <span className="mr-1">{moodEmojis[mood] || "📝"}</span>
                {mood.charAt(0).toUpperCase() + mood.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {selectedDate && (
          <Card className="glass border-primary/20 p-3">
            <p className="text-xs text-muted-foreground">Showing memories for {selectedDate}</p>
          </Card>
        )}

        <div className="space-y-3">
          {filteredMemories.length > 0 ? (
            filteredMemories.map((memory) => (
              <MemoryCard
                key={memory.id}
                id={memory.id}
                date={new Date(memory.created_at).toLocaleString()}
                summary={memory.ai_summary || memory.content}
                mood={memory.mood || "neutral"}
                tags={memory.tags || []}
              />
            ))
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
