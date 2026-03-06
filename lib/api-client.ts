/**
 * API utility for calling backend endpoints with Firebase auth token.
 */

import { getAuth } from "firebase/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function waitForAuthReady(timeoutMs = 4000): Promise<void> {
  const auth = getAuth();
  if (auth.currentUser) return;

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve();
    }, timeoutMs);

    const unsubscribe = auth.onAuthStateChanged(() => {
      clearTimeout(timeout);
      unsubscribe();
      resolve();
    });
  });
}

/**
 * Get Firebase ID token from current user.
 */
async function getFirebaseToken(forceRefresh = false): Promise<string | null> {
  const auth = getAuth();
  if (!auth.currentUser) {
    await waitForAuthReady();
  }

  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken(forceRefresh);
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (payload && typeof payload.detail === "string") {
      return payload.detail;
    }
    return JSON.stringify(payload);
  } catch {
    try {
      return await response.text();
    } catch {
      return "Unknown error";
    }
  }
}

/**
 * Make an authenticated API call to the backend.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getFirebaseToken(false);

  if (!token) {
    throw new Error("No Firebase token available. User not authenticated.");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401, try one forced refresh and retry once
  if (response.status === 401) {
    const refreshedToken = await getFirebaseToken(true);
    if (refreshedToken) {
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshedToken}`,
          ...(options.headers || {}),
        },
      });

      if (retryResponse.status !== 401) {
        return retryResponse;
      }
    }

    const detail = await extractErrorMessage(response);
    console.error(`Auth failed for ${endpoint}: ${detail}`);
  }

  return response;
}

/**
 * Shortcut for GET requests.
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await apiFetch(endpoint, { method: "GET" });
  if (!res.ok) {
    const detail = await extractErrorMessage(res);
    throw new Error(`GET ${endpoint} failed: ${res.status} - ${detail}`);
  }
  return res.json();
}

/**
 * Shortcut for POST requests.
 */
export async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await apiFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await extractErrorMessage(res);
    throw new Error(`POST ${endpoint} failed: ${res.status} - ${detail}`);
  }
  return res.json();
}

export async function apiPut<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await apiFetch(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await extractErrorMessage(res);
    throw new Error(`PUT ${endpoint} failed: ${res.status} - ${detail}`);
  }
  return res.json();
}


// NLP Types
export interface EmotionScores {
  joy?: number;
  gratitude?: number;
  sadness?: number;
  anger?: number;
  neutral?: number;
}

export interface NLPInsights {
  emotion_scores?: EmotionScores;
  keywords?: string[];
  topics?: string[];
  entities?: string[];
}

export interface AnalyzeMemoryResponse {
  ai_summary: string;
  mood: string;
  tags: string[];
  nlp_insights?: NLPInsights;
}

// Memory types
export interface MemoryCreatePayload {
  content: string; // Raw text content (required)
  content_clean?: string; // Cleaned/normalized version
  mood?: string; // Detected mood
  ai_summary?: string; // AI-generated summary
  tags?: string[]; // Associated tags
  recorded_by?: "text" | "voice"; // Input method
  nlp_insights?: NLPInsights; // NLP extraction results
  embedding_id?: number; // FAISS vector index reference
}

export interface MemoryUpdatePayload {
  content?: string;
  mood?: string;
  ai_summary?: string;
  tags?: string[];
}

export interface Memory extends MemoryCreatePayload {
  id: string;
  uid: string;
  created_at: string;
  updated_at?: string;
  is_processed: boolean;
}

export interface StatsResponse {
  total_memories: number;
  most_common_mood?: string;
  top_emotions?: Record<string, number>;
  top_topics?: string[];
}

export interface MeResponse {
  uid?: string;
  email?: string;
  email_verified?: boolean;
}

export interface SpotifySuggestPayload {
  mood?: string;
  keywords?: string[];
  topics?: string[];
}

export interface SpotifyTrack {
  title: string;
  artist: string;
  url: string;
  album_image?: string | null;
  preview_url?: string | null;
}

export interface SpotifySuggestResponse {
  mood: string;
  query: string;
  primary: SpotifyTrack;
  alternatives: SpotifyTrack[];
}

// API methods
export const api = {
  async getMemories(): Promise<Memory[]> {
    return apiGet("/memories/");
  },

  async getMemory(id: string): Promise<Memory> {
    return apiGet(`/memories/${id}`);
  },

  async createMemory(data: MemoryCreatePayload): Promise<{ id: string; status: string; message: string }> {
    return apiPost("/memories/", data);
  },

  async updateMemory(id: string, data: MemoryUpdatePayload): Promise<Memory> {
    return apiPut(`/memories/${id}`, data);
  },

  async analyzeMemory(content: string): Promise<AnalyzeMemoryResponse> {
    return apiPost("/memories/analyze", { content });
  },

  async getStats(): Promise<StatsResponse> {
    return apiGet("/dashboard/stats");
  },

  async getMe(): Promise<MeResponse> {
    return apiGet("/auth/me");
  },

  async spotifySuggest(data: SpotifySuggestPayload): Promise<SpotifySuggestResponse> {
    return apiPost("/spotify/suggest", data);
  },
};
