import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">About Digital Memory Jar</h1>
          <p className="text-muted-foreground">AI-powered journaling for personal reflection and emotional tracking.</p>
        </div>

        <Card className="glass border-primary/20 p-6 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Digital Memory Jar helps you capture daily memories, understand emotional patterns, and review insights over time.
            The app combines journaling with lightweight AI analysis to generate summaries, mood signals, and helpful context.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your entries are stored in your account and can be exported from settings at any time.
          </p>
        </Card>

        <div className="flex gap-3">
          <Link href="/settings">
            <Button variant="outline" className="border-primary/30 hover:bg-primary/5 bg-transparent">
              Back to Settings
            </Button>
          </Link>
          <Link href="/home">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Go to Home</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
