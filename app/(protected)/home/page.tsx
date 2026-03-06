"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import CalendarCard from "@/components/ui/calenderCard"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { api, type Memory, type StatsResponse } from "@/lib/api-client"
import { Plus, Sparkles, TrendingUp } from "lucide-react"

const moodEmojis: Record<string, string> = {
  calm: "🌿",
  happy: "😊",
  reflective: "🤔",
  peaceful: "🌙",
  sadness: "😔",
  anger: "😠",
  fear: "😟",
  surprise: "😮",
  disgust: "🤢",
  neutral: "📝",
}

type SongPick = { title: string; artist: string; query: string }

const moodSongLibrary: Record<string, SongPick[]> = {
  happy: [
    { title: "Happy", artist: "Pharrell Williams", query: "Happy Pharrell Williams" },
    { title: "On Top of the World", artist: "Imagine Dragons", query: "On Top of the World Imagine Dragons" },
    { title: "Good Time", artist: "Owl City, Carly Rae Jepsen", query: "Good Time Owl City Carly Rae Jepsen" },
  ],
  joy: [
    { title: "Good Life", artist: "OneRepublic", query: "Good Life OneRepublic" },
    { title: "Best Day Of My Life", artist: "American Authors", query: "Best Day Of My Life American Authors" },
    { title: "Can’t Stop the Feeling!", artist: "Justin Timberlake", query: "Cant Stop the Feeling Justin Timberlake" },
  ],
  calm: [
    { title: "Sunset Lover", artist: "Petit Biscuit", query: "Sunset Lover Petit Biscuit" },
    { title: "Bloom", artist: "The Paper Kites", query: "Bloom The Paper Kites" },
    { title: "Holocene", artist: "Bon Iver", query: "Holocene Bon Iver" },
  ],
  peaceful: [
    { title: "Weightless", artist: "Marconi Union", query: "Weightless Marconi Union" },
    { title: "River Flows In You", artist: "Yiruma", query: "River Flows In You Yiruma" },
    { title: "Experience", artist: "Ludovico Einaudi", query: "Experience Ludovico Einaudi" },
  ],
  reflective: [
    { title: "The Night We Met", artist: "Lord Huron", query: "The Night We Met Lord Huron" },
    { title: "Someone You Loved", artist: "Lewis Capaldi", query: "Someone You Loved Lewis Capaldi" },
    { title: "Photograph", artist: "Ed Sheeran", query: "Photograph Ed Sheeran" },
  ],
  sadness: [
    { title: "Fix You", artist: "Coldplay", query: "Fix You Coldplay" },
    { title: "Let Her Go", artist: "Passenger", query: "Let Her Go Passenger" },
    { title: "Say You Won’t Let Go", artist: "James Arthur", query: "Say You Wont Let Go James Arthur" },
  ],
  anger: [
    { title: "Believer", artist: "Imagine Dragons", query: "Believer Imagine Dragons" },
    { title: "Stronger", artist: "Kanye West", query: "Stronger Kanye West" },
    { title: "Remember the Name", artist: "Fort Minor", query: "Remember the Name Fort Minor" },
  ],
  fear: [
    { title: "Unstoppable", artist: "Sia", query: "Unstoppable Sia" },
    { title: "Fight Song", artist: "Rachel Platten", query: "Fight Song Rachel Platten" },
    { title: "Hall of Fame", artist: "The Script", query: "Hall of Fame The Script" },
  ],
  surprise: [
    { title: "Adventure of a Lifetime", artist: "Coldplay", query: "Adventure of a Lifetime Coldplay" },
    { title: "Shut Up and Dance", artist: "WALK THE MOON", query: "Shut Up and Dance WALK THE MOON" },
    { title: "Uptown Funk", artist: "Mark Ronson, Bruno Mars", query: "Uptown Funk Mark Ronson Bruno Mars" },
  ],
  disgust: [
    { title: "Stronger", artist: "Kelly Clarkson", query: "Stronger Kelly Clarkson" },
    { title: "Shake It Off", artist: "Taylor Swift", query: "Shake It Off Taylor Swift" },
    { title: "I Will Survive", artist: "Gloria Gaynor", query: "I Will Survive Gloria Gaynor" },
  ],
  neutral: [
    { title: "Viva La Vida", artist: "Coldplay", query: "Viva La Vida Coldplay" },
    { title: "Perfect", artist: "Ed Sheeran", query: "Perfect Ed Sheeran" },
    { title: "Yellow", artist: "Coldplay", query: "Yellow Coldplay" },
  ],
}

const moodCatchyLines: Record<string, string> = {
  happy: "Feeling bright? Let this song keep your spark alive.",
  joy: "Joy in your heart — press play and ride the vibe.",
  calm: "In a calm zone? Let this track keep your mind clear.",
  peaceful: "Peaceful mood detected — flow with this soothing pick.",
  reflective: "In a reflective headspace? This song fits the moment.",
  sadness: "Feeling low? Let this song sit with you gently.",
  anger: "Strong emotions today — channel that energy with this track.",
  fear: "Feeling fearful? Listen to the song below and breathe easy.",
  surprise: "Unexpected vibes today — this song matches your spark.",
  disgust: "Off-balance mood? Reset your rhythm with this track.",
  neutral: "Balanced mood today — try this song for a smooth flow.",
}

export default function HomePage() {
  const [userName, setUserName] = useState("User")
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        const [me, statsRes, memoriesRes] = await Promise.all([api.getMe(), api.getStats(), api.getMemories()])
        if (!mounted) return
        setUserName(me?.email?.split("@")[0] || "User")
        setStats(statsRes)
        setMemories(memoriesRes)
        setError("")
      } catch (err) {
        if (!mounted) return
        const message = err instanceof Error ? err.message : "Failed to load home data"
        setError(message)
      }
    }

    loadData()
    return () => {
      mounted = false
    }
  }, [])

  const thisWeekCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return memories.filter((memory) => new Date(memory.created_at).getTime() >= weekAgo).length
  }, [memories])

  const latestMood = memories[0]?.mood || stats?.most_common_mood || "neutral"
  const normalizedMood = latestMood.toLowerCase()
  const recentMemories = memories.slice(0, 2)
  const latestMemory = memories[0]

  const spotifySuggestion = useMemo(() => {
    const moodKey = (latestMemory?.mood || stats?.most_common_mood || "neutral").toLowerCase()
    const songPicks = moodSongLibrary[moodKey] || moodSongLibrary.neutral
    const primaryBase = songPicks[0]

    const keyword = latestMemory?.nlp_insights?.keywords?.[0]?.trim()
    const topic = latestMemory?.nlp_insights?.topics?.[0]?.trim()
    const contextWord = keyword || topic
    const query = contextWord ? `${primaryBase.query} ${contextWord}` : primaryBase.query

    return {
      primary: {
        ...primaryBase,
        url: `https://open.spotify.com/search/${encodeURIComponent(query)}`,
      },
      alternatives: songPicks.slice(1, 3).map((song) => ({
        ...song,
        url: `https://open.spotify.com/search/${encodeURIComponent(song.query)}`,
      })),
      contextWord,
    }
  }, [latestMemory, stats?.most_common_mood])

  const primaryTrack = spotifySuggestion.primary
  const alternativeTracks = spotifySuggestion.alternatives

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 pb-24 md:pb-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 md:top-40 md:left-20 w-72 md:w-96 h-72 md:h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 md:bottom-40 md:right-20 w-72 md:w-96 h-72 md:h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md md:max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6 md:space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-bold text-balance">Good Evening, {userName}</h1>
          <p className="text-muted-foreground md:text-lg">Let's capture your thoughts today</p>
        </div>

        <CalendarCard />

        {error && (
          <Card className="glass border-destructive/30 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <Card className="glass-gradient-primary border-0 p-6 md:p-8 space-y-4 md:col-span-1">
            <p className="text-sm md:text-base text-muted-foreground">Spotify suggestion from your latest entry</p>
            <div className="pt-2 border-t border-border/50">
              <p className="text-[11px] md:text-xs text-muted-foreground">{moodCatchyLines[normalizedMood] || moodCatchyLines.neutral}</p>
              <p className="text-sm md:text-base font-medium mt-1">{primaryTrack.title}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{primaryTrack.artist}</p>
              {spotifySuggestion.contextWord && (
                <p className="text-[11px] md:text-xs text-muted-foreground mt-1">
                  Matched with: <span className="text-foreground/90">{spotifySuggestion.contextWord}</span>
                </p>
              )}
              {alternativeTracks.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[11px] md:text-xs font-medium text-foreground/80">More picks for you</p>
                  {alternativeTracks.map((track) => (
                    <a
                      key={`${track.title}-${track.artist}`}
                      href={track.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-[11px] md:text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <span className="truncate pr-2">• {track.title} — {track.artist}</span>
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3 fill-current shrink-0">
                        <path d="M12 1.5A10.5 10.5 0 1 0 22.5 12 10.512 10.512 0 0 0 12 1.5Zm4.817 15.157a.656.656 0 0 1-.903.218 11.64 11.64 0 0 0-5.89-1.403 15.6 15.6 0 0 0-2.34.177.655.655 0 1 1-.194-1.296 16.865 16.865 0 0 1 2.534-.192 12.94 12.94 0 0 1 6.558 1.585.656.656 0 0 1 .235.911Zm1.289-2.87a.819.819 0 0 1-1.127.271 14.915 14.915 0 0 0-7.553-1.844 19.312 19.312 0 0 0-2.857.216.818.818 0 1 1-.24-1.62 20.915 20.915 0 0 1 3.097-.234 16.422 16.422 0 0 1 8.383 2.065.819.819 0 0 1 .297 1.146Zm.111-3.01a18.443 18.443 0 0 0-8.705-2.173 22.853 22.853 0 0 0-3.304.255.982.982 0 0 1-.28-1.944 24.79 24.79 0 0 1 3.584-.277 20.188 20.188 0 0 1 9.672 2.43.983.983 0 1 1-.967 1.709Z" />
                      </svg>
                    </a>
                  ))}
                </div>
              )}
              <a
                href={primaryTrack.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs md:text-sm text-primary hover:text-primary/80 underline underline-offset-2"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 md:h-4 md:w-4 fill-current">
                  <path d="M12 1.5A10.5 10.5 0 1 0 22.5 12 10.512 10.512 0 0 0 12 1.5Zm4.817 15.157a.656.656 0 0 1-.903.218 11.64 11.64 0 0 0-5.89-1.403 15.6 15.6 0 0 0-2.34.177.655.655 0 1 1-.194-1.296 16.865 16.865 0 0 1 2.534-.192 12.94 12.94 0 0 1 6.558 1.585.656.656 0 0 1 .235.911Zm1.289-2.87a.819.819 0 0 1-1.127.271 14.915 14.915 0 0 0-7.553-1.844 19.312 19.312 0 0 0-2.857.216.818.818 0 1 1-.24-1.62 20.915 20.915 0 0 1 3.097-.234 16.422 16.422 0 0 1 8.383 2.065.819.819 0 0 1 .297 1.146Zm.111-3.01a18.443 18.443 0 0 0-8.705-2.173 22.853 22.853 0 0 0-3.304.255.982.982 0 0 1-.28-1.944 24.79 24.79 0 0 1 3.584-.277 20.188 20.188 0 0 1 9.672 2.43.983.983 0 1 1-.967 1.709Z" />
                </svg>
                Open in Spotify
              </a>
            </div>
          </Card>

          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <Card className="glass-gradient-secondary border-0 p-4 md:p-6 text-center space-y-2">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary mx-auto" />
                <p className="text-2xl md:text-3xl font-bold">{stats?.total_memories ?? 0}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Memories</p>
              </Card>
              <Card className="glass-gradient-cool border-0 p-4 md:p-6 text-center space-y-2">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent mx-auto" />
                <p className="text-2xl md:text-3xl font-bold">{thisWeekCount}</p>
                <p className="text-xs md:text-sm text-muted-foreground">This Week</p>
              </Card>
            </div>

            <Card className="glass-gradient-accent border-0 p-4 md:p-6 space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm md:text-base font-medium">AI Insight</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    {stats?.most_common_mood
                      ? `Most common mood: ${stats.most_common_mood}.`
                      : "Add memories to unlock AI insights."}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Link href="/add" className="block">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary h-12 md:h-14 text-base md:text-lg">
            <Plus className="w-5 h-5 md:w-6 md:h-6 mr-2" />
            Add Memory
          </Button>
        </Link>

        <div className="space-y-3 md:space-y-4">
          <h2 className="text-sm md:text-base font-semibold text-muted-foreground uppercase tracking-wide">Recent Memories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {recentMemories.length > 0 ? (
              recentMemories.map((memory) => (
                <Link key={memory.id} href={`/${memory.id}`}>
                  <Card className="glass-gradient-primary border-0 p-4 md:p-6 space-y-2 cursor-pointer hover:border-primary/40 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm md:text-base font-medium">{new Date(memory.created_at).toLocaleDateString()}</p>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">{new Date(memory.created_at).toLocaleTimeString()}</p>
                      </div>
                      <span className="text-lg md:text-2xl">{moodEmojis[memory.mood || "neutral"] || "📝"}</span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{memory.ai_summary || memory.content}</p>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="glass-gradient-primary border-0 p-4 md:p-6">
                <p className="text-xs md:text-sm text-muted-foreground">No memories yet.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
