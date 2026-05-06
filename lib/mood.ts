export const moodEmojiMap: Record<string, string> = {
  all: "🌈",
  happy: "😊",
  joy: "✨",
  calm: "🌿",
  reflective: "🤔",
  peaceful: "🌙",
  excited: "🎉",
  grateful: "🙏",
  neutral: "📝",
  sadness: "😢",
  sad: "😢",
  anger: "😠",
  fear: "😨",
  surprise: "😲",
  disgust: "🤢",
  anxious: "😟",
  worried: "😟",
  stressed: "⚡",
  content: "🙂",
}

export function getMoodEmoji(mood?: string | null): string {
  if (!mood) return moodEmojiMap.neutral
  const normalized = mood.trim().toLowerCase()
  return moodEmojiMap[normalized] || moodEmojiMap.neutral
}