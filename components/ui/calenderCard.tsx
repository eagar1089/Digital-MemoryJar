"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// sample event map: YYYY-MM-DD -> color token
const events: Record<string, string> = {
  "2026-01-30": "bg-accent",
  "2026-02-05": "bg-[color:var(--color-chart-2)]",
}

export default function CalendarCard() {
  const today = new Date()

  const [current, setCurrent] = useState(() => new Date(today))
  const [pickerOpen, setPickerOpen] = useState(false)

  const year = current.getFullYear()
  const month = current.getMonth()
  const todayKey = today.toISOString().split("T")[0]

  const { days, monthYear } = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()

    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= totalDays; d++) days.push(d)

    return {
      days,
      monthYear: new Date(year, month).toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
    }
  }, [year, month])

  function changeMonth(dir: number) {
    const next = new Date(year, month + dir, 1)
    if (next > today) return
    setCurrent(next)
  }

  function jumpTo(date: Date) {
    setCurrent(date)
  }

  return (
    <Card className="w-full max-w-sm rounded-xl bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-2 flex items-center justify-between">
        <Button size="icon" variant="ghost" onClick={() => changeMonth(-1)}>
          <ChevronLeft />
        </Button>

        <button
          onClick={() => setPickerOpen(v => !v)}
          className="text-sm font-semibold text-center hover:underline"
        >
          {monthYear}
        </button>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => changeMonth(1)}
          disabled={
            year === today.getFullYear() && month === today.getMonth()
          }
        >
          <ChevronRight />
        </Button>
      </CardHeader>

      <CardContent>
        {pickerOpen && (
          <div className="mb-4 flex items-center justify-center gap-2">
            <select
              value={month}
              onChange={e =>
                setCurrent(new Date(year, Number(e.target.value), 1))
              }
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              {Array.from({ length: 12 }).map((_, m) => (
                <option
                  key={m}
                  value={m}
                  disabled={
                    year === today.getFullYear() && m > today.getMonth()
                  }
                >
                  {new Date(0, m).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={e =>
                setCurrent(new Date(Number(e.target.value), month, 1))
              }
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              {Array.from(
                { length: today.getFullYear() - 2015 + 1 },
                (_, i) => 2015 + i
              ).map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPickerOpen(false)}
            >
              Done
            </Button>
          </div>
        )}

        <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <motion.div
          key={monthYear}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-7 gap-2"
        >
          {days.map((day, idx) => {
            if (!day) return <div key={idx} />

            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const isToday = key === todayKey

            return (
              <motion.div key={idx} whileTap={{ scale: 0.9 }} className="relative">
                <motion.div
                  animate={isToday ? { scale: [1, 1.08, 1] } : undefined}
                  transition={isToday ? { repeat: Infinity, duration: 1.6 } : undefined}
                  className={
                    "aspect-square flex items-center justify-center rounded-lg text-sm " +
                    (isToday
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-accent hover:text-accent-foreground")
                  }
                >
                  {day}
                </motion.div>

                {events[key] && (
                  <span
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full ${events[key]}`}
                  />
                )}
              </motion.div>
            )
          })}
        </motion.div>

        <div className="mt-4 flex justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => jumpTo(new Date())}>
            Today
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
