import { Card } from "@/components/ui/card"
import Link from "next/link"

interface MemoryCardProps {
  id: string
  date: string
  summary: string
  mood: string
  tags: string[]
}

const moodEmojis: Record<string, string> = {
  reflective: "🤔",
  happy: "😊",
  calm: "🌿",
  peaceful: "🌙",
  excited: "🎉",
  grateful: "🙏",
}

export function MemoryCard({ id, date, summary, mood, tags }: MemoryCardProps) {
  return (
    <Link href={`/memory/${id}`}>
      <Card className="glass-gradient-primary border-0 p-4 space-y-3 cursor-pointer hover:border-primary/40 transition-all hover:shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{date}</p>
            <p className="text-sm font-medium mt-1 line-clamp-2">{summary}</p>
          </div>
          <span className="text-2xl shrink-0">{moodEmojis[mood] || "📝"}</span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                {tag}
              </span>
            ))}
            {tags.length > 2 && <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>}
          </div>
        )}
      </Card>
    </Link>
  )
}
