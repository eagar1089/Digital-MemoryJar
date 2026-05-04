"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Memory } from "@/lib/api-client"

type CalendarCardProps = {
  memories?: Pick<Memory, "created_at">[]
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export default function CalendarCard({ memories = [] }: CalendarCardProps) {
  const router = useRouter()
  const today = new Date()

  const [current, setCurrent] = useState(() => new Date(today))
  const [pickerOpen, setPickerOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"week" | "month">("week")
  const [selectedDate, setSelectedDate] = useState(() => new Date(today))

  const year = current.getFullYear()
  const month = current.getMonth()
  const todayKey = toDateKey(today)

  const memoryDates = useMemo(() => {
    const map: Record<string, number> = {}

    for (const memory of memories) {
      const key = toDateKey(new Date(memory.created_at))
      map[key] = (map[key] || 0) + 1
    }

    return map
  }, [memories])

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

  const weekDates = useMemo(() => {
    const start = new Date(selectedDate)
    const dayIndex = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - dayIndex)

    const list: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      list.push(d)
    }
    return list
  }, [selectedDate])

  const dayBaseClass =
    "aspect-square flex items-center justify-center rounded-lg text-sm transition-all border backdrop-blur-sm"
  const memoryDayClass =
    "bg-linear-to-br from-primary/20 via-primary/10 to-transparent border-primary/30 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
  const emptyDayClass =
    "border-border/60 hover:bg-accent/60 hover:text-accent-foreground"
  const selectedDayClass =
    "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/50"
  const todayRingClass = "ring-1 ring-primary/40"

  function selectDate(date: Date) {
    setSelectedDate(date)
    router.push(`/timeline?date=${toDateKey(date)}`)
  }

  function changeMonth(dir: number) {
    const next = new Date(year, month + dir, 1)
    if (next > today) return
    setCurrent(next)
  }

  function jumpTo(date: Date) {
    setCurrent(date)
    setSelectedDate(date)
  }

  return (
    <Card className="w-full max-w-sm rounded-xl border border-white/20 bg-background/55 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-background/35">
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
        <div className="mb-3 flex items-center justify-end">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as "week" | "month")}
            className="rounded-md border bg-background px-2 py-1 text-xs"
          >
            <option value="week">Week view (Mon-Sun)</option>
            <option value="month">Full month</option>
          </select>
        </div>

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

        {viewMode === "month" ? (
          <>
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

                const dateObj = new Date(year, month, day)
                const key = toDateKey(dateObj)
                const isToday = key === todayKey
                const isSelected = key === toDateKey(selectedDate)

                return (
                  <motion.button
                    type="button"
                    key={idx}
                    whileTap={{ scale: 0.9 }}
                    className="relative"
                    onClick={() => selectDate(dateObj)}
                  >
                    <motion.div
                      animate={isToday ? { scale: [1, 1.08, 1] } : undefined}
                      transition={isToday ? { repeat: Infinity, duration: 1.6 } : undefined}
                      className={
                        `${dayBaseClass} ` +
                        (isSelected
                          ? selectedDayClass
                          : memoryDates[key]
                          ? `${memoryDayClass} text-foreground hover:bg-primary/20`
                          : emptyDayClass) +
                        (isToday && !isSelected ? ` ${todayRingClass}` : "")
                      }
                    >
                      <span className="relative flex items-center justify-center">
                        {day}
                      </span>
                    </motion.div>
                    {memoryDates[key] ? (
                      <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_0_4px_rgba(255,255,255,0.18)] dark:shadow-[0_0_0_4px_rgba(0,0,0,0.22)]" />
                    ) : null}
                  </motion.button>
                )
              })}
            </motion.div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
            {weekDates.map((dateObj) => {
              const key = toDateKey(dateObj)
              const isSelected = key === toDateKey(selectedDate)
              const isFuture = dateObj > today
              const memoryCount = memoryDates[key] || 0
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => !isFuture && selectDate(dateObj)}
                  disabled={isFuture}
                  className={
                      "rounded-lg px-2 py-2 text-center text-xs border transition-all relative backdrop-blur-sm " +
                    (isFuture
                        ? "opacity-50 border-border/50 cursor-not-allowed"
                      : isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : memoryCount > 0
                        ? "bg-linear-to-br from-primary/20 via-primary/10 to-transparent border-primary/30 hover:bg-primary/15 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
                        : "border-border/60 hover:bg-accent/60")
                  }
                >
                  <p className="font-semibold">{dateObj.getDate()}</p>
                </button>
              )
            })}
            </div>
          </>
        )}

        <div className="mt-4 flex justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => jumpTo(new Date())}>
            Today
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
