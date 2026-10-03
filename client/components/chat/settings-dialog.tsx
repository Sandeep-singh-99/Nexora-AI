"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  X,
  User,
  Database,
  Sliders,
  ShieldCheck,
  Trash2,
  Sparkles,
  Brain,
  Plus,
  Loader2,
  Palette,
  Sun,
  Moon,
  Laptop,
  Check,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useCurrentUser, useLogout } from "@/hooks/use-auth"
import { useAppearance, ACCENT_COLORS, AccentColor } from "@/components/providers/theme-provider"
import { MemoryManagementView } from "./memory-management-view"
import { cn } from "@/lib/utils"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  onDeleteAllChats?: () => void
  defaultTab?: TabType
}

type TabType = "appearance" | "account" | "memory" | "data" | "security"

export function SettingsDialog({
  isOpen,
  onClose,
  onDeleteAllChats,
  defaultTab = "appearance",
}: SettingsDialogProps) {
  const router = useRouter()
  const logoutMutation = useLogout()
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab)
  const [isMemoryFullscreen, setIsMemoryFullscreen] = useState(false)
  const { theme, setTheme, accentColor, setAccentColor, accentConfig } = useAppearance()

  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        onClose()
        router.replace("/")
      },
    })
  }

  const { data: user } = useCurrentUser()
  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : "US"

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div
        className={cn(
          "relative z-50 flex overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0F18] shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-200 transition-all",
          isMemoryFullscreen && activeTab === "memory"
            ? "w-[96vw] h-[92vh] max-w-7xl"
            : activeTab === "memory"
            ? "h-[740px] max-h-[92vh] w-full max-w-5xl"
            : "h-[640px] w-full max-w-4xl"
        )}
      >
        {/* Modal Close X Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close settings"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Sidebar Navigation */}
        <aside
          className={cn(
            "w-56 shrink-0 border-r border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#05070B] p-4 flex flex-col justify-between transition-all",
            isMemoryFullscreen && activeTab === "memory" && "hidden"
          )}
        >
          <div>
            <div className="flex items-center gap-2 mb-6 px-2">
              <div
                className="h-6 w-6 rounded-lg p-0.5 flex items-center justify-center bg-gradient-to-br"
                style={{ background: accentConfig.hex }}
              >
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">Settings</h3>
            </div>

            <nav className="space-y-1">
              {/* Appearance Tab */}
              <button
                onClick={() => setActiveTab("appearance")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "appearance"
                    ? cn(accentConfig.activeBg, accentConfig.activeText, accentConfig.activeBorder, "border shadow-xs")
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Palette className="h-4 w-4" />
                <span>Appearance</span>
              </button>

              {/* Account Tab */}
              <button
                onClick={() => setActiveTab("account")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "account"
                    ? cn(accentConfig.activeBg, accentConfig.activeText, accentConfig.activeBorder, "border shadow-xs")
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <User className="h-4 w-4" />
                <span>Account</span>
              </button>

              {/* AI Memory & Graph Tab */}
              <button
                onClick={() => setActiveTab("memory")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "memory"
                    ? cn(accentConfig.activeBg, accentConfig.activeText, accentConfig.activeBorder, "border shadow-xs")
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Brain className="h-4 w-4" />
                <div className="flex items-center justify-between flex-1">
                  <span>AI Memory</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-indigo-500/30 text-indigo-500 dark:text-indigo-400">
                    Graph
                  </Badge>
                </div>
              </button>

              {/* Data controls Tab */}
              <button
                onClick={() => setActiveTab("data")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "data"
                    ? cn(accentConfig.activeBg, accentConfig.activeText, accentConfig.activeBorder, "border shadow-xs")
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Database className="h-4 w-4" />
                <span>Data controls</span>
              </button>

              {/* Security Tab */}
              <button
                onClick={() => setActiveTab("security")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "security"
                    ? cn(accentConfig.activeBg, accentConfig.activeText, accentConfig.activeBorder, "border shadow-xs")
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Security</span>
              </button>
            </nav>
          </div>

          <div className="px-2 pt-4 border-t border-slate-200 dark:border-white/5">
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block">Nexora AI v1.0.0</span>
          </div>
        </aside>

        {/* Tab Content Panel */}
        <main
          className={cn(
            "flex-1 bg-white dark:bg-[#0A0F18] transition-all min-h-0",
            isMemoryFullscreen && activeTab === "memory"
              ? "p-2 overflow-hidden flex flex-col"
              : activeTab === "memory"
              ? "p-4 overflow-hidden flex flex-col"
              : "p-6 overflow-y-auto"
          )}
        >
          {/* TAB: APPEARANCE */}
          {activeTab === "appearance" && (
            <div className="space-y-6 animate-in fade-in-0 duration-150">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Appearance & Theme</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select your theme mode (Light, Dark, System) and custom accent color.
                </p>
              </div>

              {/* Theme Mode Selection */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Color Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Light */}
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex flex-col items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer",
                      theme === "light"
                        ? cn(accentConfig.activeBg, accentConfig.activeBorder, "ring-2", accentConfig.ring, "shadow-md")
                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20"
                    )}
                  >
                    <div className="w-full h-14 rounded-lg bg-white border border-slate-200 p-2 flex flex-col justify-between shadow-xs mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                        <div className="h-1.5 w-10 rounded bg-slate-200" />
                      </div>
                      <div className="h-2 w-full rounded bg-slate-100" />
                    </div>
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Light</span>
                      </div>
                      {theme === "light" && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                    </div>
                  </button>

                  {/* Dark */}
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex flex-col items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer",
                      theme === "dark"
                        ? cn(accentConfig.activeBg, accentConfig.activeBorder, "ring-2", accentConfig.ring, "shadow-md")
                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20"
                    )}
                  >
                    <div className="w-full h-14 rounded-lg bg-[#070A0F] border border-white/10 p-2 flex flex-col justify-between shadow-xs mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-slate-600" />
                        <div className="h-1.5 w-10 rounded bg-slate-700" />
                      </div>
                      <div className="h-2 w-full rounded bg-slate-800" />
                    </div>
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Dark</span>
                      </div>
                      {theme === "dark" && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                    </div>
                  </button>

                  {/* System */}
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={cn(
                      "flex flex-col items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer",
                      theme === "system"
                        ? cn(accentConfig.activeBg, accentConfig.activeBorder, "ring-2", accentConfig.ring, "shadow-md")
                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20"
                    )}
                  >
                    <div className="w-full h-14 rounded-lg bg-gradient-to-r from-white to-[#070A0F] border border-slate-200 dark:border-white/10 p-2 flex flex-col justify-between shadow-xs mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-slate-400" />
                        <div className="h-1.5 w-10 rounded bg-slate-400" />
                      </div>
                      <div className="h-2 w-full rounded bg-slate-400/50" />
                    </div>
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Laptop className="h-4 w-4 text-teal-400" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">System</span>
                      </div>
                      {theme === "system" && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Accent Color Palette */}
              <div className="space-y-3 pt-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Accent Color
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((colKey) => {
                    const conf = ACCENT_COLORS[colKey]
                    const isSelected = accentColor === colKey
                    return (
                      <button
                        key={colKey}
                        type="button"
                        onClick={() => setAccentColor(colKey)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer",
                          isSelected
                            ? cn("border-transparent ring-2", conf.ring, "bg-slate-100 dark:bg-white/[0.08] shadow-sm")
                            : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                        )}
                      >
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105"
                          style={{ backgroundColor: conf.hex }}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                        </div>
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{conf.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Live Preview</span>
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs border",
                      accentConfig.activeBg,
                      accentConfig.activeBorder,
                      accentConfig.activeText
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Active Chat in Sidebar</span>
                  </div>

                  <button
                    type="button"
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 bg-gradient-to-r cursor-pointer",
                      accentConfig.gradient
                    )}
                  >
                    <span>Action Button</span>
                  </button>

                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Mode: <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{theme}</span> • Color: <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{accentColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ACCOUNT */}
          {activeTab === "account" && (
            <div className="space-y-6 animate-in fade-in-0 duration-150">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Account Details</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your personal profile, email, and subscription plan.</p>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4">
                <Avatar className={cn("h-14 w-14 border", accentConfig.activeBg, accentConfig.activeBorder)}>
                  <AvatarFallback className={cn("font-bold text-lg", accentConfig.activeText)}>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {user?.email || "User Account"}
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {user?.created_at
                      ? `Member since ${new Date(user.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          year: "numeric",
                        })}`
                      : "Connected Account"}
                  </p>
                  <Badge className={cn("mt-1.5 text-[10px]", accentConfig.activeBg, accentConfig.activeBorder, accentConfig.activeText)}>
                    Pro Workspace Tier
                  </Badge>
                </div>
              </div>

              {/* Session Management & Logout */}
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-5 space-y-4">
                <div>
                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                    <span>Session Management</span>
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Sign out of your Nexora AI account on this device.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Active Session</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Current browser on this device</p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="flex items-center gap-2 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                  >
                    {logoutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    <span>{logoutMutation.isPending ? "Signing out..." : "Log Out"}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LONG-TERM AI MEMORY & KNOWLEDGE GRAPH */}
          {activeTab === "memory" && (
            <div className="h-full flex flex-col animate-in fade-in-0 duration-150">
              <MemoryManagementView
                isFullscreen={isMemoryFullscreen}
                onToggleFullscreen={() => setIsMemoryFullscreen(!isMemoryFullscreen)}
              />
            </div>
          )}

          {/* TAB: DATA CONTROLS */}
          {activeTab === "data" && (
            <div className="space-y-6 animate-in fade-in-0 duration-150">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Data Controls</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage workspace conversation logs, export history, or clear sessions.</p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white">Clear All Chat Conversations</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Permanently delete all active chat sessions.</p>
                </div>
                <Button
                  onClick={onDeleteAllChats}
                  className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in-0 duration-150">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Security & Auth</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage session security and tokens.</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 text-xs text-slate-600 dark:text-slate-400">
                Active session authentication: HttpOnly Cookie + CSRF protection enabled.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
