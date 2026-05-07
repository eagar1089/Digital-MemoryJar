"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"

export default function ModelHealthMonitor() {
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function check() {
      try {
        const res = await api.getModelHealth()
        if (!mounted) return
        setStatus(res.status || "unknown")

        // Do not show modal alerts from this monitor to avoid interrupting the user.
        // Keep status state updated for any UI that reads it.
        if (res.status === "degraded") {
          console.warn("Model health: degraded — falling back to heuristics")
        } else if (res.status === "unavailable") {
          console.warn("Model health: unavailable")
        }
      } catch (err) {
        if (!mounted) return
        setStatus("error")
        console.error("Model health check failed:", err)
      }
    }

    check()
    const id = setInterval(check, 60_000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  return null
}
