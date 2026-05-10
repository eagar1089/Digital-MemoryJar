"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/lib/theme-provider"
import { Tooltip } from "./tooltip"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const getNextTheme = () => {
    if (theme === "light") return "dark"
    if (theme === "dark") return "auto"
    return "light"
  }

  return (
    <Tooltip content={`Switch to ${getNextTheme()} mode`}>
      <button
        onClick={() => setTheme(getNextTheme())}
        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 hover:scale-120"
      >
        {theme === "dark" ? <Moon size={22} /> : <Sun size={22} />}
      </button>
    </Tooltip>
  )
}
