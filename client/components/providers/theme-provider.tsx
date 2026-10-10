"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"

export type AccentColor = "emerald" | "teal" | "blue" | "purple" | "rose" | "amber"

export interface AccentColorDef {
  id: AccentColor
  name: string
  hex: string
  gradient: string
  hoverGradient: string
  activeBg: string
  activeBorder: string
  activeText: string
  badgeBg: string
  badgeText: string
  glow: string
  ring: string
}

export const ACCENT_COLORS: Record<AccentColor, AccentColorDef> = {
  emerald: {
    id: "emerald",
    name: "Emerald",
    hex: "#10b981",
    gradient: "bg-emerald-600",
    hoverGradient: "hover:bg-emerald-500",
    activeBg: "bg-emerald-500/10",
    activeBorder: "border-emerald-500/30",
    activeText: "text-emerald-600 dark:text-emerald-300",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeText: "text-emerald-600 dark:text-emerald-300",
    glow: "shadow-emerald-950/40",
    ring: "ring-emerald-500",
  },
  teal: {
    id: "teal",
    name: "Teal",
    hex: "#14b8a6",
    gradient: "bg-teal-600",
    hoverGradient: "hover:bg-teal-500",
    activeBg: "bg-teal-500/10",
    activeBorder: "border-teal-500/30",
    activeText: "text-teal-600 dark:text-teal-300",
    badgeBg: "bg-teal-500/10 dark:bg-teal-500/20",
    badgeText: "text-teal-600 dark:text-teal-300",
    glow: "shadow-teal-950/40",
    ring: "ring-teal-500",
  },
  blue: {
    id: "blue",
    name: "Blue",
    hex: "#3b82f6",
    gradient: "bg-blue-600",
    hoverGradient: "hover:bg-blue-500",
    activeBg: "bg-blue-500/10",
    activeBorder: "border-blue-500/30",
    activeText: "text-blue-600 dark:text-blue-300",
    badgeBg: "bg-blue-500/10 dark:bg-blue-500/20",
    badgeText: "text-blue-600 dark:text-blue-300",
    glow: "shadow-blue-950/40",
    ring: "ring-blue-500",
  },
  purple: {
    id: "purple",
    name: "Purple",
    hex: "#8b5cf6",
    gradient: "bg-purple-600",
    hoverGradient: "hover:bg-purple-500",
    activeBg: "bg-purple-500/10",
    activeBorder: "border-purple-500/30",
    activeText: "text-purple-600 dark:text-purple-300",
    badgeBg: "bg-purple-500/10 dark:bg-purple-500/20",
    badgeText: "text-purple-600 dark:text-purple-300",
    glow: "shadow-purple-950/40",
    ring: "ring-purple-500",
  },
  rose: {
    id: "rose",
    name: "Rose",
    hex: "#f43f5e",
    gradient: "bg-rose-600",
    hoverGradient: "hover:bg-rose-500",
    activeBg: "bg-rose-500/10",
    activeBorder: "border-rose-500/30",
    activeText: "text-rose-600 dark:text-rose-300",
    badgeBg: "bg-rose-500/10 dark:bg-rose-500/20",
    badgeText: "text-rose-600 dark:text-rose-300",
    glow: "shadow-rose-950/40",
    ring: "ring-rose-500",
  },
  amber: {
    id: "amber",
    name: "Amber",
    hex: "#f59e0b",
    gradient: "bg-amber-600",
    hoverGradient: "hover:bg-amber-500",
    activeBg: "bg-amber-500/10",
    activeBorder: "border-amber-500/30",
    activeText: "text-amber-600 dark:text-amber-300",
    badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
    badgeText: "text-amber-600 dark:text-amber-300",
    glow: "shadow-amber-950/40",
    ring: "ring-amber-500",
  },
}

interface AppearanceContextType {
  theme: string | undefined
  setTheme: (theme: string) => void
  resolvedTheme: string | undefined
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
  accentConfig: AccentColorDef
}

const AppearanceContext = createContext<AppearanceContextType>({
  theme: "dark",
  setTheme: () => {},
  resolvedTheme: "dark",
  accentColor: "emerald",
  setAccentColor: () => {},
  accentConfig: ACCENT_COLORS.emerald,
})

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useNextTheme()
  const [accentColor, setAccentColorState] = useState<AccentColor>("emerald")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("nexora-accent-color") as AccentColor
    if (saved && ACCENT_COLORS[saved]) {
      setAccentColorState(saved)
      document.documentElement.setAttribute("data-accent", saved)
    } else {
      document.documentElement.setAttribute("data-accent", "emerald")
    }
  }, [])

  // Sync dark class and data-theme directly to guarantee 100% immediate effect with Tailwind v4
  useEffect(() => {
    if (!mounted) return
    const active = resolvedTheme || theme || "dark"
    if (active === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
      document.documentElement.setAttribute("data-theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
      document.documentElement.setAttribute("data-theme", "light")
    }
  }, [theme, resolvedTheme, mounted])

  const handleSetTheme = (newTheme: string) => {
    setTheme(newTheme)
    if (typeof window !== "undefined") {
      let isDark = newTheme === "dark"
      if (newTheme === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      }
      if (isDark) {
        document.documentElement.classList.add("dark")
        document.documentElement.classList.remove("light")
        document.documentElement.setAttribute("data-theme", "dark")
      } else {
        document.documentElement.classList.remove("dark")
        document.documentElement.classList.add("light")
        document.documentElement.setAttribute("data-theme", "light")
      }
    }
  }

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color)
    localStorage.setItem("nexora-accent-color", color)
    document.documentElement.setAttribute("data-accent", color)
  }

  const value: AppearanceContextType = {
    theme: mounted ? theme : "dark",
    setTheme: handleSetTheme,
    resolvedTheme: mounted ? resolvedTheme : "dark",
    accentColor,
    setAccentColor,
    accentConfig: ACCENT_COLORS[accentColor] || ACCENT_COLORS.emerald,
  }

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  )
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      <AppearanceProvider>{children}</AppearanceProvider>
    </NextThemesProvider>
  )
}

export function useAppearance() {
  return useContext(AppearanceContext)
}
