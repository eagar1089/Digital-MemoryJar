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
    all: "?",
    happy: "😊",
    calm: "🌿",
    reflective: "🤔",
    peaceful: "🌙",
    excited: "🎉",
    grateful: "🙏",
    neutral: "📝",
  }

  function toDateKey(input: string | Date): string {
    if (typeof input === "string") {
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(input)
      if (isDateOnly) {
        return input
      }
    }

    const date = input instanceof Date ? input : new Date(input)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  function toUTCDateKey(input: string | Date): string {
    const date = input instanceof Date ? input : new Date(input)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, "0")
    const day = String(date.getUTCDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  function matchesSelectedDate(createdAt: string, selected: string | null): boolean {
    if (!selected) return true

    if (/^\d{4}-\d{2}-\d{2}/.test(createdAt) && createdAt.slice(0, 10) === selected) {
      return true
    }

    const localKey = toDateKey(createdAt)
    if (localKey === selected) return true

    const utcKey = toUTCDateKey(createdAt)
    return utcKey === selected
  }

  const filteredMemories = memories.filter((memory) => {
    const searchableText = `${memory.ai_summary || ""} ${memory.content || ""}`.toLowerCase()
    const matchesSearch =
      searchableText.includes(searchQuery.toLowerCase()) ||
      (memory.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesMood = !selectedMood || selectedMood === "all" || (memory.mood || "") === selectedMood
    const matchesDate = memory.created_at ? matchesSelectedDate(memory.created_at, selectedDate) : !selectedDate
    return matchesSearch && matchesMood && matchesDate
  })

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6 md:space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Memory Timeline</h1>
          <p className="text-muted-foreground">Browse your memories and reflections</p>
        </div>

        {error && (
          <Card className="glass border-destructive/30 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <Card className="glass border-primary/20 p-3 flex items-center gap-2 md:col-span-1">
            <Search size={18} className="text-muted-foreground" />
            <Input
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus:outline-none text-sm"
            />
          </Card>

          <Card className="glass border-primary/20 p-3 md:col-span-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Filter by mood</p>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
                <Button
                  key={mood}
                  onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
                  variant={selectedMood === mood ? "default" : "outline"}
                  size="sm"
                  className={`$${
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
          </Card>
        </div>

        {selectedDate && (
          <Card className="glass border-primary/20 p-3">
            <p className="text-xs text-muted-foreground">Showing memories for {selectedDate}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
