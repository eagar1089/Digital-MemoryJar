"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MemoryCard } from "@/components/memory-card"
import { Search } from "lucide-react"

export default function TimelinePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMood, setSelectedMood] = useState<string | null>(null)

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

  // Mock data
  const memories = [
    {
      id: "1",
      date: "Today at 2:30 PM",
      summary: "Had a productive day at work. Completed the project milestone and felt accomplished.",
      mood: "happy",
      tags: ["work", "achievement", "productivity"],
    },
    {
      id: "2",
      date: "Yesterday at 8:00 PM",
      summary: "Evening walk in the park. Reflected on personal growth and future goals.",
      mood: "reflective",
      tags: ["nature", "reflection", "growth"],
    },
    {
      id: "3",
      date: "2 days ago at 6:15 PM",
      summary: "Meditation session. Feeling peaceful and centered after a busy week.",
      mood: "peaceful",
      tags: ["mindfulness", "wellness", "peace"],
    },
    {
      id: "4",
      date: "3 days ago at 3:45 PM",
      summary: "Coffee with an old friend. Great conversation and lots of laughter.",
      mood: "happy",
      tags: ["friendship", "connection", "joy"],
    },
  ]

  const filteredMemories = memories.filter((memory) => {
    const matchesSearch =
      memory.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesMood = !selectedMood || selectedMood === "all" || memory.mood === selectedMood
    return matchesSearch && matchesMood
  })

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

        {/* Memories list */}
        <div className="space-y-3">
          {filteredMemories.length > 0 ? (
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
