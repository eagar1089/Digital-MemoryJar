"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Sparkles, Mic, X, AlertCircle } from "lucide-react"
import { apiPost, apiPostNoAuth } from "@/lib/api-client"

export default function AddMemoryPage() {
  const router = useRouter()
  const [memory, setMemory] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiSummary, setAiSummary] = useState("")
  const [detectedMood, setDetectedMood] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleAnalyze = async () => {
    if (!memory.trim()) return

    setIsAnalyzing(true)
    setError("")
    
    // Simulate AI analysis (in real app, this would call your AI service)
    setTimeout(() => {
      setAiSummary(
        "You reflected on your day and expressed feelings of accomplishment mixed with anticipation for upcoming challenges.",
      )
      setDetectedMood("reflective")
      setIsAnalyzing(false)
      setAnalyzed(true)
    }, 1500)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")
    setSuccessMessage("")

    try {
      // Call backend API to save memory and process it
      const response = await apiPost("/memories/", {
        content: memory,
        mood: detectedMood || undefined,
        ai_summary: aiSummary || undefined,
        tags: ["personal", "reflection", "growth"],
        recorded_by: "text",
      })

      setSuccessMessage("Memory saved! It's being processed by the AI pipeline...")
      
      // Reset form
      setTimeout(() => {
        setMemory("")
        setAnalyzed(false)
        setAiSummary("")
        setDetectedMood("")
        setSuccessMessage("")
        // Redirect to dashboard to see the new memory
        router.push("/dashboard")
      }, 1500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save memory"

      // If auth failed (401) or user not authenticated, try dev endpoint (local only)
      if (typeof errorMessage === "string" && (errorMessage.includes("401") || errorMessage.includes("No Firebase token"))) {
        try {
          await apiPostNoAuth("/memories/dev", {
            content: memory,
            mood: detectedMood || undefined,
            ai_summary: aiSummary || undefined,
            tags: ["personal", "reflection", "growth"],
            recorded_by: "text",
          })
          setSuccessMessage("Memory saved via dev endpoint! It's being processed by the AI pipeline...")
          setTimeout(() => {
            setMemory("")
            setAnalyzed(false)
            setAiSummary("")
            setDetectedMood("")
            setSuccessMessage("")
            // router.push("/dashboard")
          }, 1500)
          return
        } catch (devErr) {
          const devMsg = devErr instanceof Error ? devErr.message : "Dev save failed"
          setError(devMsg)
          console.error("Dev save error:", devErr)
          setIsSaving(false)
          return
        }
      }

      setError(errorMessage)
      console.error("Save error:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    setMemory("")
    setAnalyzed(false)
    setAiSummary("")
    setDetectedMood("")
    setError("")
  }

  const moodEmojis: Record<string, string> = {
    reflective: "🤔",
    happy: "😊",
    calm: "🌿",
    peaceful: "🌙",
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
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <h1 className="text-2xl font-bold">Add Memory</h1>
          <div className="w-6"></div>
        </div>

        {/* Error message */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/30 p-4 flex gap-3">
            <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {/* Success message */}
        {successMessage && (
          <Card className="bg-green-500/10 border-green-500/30 p-4">
            <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
          </Card>
        )}

        {/* Memory input */}
        <Card className="glass-gradient-primary border-0 p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">What's on your mind?</label>
            <Textarea
              placeholder="Write your thoughts, feelings, or experiences here..."
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              className="min-h-32 bg-background/50 border-primary/20 focus:border-primary resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/5 bg-transparent">
              <Mic size={16} className="mr-2" />
              Record
            </Button>
          </div>
        </Card>

        {/* Analyze button */}
        {!analyzed && (
          <Button
            onClick={handleAnalyze}
            disabled={!memory.trim() || isAnalyzing}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze with AI
              </>
            )}
          </Button>
        )}

        {/* AI Analysis Results */}
        {analyzed && (
          <div className="space-y-4">
            {/* Summary */}
            <Card className="glass-gradient-secondary border-0 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">AI Summary</p>
              <p className="text-sm leading-relaxed">{aiSummary}</p>
            </Card>

            {/* Detected Mood */}
            <Card className="glass-gradient-accent border-0 p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Detected Mood</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{moodEmojis[detectedMood]}</span>
                <div>
                  <p className="font-medium capitalize">{detectedMood}</p>
                  <p className="text-xs text-muted-foreground">Based on your entry</p>
                </div>
              </div>
            </Card>

            {/* Tags */}
            <Card className="glass-gradient-cool border-0 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Tags</p>
              <div className="flex flex-wrap gap-2">
                {["personal", "reflection", "growth"].map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </Card>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleDiscard}
                variant="outline"
                disabled={isSaving}
                className="flex-1 border-primary/30 hover:bg-primary/5 bg-transparent"
              >
                <X size={16} className="mr-2" />
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
              >
                {isSaving ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Memory"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
