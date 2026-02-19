/**
 * Example: How to wire the add memory page to save to backend.
 * 
 * Replace the handleSave in app/(protected)/add/page.tsx with this:
 */

import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";

export function useAddMemory() {
  const router = useRouter();

  const handleSave = async (
    memory: string,
    detectedMood: string,
    aiSummary: string,
    tags: string[]
  ) => {
    try {
      const response = await api.createMemory({
        content: memory, // Raw text input
        mood: detectedMood, // AI-detected mood
        ai_summary: aiSummary, // AI-generated summary
        tags: tags, // Associated tags
        recorded_by: "text", // Input method
      });

      console.log("Memory saved:", response);

      // Redirect to memories list or dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to save memory:", error);
      // Show error toast/notification to user
    }
  };

  return { handleSave };
}

/**
 * MongoDB document structure after save:
 * {
 *   "_id": ObjectId(...),
 *   "uid": "firebase-user-id",
 *   "content": "raw text from textarea",
 *   "mood": "reflective",
 *   "ai_summary": "You reflected on your day...",
 *   "tags": ["personal", "reflection", "growth"],
 *   "recorded_by": "text",
 *   "created_at": ISODate("2026-02-09T..."),
 *   "updated_at": ISODate("2026-02-09T..."),
 *   "is_processed": false
 * }
 *
 * Later, AI extraction pipeline will:
 * - Extract entities (people, places, events)
 * - Generate embeddings
 * - Extract key insights
 * - Update is_processed = true
 */
