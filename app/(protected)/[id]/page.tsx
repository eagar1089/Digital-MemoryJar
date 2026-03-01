"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Edit2, Trash2, Share2 } from "lucide-react"
import { api, type Memory } from "@/lib/api-client"

export default function MemoryDetailPage({ params }: { params: { id: string } }) {
  const [isEditing, setIsEditing] = useState(false)
  const [memory, setMemory] = useState<Memory | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadMemory() {
      try {
        const memoryRes = await api.getMemory(params.id)
        setMemory(memoryRes)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load memory"
        setError(message)
      }
    }

    loadMemory()
  }, [params.id])

  const moodEmojis: Record<string, string> = {
    happy: "😊",
    calm: "🌿",
    reflective: "🤔",
    peaceful: "🌙",
    excited: "🎉",
    grateful: "🙏",
    neutral: "📝",
  }

  const aiInsight = useMemo(() => {
    if (!memory?.nlp_insights) {
      return "No AI insight available yet."
    }

    const topics = memory.nlp_insights.topics || []
    if (topics.length) {
      return `Primary topics detected: ${topics.join(", ")}.`
    }

    return "NLP processed this memory, but no strong topic signal was found."
  }, [memory])

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/timeline"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit2 size={16} />
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {error && (
          <Card className="glass border-destructive/30 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {!error && !memory && (
          <Card className="glass border-primary/20 p-4">
            <p className="text-sm text-muted-foreground">Loading memory...</p>
          </Card>
        )}

        {memory && (
          <>
            <Card className="glass border-primary/20 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{new Date(memory.created_at).toLocaleDateString()}</p>
                  <h1 className="text-2xl font-bold">Memory Detail</h1>
                </div>
                <span className="text-4xl">{moodEmojis[memory.mood || "neutral"] || "📝"}</span>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{memory.content}</p>
              </div>
            </Card>

            <Card className="glass border-primary/20 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">AI Summary</p>
              <p className="text-sm">{memory.ai_summary || "No summary generated yet."}</p>
            </Card>

            <Card className="glass border-accent/20 bg-accent/5 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">AI Insight</p>
              <p className="text-sm">{aiInsight}</p>
            </Card>

            <Card className="glass border-primary/20 p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Tags</p>
              <div className="flex flex-wrap gap-2">
                {(memory.tags || []).length > 0 ? (
                  (memory.tags || []).map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No tags available.</p>
                )}
              </div>
            </Card>
          </>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1 border-primary/30 hover:bg-primary/5 bg-transparent">
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary">
            {isEditing ? "Editing..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </main>
  )
}
