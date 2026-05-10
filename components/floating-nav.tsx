"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, Gauge, BarChart3, User } from "lucide-react"
import { Tooltip } from "./tooltip"
import { useAuth } from "@/lib/auth-context"

export function FloatingNav() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  if (loading || !user) {
    return null
  }

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/dashboard", icon: Gauge, label: "Dashboard" },
    { href: "/add", icon: Plus, label: "Add Memory" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/profile", icon: User, label: "Profile" },
  ]

  return (
    <>
      {/* Floating nav (mobile + desktop, bottom center) */}
      <div
        className="
          fixed
          bottom-6
          left-1/2
          -translate-x-1/2
          z-50
          pointer-events-none
        "
      >
        <div className="nav-gradient-border shadow-2xl shadow-purple-500/30 dark:shadow-purple-500/50">
          <nav className="relative z-10 rounded-full px-4 py-3 flex items-center gap-2 pointer-events-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Tooltip key={item.href} content={item.label}>
                  <Link
                    href={item.href}
                    className={`transition-all duration-300 flex items-center gap-2 rounded-full whitespace-nowrap ${
                      isActive
                        ? "bg-linear-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 text-white px-4 py-2 shadow-lg shadow-purple-500/40"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-2 py-2 hover:scale-110"
                    }`}
                  >
                    <Icon size={20} />
                  </Link>
                </Tooltip>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}
