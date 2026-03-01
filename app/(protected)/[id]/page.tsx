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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadMemory = async () => {
      try {
        const data = await api.getMemory(params.id)
        if (!mounted) return
        setMemory(data)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Failed to load memory")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadMemory()
    return () => {
      mounted = false
    }
  }, [params.id])

  const fullDate = useMemo(() => {
    if (!memory?.created_at) return "Unknown date"
    const date = new Date(memory.created_at)
    if (Number.isNaN(date.getTime())) return "Unknown date"
    return date.toLocaleString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }, [memory?.created_at])

  if (loading) {
    return (
      <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
        <div className="relative z-10 max-w-md mx-auto px-4 py-8">
          <Card className="glass border-primary/20 p-6 text-center text-muted-foreground">Loading memory...</Card>
        </div>
      </main>
    )
  }

  if (error || !memory) {
    return (
      <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
        <div className="relative z-10 max-w-md mx-auto px-4 py-8 space-y-4">
          <Link
            href="/timeline"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <Card className="glass border-destructive/20 p-6 text-destructive">{error || "Memory not found"}</Card>
        </div>
      </main>
    )
  }

  const moodEmojis: Record<string, string> = {
    happy: "😊",
    calm: "🌿",
    reflective: "🤔",
    peaceful: "🌙",
    excited: "🎉",
    grateful: "🙏",
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

        {/* Memory content */}
        <Card className="glass border-primary/20 p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{fullDate}</p>
              <h1 className="text-2xl font-bold">Memory</h1>
            </div>
            <span className="text-4xl">{moodEmojis[memory.mood || ""] || "📝"}</span>
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{memory.content}</p>
          </div>
        </Card>

        {/* AI Summary */}
        <Card className="glass border-primary/20 p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">AI Summary</p>
          <p className="text-sm">{memory.ai_summary || memory.content}</p>
        </Card>

        {/* AI Insight */}
        <Card className="glass border-accent/20 bg-accent/5 p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">AI Insight</p>
          <p className="text-sm text-muted-foreground">
            {(memory.nlp_insights?.topics || []).length > 0
              ? `Top topics: ${(memory.nlp_insights?.topics || []).join(", ")}`
              : "AI insight will appear after NLP processing completes."}
          </p>
        </Card>

        {/* Tags */}
        <Card className="glass border-primary/20 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Tags</p>
          <div className="flex flex-wrap gap-2">
            {(memory.tags || []).map((tag) => (
              <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </Card>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1 border-primary/30 hover:bg-primary/5 bg-transparent">
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
          <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary">
            Save Changes
          </Button>
        </div>
      </div>
    </main>
  )
}
