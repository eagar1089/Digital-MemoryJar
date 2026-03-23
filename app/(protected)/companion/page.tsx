"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, type CompanionReference } from "@/lib/api-client"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  references?: CompanionReference[]
}

export default function CompanionPage() {
  const [prompt, setPrompt] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "I’m your AI Memory Companion. Ask anything about your past entries, moods, or patterns.",
    },
  ])

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault()
    const question = prompt.trim()
    if (!question || isSending) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: question,
    }

    setMessages((prev) => [...prev, userMessage])
    setPrompt("")
    setIsSending(true)

    try {
      const response = await api.companionChat(question)
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: response.answer,
        references: response.references,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not contact AI Companion"
      const failureMessage: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        text: message,
      }
      setMessages((prev) => [...prev, failureMessage])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6 md:space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">AI Companion</h1>
            <p className="text-muted-foreground text-sm md:text-base">Chat with your memory history and get contextual reflections.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="border-primary/30 hover:bg-primary/5 bg-transparent">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card className="glass-gradient-primary border-0 p-4 md:p-6 space-y-4">
          <div className="space-y-3 max-h-[56vh] overflow-y-auto pr-1">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[92%] md:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/70 border border-primary/20 text-foreground"
                  }`}
                >
                  <p>{message.text}</p>

                  {message.references && message.references.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[11px] uppercase tracking-wide opacity-80">References</p>
                      {message.references.map((reference) => (
                        <Link
                          key={`${message.id}-${reference.memory_id}`}
                          href={`/${reference.memory_id}`}
                          className="block rounded-lg border border-primary/20 bg-background/60 p-2 hover:border-primary/40 transition-colors"
                        >
                          <p className="text-[11px] text-muted-foreground">{new Date(reference.created_at).toLocaleDateString()}</p>
                          <p className="text-xs text-foreground mt-1">{reference.snippet}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="max-w-[92%] md:max-w-[78%] rounded-2xl px-4 py-3 text-sm bg-background/70 border border-primary/20 text-muted-foreground">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask: What stressed me this week?"
              className="bg-background/40 border-primary/20"
            />
            <Button type="submit" disabled={isSending || !prompt.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Send
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}
