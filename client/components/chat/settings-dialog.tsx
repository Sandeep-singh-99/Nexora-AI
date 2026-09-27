"use client"

import React, { useState, useEffect } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { UserMemory } from "@/types/memory"
import { fetchMemoriesApi, addMemoryApi, deleteMemoryApi } from "@/lib/api/memory"
import { useCurrentUser } from "@/hooks/use-auth"
import { useAppearance, ACCENT_COLORS, AccentColor } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  onDeleteAllChats?: () => void
}

type TabType = "appearance" | "account" | "memory" | "data" | "security"

export function SettingsDialog({ isOpen, onClose, onDeleteAllChats }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>("appearance")
  const { theme, setTheme, accentColor, setAccentColor, accentConfig } = useAppearance()

  // Long-Term AI Memory state
  const [memories, setMemories] = useState<UserMemory[]>([])
  const [isLoadingMemories, setIsLoadingMemories] = useState(false)
  const [newMemoryText, setNewMemoryText] = useState("")
  const [isAddingMemory, setIsAddingMemory] = useState(false)

  const { data: user } = useCurrentUser()
  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : "US"

  useEffect(() => {
    if (isOpen && activeTab === "memory") {
      loadMemories()
    }
  }, [isOpen, activeTab])

  const loadMemories = async () => {
    setIsLoadingMemories(true)
    try {
      const data = await fetchMemoriesApi()
      setMemories(data)
    } catch (err) {
      console.error("Failed to load memories:", err)
    } finally {
      setIsLoadingMemories(false)
    }
  }

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemoryText.trim()) return
    setIsAddingMemory(true)
    try {
      const created = await addMemoryApi({ memory_text: newMemoryText.trim() })
      setMemories((prev) => [created, ...prev])
      setNewMemoryText("")
    } catch (err) {
      console.error("Failed to add memory:", err)
    } finally {
      setIsAddingMemory(false)
    }
  }

  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteMemoryApi(id)
      setMemories((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      console.error("Failed to delete memory:", err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative z-50 flex h-[580px] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0F18] shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-200">
        {/* Modal Close X Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close settings"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Sidebar Navigation */}
        <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#05070B] p-4 flex flex-col justify-between">
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

              {/* AI Memory Tab */}
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
                <span>AI Memory</span>
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
        <main className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#0A0F18]">
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
                <div>
                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white">{user?.email || "User Account"}</h5>
                  <p className="text-xs text-slate-400">Connected Account</p>
                  <Badge className={cn("mt-1.5 text-[10px]", accentConfig.activeBg, accentConfig.activeBorder, accentConfig.activeText)}>
                    Pro Workspace Tier
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LONG-TERM AI MEMORY */}
          {activeTab === "memory" && (
            <div className="space-y-6 animate-in fade-in-0 duration-150">
              <div>
                <div className="flex items-center gap-2">
                  <Brain className={cn("h-5 w-5", accentConfig.activeText)} />
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">AI Personalization & Long-Term Memory</h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Nexora automatically remembers key facts, preferences, and tech stacks across conversations using Neon DB vector embeddings.
                </p>
              </div>

              {/* Add Memory Form */}
              <form onSubmit={handleAddMemory} className="flex gap-2">
                <Input
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="Remember something manually (e.g. 'I prefer writing FastAPI in Python')..."
                  className="bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100"
                />
                <Button
                  type="submit"
                  disabled={isAddingMemory || !newMemoryText.trim()}
                  className={cn("text-white font-semibold text-xs shrink-0 bg-gradient-to-r cursor-pointer", accentConfig.gradient)}
                >
                  {isAddingMemory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  Add Fact
                </Button>
              </form>

              {/* Memory List */}
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stored Facts ({memories.length})</h5>

                {isLoadingMemories ? (
                  <div className="flex items-center justify-center py-8 text-slate-500 gap-2 text-xs">
                    <Loader2 className={cn("h-4 w-4 animate-spin", accentConfig.activeText)} />
                    <span>Loading memory store from Neon pgvector...</span>
                  </div>
                ) : memories.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] p-6 text-center text-xs text-slate-400">
                    No memories stored yet. Nexora will automatically remember details as you chat, or you can add one above!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {memories.map((mem) => (
                      <div
                        key={mem.id}
                        className={cn(
                          "flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3 text-xs transition-all",
                          `hover:${accentConfig.activeBorder}`
                        )}
                      >
                        <div className="flex items-start gap-2.5 overflow-hidden pr-2">
                          <Badge className={cn("text-[10px] mt-0.5 shrink-0", accentConfig.activeBg, accentConfig.activeBorder, accentConfig.activeText)}>
                            {mem.category}
                          </Badge>
                          <span className="text-slate-800 dark:text-slate-200 break-words font-medium">{mem.memory_text}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteMemory(mem.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                          title="Forget this memory"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
