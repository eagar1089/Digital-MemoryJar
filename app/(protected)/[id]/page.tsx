"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Edit2, Trash2, Share2 } from "lucide-react"
import { api, type Memory } from "@/lib/api-client"

export default function MemoryDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const memoryId = Array.isArray(params?.id) ? params.id[0] : params?.id
  const [isEditing, setIsEditing] = useState(false)
  const [memory, setMemory] = useState<Memory | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [draftContent, setDraftContent] = useState("")
  const [draftSummary, setDraftSummary] = useState("")
  const [draftMood, setDraftMood] = useState("")
  const [draftTags, setDraftTags] = useState("")

  useEffect(() => {
    if (!memoryId) return

    async function loadMemory() {
      try {
        const memoryRes = await api.getMemory(memoryId)
        setMemory(memoryRes)
        setDraftContent(memoryRes.content || "")
        setDraftSummary(memoryRes.ai_summary || "")
        setDraftMood(memoryRes.mood || "")
        setDraftTags((memoryRes.tags || []).join(", "))
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load memory"
        setError(message)
      }
    }

    loadMemory()
  }, [memoryId])

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

  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => setSuccess(""), 2500)
    return () => window.clearTimeout(timer)
  }, [success])

  async function handleSaveChanges() {
    if (!memory) return

    setIsSaving(true)
    setError("")
    try {
      const tags = draftTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)

      const updated = await api.updateMemory(memory.id, {
        content: draftContent,
        ai_summary: draftSummary,
        mood: draftMood || undefined,
        tags,
      })

      setMemory(updated)
      setDraftContent(updated.content || "")
      setDraftSummary(updated.ai_summary || "")
      setDraftMood(updated.mood || "")
      setDraftTags((updated.tags || []).join(", "))
      setIsEditing(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update memory"
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteMemory() {
    if (!memory) return

    const confirmed = window.confirm("Delete this memory permanently?")
    if (!confirmed) return

    setError("")
    setSuccess("")
    try {
      await api.deleteMemory(memory.id)
      router.push("/timeline")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete memory"
      setError(message)
    }
  }

  async function handleShareMemory() {
    if (!memory) return

    const shareUrl = `${window.location.origin}/${memory.id}`
    const shareText = memory.ai_summary || memory.content || "Memory from Digital Memory Jar"

    setError("")
    setSuccess("")

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Memory from Digital Memory Jar",
          text: shareText,
          url: shareUrl,
        })
        setSuccess("Memory shared successfully")
        return
      }

      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
      setSuccess("Share text copied to clipboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to share memory"
      setError(message)
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6 md:space-y-8">
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
              onClick={() => {
                if (!isEditing && memory) {
                  setDraftContent(memory.content || "")
                  setDraftSummary(memory.ai_summary || "")
                  setDraftMood(memory.mood || "")
                  setDraftTags((memory.tags || []).join(", "))
                }
                setIsEditing(!isEditing)
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit2 size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteMemory}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {error && (
          <Card className="glass border-destructive/30 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {success && (
          <Card className="glass border-green-500/30 p-4">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </Card>
        )}

        {!error && !memory && (
          <Card className="glass border-primary/20 p-4">
            <p className="text-sm text-muted-foreground">Loading memory...</p>
          </Card>
        )}

        {memory && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Card className="glass border-primary/20 p-6 space-y-4 md:col-span-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{new Date(memory.created_at).toLocaleDateString()}</p>
                  <h1 className="text-2xl font-bold">Memory Detail</h1>
                </div>
                <span className="text-4xl">{moodEmojis[memory.mood || "neutral"] || "📝"}</span>
              </div>

              {isEditing ? (
                <Textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="min-h-28"
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{memory.content}</p>
                </div>
              )}
            </Card>

            <Card className="glass border-primary/20 p-4 space-y-2 md:col-span-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">AI Summary</p>
              {isEditing ? (
                <Textarea
                  value={draftSummary}
                  onChange={(e) => setDraftSummary(e.target.value)}
                  className="min-h-20"
                />
              ) : (
                <p className="text-sm">{memory.ai_summary || "No summary generated yet."}</p>
              )}
            </Card>

            {isEditing && (
              <Card className="glass border-primary/20 p-4 space-y-3 md:col-span-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Mood</p>
                  <Input value={draftMood} onChange={(e) => setDraftMood(e.target.value)} placeholder="e.g. calm" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Tags (comma separated)</p>
                  <Input value={draftTags} onChange={(e) => setDraftTags(e.target.value)} placeholder="work, growth" />
                </div>
              </Card>
            )}

            <Card className="glass border-accent/20 bg-accent/5 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">AI Insight</p>
              <p className="text-sm">{aiInsight}</p>
            </Card>

            <Card className="glass border-primary/20 p-4 space-y-3 md:col-span-2">
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
            </div>
          </>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleShareMemory}
            variant="outline"
            className="flex-1 border-primary/30 hover:bg-primary/5 bg-transparent"
          >
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
          <Button
            onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
            disabled={isSaving}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
          >
            {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Edit Memory"}
          </Button>
        </div>
      </div>
    </main>
  )
}
