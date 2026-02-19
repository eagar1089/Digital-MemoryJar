"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Edit2, Trash2, Share2 } from "lucide-react"

export default function MemoryDetailPage({ params }: { params: { id: string } }) {
  const [isEditing, setIsEditing] = useState(false)

  // Mock data
  const memory = {
    id: params.id,
    date: "Today at 2:30 PM",
    fullDate: "October 16, 2025",
    title: "Productive Day at Work",
    content:
      "Had a really productive day at work today. I managed to complete the project milestone that we've been working on for the past two weeks. The team was supportive and collaborative, which made the process smooth. I felt a sense of accomplishment and pride in what we achieved together. Looking forward to the next phase of the project.",
    summary: "Had a productive day at work. Completed the project milestone and felt accomplished.",
    mood: "happy",
    tags: ["work", "achievement", "productivity", "teamwork"],
    aiInsight:
      "Your entry shows strong positive emotions around achievement and collaboration. You tend to feel most fulfilled when working with supportive teams on meaningful projects.",
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
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
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
              <p className="text-xs text-muted-foreground">{memory.fullDate}</p>
              <h1 className="text-2xl font-bold">{memory.title}</h1>
            </div>
            <span className="text-4xl">{moodEmojis[memory.mood]}</span>
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{memory.content}</p>
          </div>
        </Card>

        {/* AI Summary */}
        <Card className="glass border-primary/20 p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">AI Summary</p>
          <p className="text-sm">{memory.summary}</p>
        </Card>

        {/* AI Insight */}
        <Card className="glass border-accent/20 bg-accent/5 p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">AI Insight</p>
          <p className="text-sm">{memory.aiInsight}</p>
        </Card>

        {/* Tags */}
        <Card className="glass border-primary/20 p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Tags</p>
          <div className="flex flex-wrap gap-2">
            {memory.tags.map((tag) => (
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
