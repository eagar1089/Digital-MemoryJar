"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import { showWarningAlert, showErrorAlert } from "@/lib/glass-alert"

export default function ModelHealthMonitor() {
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function check() {
      try {
        const res = await api.getModelHealth()
        if (!mounted) return
        setStatus(res.status || "unknown")

        if (res.status === "degraded") {
          showWarningAlert({ title: "AI degraded", text: "AI inference falling back to local heuristics.", icon: "warning" })
        } else if (res.status === "unavailable") {
          showErrorAlert()
        }
      } catch (err) {
        if (!mounted) return
        setStatus("error")
        showErrorAlert()
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
