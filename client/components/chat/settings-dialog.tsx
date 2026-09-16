"use client"

import React, { useState, useEffect } from "react"
import {
  X,
  User,
  Database,
  Sliders,
  ShieldCheck,
  Trash2,
  Download,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Mail,
  CreditCard,
  Sparkles,
  Brain,
  Plus,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { UserMemory } from "@/types/memory"
import { fetchMemoriesApi, addMemoryApi, deleteMemoryApi } from "@/lib/api/memory"
import { useCurrentUser } from "@/hooks/use-auth"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  onDeleteAllChats?: () => void
}

type TabType = "general" | "account" | "data" | "security" | "memory"

export function SettingsDialog({ isOpen, onClose, onDeleteAllChats }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>("account")
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

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

  const handleExportData = () => {
    setExportSuccess(true)
    setTimeout(() => setExportSuccess(false), 3000)
  }

  const handleDeleteAccount = () => {
    alert("Account deletion request submitted.")
    setDeleteAccountConfirm(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative z-50 flex h-[580px] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F18] shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Close X Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          aria-label="Close settings"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Sidebar Navigation */}
        <aside className="w-56 shrink-0 border-r border-white/10 bg-[#05070B] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6 px-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-wide">Settings</h3>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("account")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "account"
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <User className="h-4 w-4" />
                <span>Account</span>
              </button>

              <button
                onClick={() => setActiveTab("memory")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "memory"
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <Brain className="h-4 w-4 text-emerald-400" />
                <span>AI Memory</span>
              </button>

              <button
                onClick={() => setActiveTab("data")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "data"
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <Database className="h-4 w-4" />
                <span>Data controls</span>
              </button>

              <button
                onClick={() => setActiveTab("general")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "general"
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <Sliders className="h-4 w-4" />
                <span>General</span>
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "security"
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Security</span>
              </button>
            </nav>
          </div>

          <div className="px-2 pt-4 border-t border-white/5">
            <span className="text-[10px] font-mono text-slate-500 block">Nexora AI v1.0.0</span>
          </div>
        </aside>

        {/* Tab Content Panel */}
        <main className="flex-1 overflow-y-auto p-6 text-slate-200">
          {/* TAB 1: ACCOUNT */}
          {activeTab === "account" && (
            <div className="space-y-6 animate-in fade-in-0 duration-150">
              <div>
                <h4 className="text-lg font-bold text-white">Account Details</h4>
                <p className="text-xs text-slate-400 mt-0.5">Manage your personal profile, email, and subscription plan.</p>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <Avatar className="h-14 w-14 bg-emerald-950 border border-emerald-500/40">
                  <AvatarFallback className="bg-emerald-950 text-emerald-300 text-lg font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h5 className="text-sm font-semibold text-white">{user?.email || "User Account"}</h5>
                  <p className="text-xs text-slate-400">Connected Account</p>
                  <Badge className="mt-1.5 bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px]">
                    Pro Workspace Tier
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LONG-TERM AI MEMORY */}
          {activeTab === "memory" && (
            <div className="space-y-6 animate-in fade-in-0 duration-150">
              <div>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-emerald-400" />
                  <h4 className="text-lg font-bold text-white">AI Personalization & Long-Term Memory</h4>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Nexora automatically remembers key facts, preferences, and tech stacks across conversations using Neon DB vector embeddings.
                </p>
              </div>

              {/* Add Memory Form */}
              <form onSubmit={handleAddMemory} className="flex gap-2">
                <Input
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="Remember something manually (e.g. 'I prefer writing FastAPI in Python')..."
                  className="bg-white/[0.03] border-white/10 text-xs placeholder:text-slate-500"
                />
                <Button
                  type="submit"
                  disabled={isAddingMemory || !newMemoryText.trim()}
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold text-xs shrink-0"
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
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                    <span>Loading memory store from Neon pgvector...</span>
                  </div>
                ) : memories.length === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-6 text-center text-xs text-slate-500">
                    No memories stored yet. Nexora will automatically remember details as you chat, or you can add one above!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {memories.map((mem) => (
                      <div
                        key={mem.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex items-start gap-2.5 overflow-hidden pr-2">
                          <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px] mt-0.5 shrink-0">
                            {mem.category}
                          </Badge>
                          <span className="text-slate-200 break-words font-medium">{mem.memory_text}</span>
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

          {/* TAB 3: DATA CONTROLS */}
          {activeTab === "data" && (
            <div className="space-y-6 animate-in fade-in-0 duration-150">
              <div>
                <h4 className="text-lg font-bold text-white">Data Controls</h4>
                <p className="text-xs text-slate-400 mt-0.5">Manage workspace conversation logs, export history, or clear sessions.</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-semibold text-white">Clear All Chat Conversations</h5>
                  <p className="text-xs text-slate-400">Permanently delete all active chat sessions.</p>
                </div>
                <Button
                  onClick={onDeleteAllChats}
                  className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-6 animate-in fade-in-0 duration-150">
              <div>
                <h4 className="text-lg font-bold text-white">General Settings</h4>
                <p className="text-xs text-slate-400 mt-0.5">Adjust interface behavior and defaults.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400">
                Theme: Dark Mode (Default)
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in-0 duration-150">
              <div>
                <h4 className="text-lg font-bold text-white">Security & Auth</h4>
                <p className="text-xs text-slate-400 mt-0.5">Manage session security and tokens.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400">
                Active session authentication: HttpOnly Cookie + CSRF protection enabled.
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
