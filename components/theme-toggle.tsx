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

  const getThemeIcon = () => {
    if (theme === "light") return Sun
    if (theme === "dark") return Moon
    return Sun
  }

  const ThemeIcon = getThemeIcon()

  return (
    <Tooltip content={`Switch to ${getNextTheme()} mode`}>
      <button
        onClick={() => setTheme(getNextTheme())}
        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 hover:scale-110"
      >
        <ThemeIcon size={16} />
      </button>
    </Tooltip>
  )
}
