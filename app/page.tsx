"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center px-4 md:px-8 py-12 md:py-20">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 md:top-40 md:left-20 w-72 md:w-96 h-72 md:h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 md:bottom-40 md:right-20 w-72 md:w-96 h-72 md:h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md md:max-w-2xl text-center space-y-8 md:space-y-10">
        {/* Logo and tagline */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Digital Memory Jar Logo"
              width={160}
              height={160}
              className="drop-shadow-lg w-32 h-32 md:w-48 md:h-48"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-balance text-gradient-brand">Digital Memory Jar</h1>
          <p className="text-lg md:text-2xl text-muted-foreground text-balance">
            Capture your thoughts. Reflect your emotions.
          </p>
        </div>

        {/* Description */}
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
          An AI-powered personal life logger that helps you understand your emotional journey through intelligent
          summaries and beautiful visualizations.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 pt-4 justify-center">
          <Link href="/login" className="w-full md:w-auto">
            <Button className="w-full md:w-48 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary md:text-lg md:h-12">
              Sign In
            </Button>
          </Link>
          <Link href="/signup" className="w-full md:w-auto">
            <Button
              variant="outline"
              className="w-full md:w-48 border-primary/30 hover:bg-primary/5 bg-transparent md:text-lg md:h-12"
            >
              Create Account
            </Button>
          </Link>
        </div>

        {/* Features preview */}
        <div className="pt-8 space-y-3 md:grid md:grid-cols-3 md:gap-4 md:space-y-0 max-w-2xl mx-auto">
          <div className="glass-gradient-primary rounded-lg p-3 md:p-6">
            <p className="text-foreground font-medium md:text-lg">AI-Powered Insights</p>
            <p className="text-xs md:text-sm text-muted-foreground">Get intelligent summaries of your thoughts</p>
          </div>
          <div className="glass-gradient-secondary rounded-lg p-3 md:p-6">
            <p className="text-foreground font-medium md:text-lg">Mood Tracking</p>
            <p className="text-xs md:text-sm text-muted-foreground">Visualize your emotional patterns</p>
          </div>
          <div className="glass-gradient-accent rounded-lg p-3 md:p-6">
            <p className="text-foreground font-medium md:text-lg">Private & Secure</p>
            <p className="text-xs md:text-sm text-muted-foreground">Your memories are yours alone</p>
          </div>
        </div>
      </div>
    </main>
  )
}
