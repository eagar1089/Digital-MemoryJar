"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Sparkles, Mic, X, AlertCircle } from "lucide-react"
import { api, apiPost } from "@/lib/api-client"

export default function AddMemoryPage() {
  const router = useRouter()
  const [memory, setMemory] = useState("")
  const recognitionRef = useRef<any>(null)
  const shouldRestartRecognitionRef = useRef(false)
  const noSpeechRetriesRef = useRef(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [usedVoiceInput, setUsedVoiceInput] = useState(false)
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(true)
  const [aiSummary, setAiSummary] = useState("")
  const [detectedMood, setDetectedMood] = useState("")
  const [detectedTags, setDetectedTags] = useState<string[]>([])
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const storedAiSummary = localStorage.getItem("dmj.aiSummary")
    if (storedAiSummary !== null) {
      setAiSummaryEnabled(storedAiSummary === "true")
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  const handleAnalyze = async () => {
    if (!memory.trim()) return

    setIsAnalyzing(true)
    setError("")

    try {
      const analysis = await api.analyzeMemory(memory)
      setAiSummary(analysis.ai_summary || "")
      setDetectedMood(analysis.mood || "neutral")
      setDetectedTags(analysis.tags || [])
      setAnalyzed(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Analyze failed"
      setError(errorMessage)
      console.error("Analyze error:", err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")
    setSuccessMessage("")

    try {
      // Call backend API to save memory and process it
      const response = await apiPost<{ id: string | number } | null>("/memories/", {
        content: memory,
        mood: detectedMood || undefined,
        ai_summary: aiSummary || undefined,
        tags: detectedTags.length ? detectedTags : ["personal", "reflection", "growth"],
        recorded_by: usedVoiceInput ? "voice" : "text",
      })

      const dataBackupEnabled = localStorage.getItem("dmj.dataBackup") === "true"
      if (dataBackupEnabled) {
        const existing = localStorage.getItem("dmj.localBackups")
        const backups = existing ? JSON.parse(existing) : []
        backups.unshift({
          id: response?.id || null,
          content: memory,
          mood: detectedMood || null,
          ai_summary: aiSummary || null,
          tags: detectedTags,
          recorded_by: usedVoiceInput ? "voice" : "text",
          saved_at: new Date().toISOString(),
        })
        localStorage.setItem("dmj.localBackups", JSON.stringify(backups.slice(0, 20)))
      }

      const notificationsEnabled = localStorage.getItem("dmj.notifications") === "true"
      if (notificationsEnabled && "Notification" in window) {
        if (Notification.permission === "default") {
          await Notification.requestPermission()
        }
        if (Notification.permission === "granted") {
          new Notification("Memory saved", {
            body: "Your memory has been saved to Digital Memory Jar.",
          })
        }
      }

      setSuccessMessage("Memory saved! It's being processed by the AI pipeline...")
      
      // Reset form
      setTimeout(() => {
        setMemory("")
        setAnalyzed(false)
        setAiSummary("")
        setDetectedMood("")
        setUsedVoiceInput(false)
        setSuccessMessage("")
        // Redirect to dashboard to see the new memory
        router.push("/dashboard")
      }, 1500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save memory"
      setError(errorMessage)
      console.error("Save error:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
    setMemory("")
    setAnalyzed(false)
    setAiSummary("")
    setDetectedMood("")
    setDetectedTags([])
    setUsedVoiceInput(false)
    setError("")
  }

  const handleRecord = async () => {
    if (isRecording && recognitionRef.current) {
      shouldRestartRecognitionRef.current = false
      noSpeechRetriesRef.current = 0
      recognitionRef.current.stop()
      setIsRecording(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError("Voice input is not supported in this browser.")
      return
    }

    setError("")
    noSpeechRetriesRef.current = 0

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result?.[0]?.transcript?.trim()
        if (!transcript) continue
        if (result.isFinal) {
          finalTranscript += `${finalTranscript ? " " : ""}${transcript}`
        }
      }

      if (!finalTranscript) return

      setMemory((prev) => {
        if (!prev.trim()) return finalTranscript
        return `${prev.trim()} ${finalTranscript}`
      })
      setUsedVoiceInput(true)
    }

    recognition.onerror = (event: any) => {
      const code = event?.error as string | undefined

      if (code === "aborted") {
        shouldRestartRecognitionRef.current = false
        noSpeechRetriesRef.current = 0
        setIsRecording(false)
        return
      }

      if (code === "no-speech") {
        if (noSpeechRetriesRef.current < 2) {
          noSpeechRetriesRef.current += 1
          shouldRestartRecognitionRef.current = true
          setError("No speech detected yet. Keep speaking — listening will retry automatically.")
          recognition.stop()
          return
        }
        setError("No speech detected. Check mic input level and speak a bit louder/closer.")
      } else if (code === "audio-capture") {
        setError("No microphone detected. Connect or enable a microphone and try again.")
      } else if (code === "not-allowed" || code === "service-not-allowed") {
        setError("Microphone access is blocked. Allow microphone permission in your browser settings.")
      } else {
        const reason = code ? ` (${code})` : ""
        setError(`Voice capture failed${reason}`)
      }

      shouldRestartRecognitionRef.current = false
      noSpeechRetriesRef.current = 0
      setIsRecording(false)
    }

    recognition.onend = () => {
      if (shouldRestartRecognitionRef.current) {
        shouldRestartRecognitionRef.current = false
        try {
          recognition.start()
          setIsRecording(true)
          return
        } catch {
          setError("Voice capture stopped unexpectedly. Tap Record to try again.")
        }
      }

      noSpeechRetriesRef.current = 0
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

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

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6 md:space-y-8">
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
            <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecord}
              className="border-primary/30 hover:bg-primary/5 bg-transparent"
            >
              <Mic size={16} className="mr-2" />
              {isRecording ? "Stop" : "Record"}
            </Button>
          </div>
          {isRecording && <p className="text-xs text-muted-foreground">Listening... speak now.</p>}
        </Card>

        {/* Analyze button */}
        {!analyzed && aiSummaryEnabled && (
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

        {!aiSummaryEnabled && (
          <Card className="glass border-primary/20 p-3">
            <p className="text-xs text-muted-foreground">
              AI summaries are disabled in settings. You can save memory directly.
            </p>
          </Card>
        )}

        {/* AI Analysis Results */}
        {analyzed && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Summary */}
            <Card className="glass-gradient-secondary border-0 p-4 space-y-2 md:col-span-2">
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
            <Card className="glass-gradient-cool border-0 p-4 space-y-2 md:col-span-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Tags</p>
              <div className="flex flex-wrap gap-2">
                {detectedTags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    {tag}
                  </span>
                ))}
                {detectedTags.length === 0 && <span className="text-xs text-muted-foreground">No tags detected</span>}
              </div>
            </Card>
            </div>
          </div>
        )}

        {(analyzed || !aiSummaryEnabled) && (
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
              disabled={isSaving || !memory.trim()}
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
        )}
      </div>
    </main>
  )
}
