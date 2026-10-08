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
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Lock,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useCurrentUser, useLogout } from "@/hooks/use-auth"
import { useAppearance, ACCENT_COLORS, AccentColor } from "@/components/providers/theme-provider"
import { MemoryManagementView } from "./memory-management-view"
import {
  useCustomApiKeys,
  CHAT_PROVIDERS,
  EMBEDDING_PROVIDERS,
  ProviderOption,
} from "@/lib/custom-keys"
import { cn } from "@/lib/utils"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  onDeleteAllChats?: () => void
  defaultTab?: TabType
}

type TabType = "appearance" | "account" | "keys" | "memory" | "data" | "security"

function maskKey(key: string): string {
  if (!key) return ""
  if (key.length <= 8) return "••••••••"
  const prefix = key.slice(0, 4)
  const suffix = key.slice(-4)
  return `${prefix}••••••••${suffix}`
}

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

  // BYOK Custom API Keys
  const {
    keys: customKeys,
    saveKeys,
    deleteChatKey,
    deleteEmbeddingKey,
    clearAllKeys,
  } = useCustomApiKeys()

  const [chatProvider, setChatProvider] = useState<string>("groq")
  const [chatModel, setChatModel] = useState<string>("llama-3.3-70b-versatile")
  const [customChatModelInput, setCustomChatModelInput] = useState<string>("")
  const [chatKeyInput, setChatKeyInput] = useState("")
  const [showChatKey, setShowChatKey] = useState(false)

  const [embeddingProvider, setEmbeddingProvider] = useState<string>("gemini")
  const [embeddingModel, setEmbeddingModel] = useState<string>("text-embedding-004")
  const [customEmbeddingModelInput, setCustomEmbeddingModelInput] = useState<string>("")
  const [embeddingKeyInput, setEmbeddingKeyInput] = useState("")
  const [showEmbeddingKey, setShowEmbeddingKey] = useState(false)

  const [isSavingKeys, setIsSavingKeys] = useState(false)
  const [keysFeedback, setKeysFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (customKeys) {
      const p = customKeys.chatProvider || "groq"
      setChatProvider(p)
      const m = customKeys.chatModel || CHAT_PROVIDERS[p]?.defaultModel || "llama-3.3-70b-versatile"
      const isKnownChatModel = CHAT_PROVIDERS[p]?.models.some((item) => item.id === m)
      if (isKnownChatModel) {
        setChatModel(m)
        setCustomChatModelInput("")
      } else {
        setChatModel("custom")
        setCustomChatModelInput(m)
      }
      setChatKeyInput(customKeys.chatApiKey || "")

      const ep = customKeys.embeddingProvider || "gemini"
      setEmbeddingProvider(ep)
      const em = customKeys.embeddingModel || EMBEDDING_PROVIDERS[ep]?.defaultModel || "text-embedding-004"
      const isKnownEmbModel = EMBEDDING_PROVIDERS[ep]?.models.some((item) => item.id === em)
      if (isKnownEmbModel) {
        setEmbeddingModel(em)
        setCustomEmbeddingModelInput("")
      } else {
        setEmbeddingModel("custom")
        setCustomEmbeddingModelInput(em)
      }
      setEmbeddingKeyInput(customKeys.embeddingApiKey || "")
    }
  }, [customKeys, isOpen])

  const handleSelectChatProvider = (pId: string) => {
    setChatProvider(pId)
    const def = CHAT_PROVIDERS[pId]?.defaultModel || "custom-model"
    setChatModel(def)
    setCustomChatModelInput("")
  }

  const handleSelectEmbeddingProvider = (epId: string) => {
    setEmbeddingProvider(epId)
    const def = EMBEDDING_PROVIDERS[epId]?.defaultModel || "custom-embedding"
    setEmbeddingModel(def)
    setCustomEmbeddingModelInput("")
  }

  const handleSaveCustomKeys = async () => {
    setIsSavingKeys(true)
    setKeysFeedback(null)
    try {
      const resolvedChatModel =
        chatModel === "custom"
          ? (customChatModelInput.trim() || CHAT_PROVIDERS[chatProvider]?.defaultModel || "llama-3.3-70b-versatile")
          : chatModel

      const resolvedEmbeddingModel =
        embeddingModel === "custom"
          ? (customEmbeddingModelInput.trim() || EMBEDDING_PROVIDERS[embeddingProvider]?.defaultModel || "text-embedding-004")
          : embeddingModel

      await saveKeys({
        chatProvider,
        chatModel: resolvedChatModel,
        chatApiKey: chatKeyInput.trim(),

        embeddingProvider,
        embeddingModel: resolvedEmbeddingModel,
        embeddingApiKey: embeddingKeyInput.trim(),
      })
      setKeysFeedback({
        type: "success",
        text: "Custom API keys, provider, and model preferences encrypted and saved! Nexora will use your custom setup.",
      })
      setTimeout(() => setKeysFeedback(null), 4000)
    } catch {
      setKeysFeedback({
        type: "error",
        text: "Failed to encrypt and save keys. Please try again.",
      })
    } finally {
      setIsSavingKeys(false)
    }
  }

  const handleDeleteChatKey = async () => {
    setChatKeyInput("")
    await deleteChatKey()
    setKeysFeedback({
      type: "success",
      text: "Custom Chat API key deleted. Reverted chat to prebuilt setup.",
    })
    setTimeout(() => setKeysFeedback(null), 4000)
  }

  const handleDeleteEmbeddingKey = async () => {
    setEmbeddingKeyInput("")
    await deleteEmbeddingKey()
    setKeysFeedback({
      type: "success",
      text: "Custom Embedding API key deleted. Reverted embeddings to prebuilt setup.",
    })
    setTimeout(() => setKeysFeedback(null), 4000)
  }

  const handleResetAllKeys = async () => {
    setChatKeyInput("")
    setEmbeddingKeyInput("")
    setCustomChatModelInput("")
    setCustomEmbeddingModelInput("")
    setChatProvider("groq")
    setChatModel("llama-3.3-70b-versatile")
    setEmbeddingProvider("gemini")
    setEmbeddingModel("text-embedding-004")
    await clearAllKeys()
    setKeysFeedback({
      type: "success",
      text: "All custom API keys removed. Entire workspace reverted to prebuilt setup.",
    })
    setTimeout(() => setKeysFeedback(null), 4000)
  }

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

              {/* Custom API Keys (BYOK) Tab */}
              <button
                onClick={() => setActiveTab("keys")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "keys"
                    ? cn(accentConfig.activeBg, accentConfig.activeText, accentConfig.activeBorder, "border shadow-xs")
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <KeyRound className="h-4 w-4" />
                <div className="flex items-center justify-between flex-1">
                  <span>Custom API Keys</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] px-1 py-0",
                      customKeys.chatApiKey || customKeys.embeddingApiKey
                        ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                        : "border-slate-300 dark:border-white/10 text-slate-400"
                    )}
                  >
                    BYOK
                  </Badge>
                </div>
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
              ? "p-6 overflow-hidden flex flex-col"
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

          {/* TAB: CUSTOM API KEYS (BYOK) */}
          {activeTab === "keys" && (
            <div className="space-y-6 animate-in fade-in-0 duration-150 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Custom API Keys & Models (BYOK)</h4>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                    AES-256 Encrypted
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select your model provider, choose a model, and paste your API key. If any key is omitted or deleted, Nexora automatically uses prebuilt system keys for that task.
                </p>
              </div>

              {/* Feedback Alert */}
              {keysFeedback && (
                <div
                  className={cn(
                    "p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium animate-in fade-in-0",
                    keysFeedback.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                  )}
                >
                  {keysFeedback.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  )}
                  <span>{keysFeedback.text}</span>
                </div>
              )}

              {/* Security & BYOK Information Banner */}
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/[0.03] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  <Lock className="h-4 w-4" />
                  <span>How BYOK Model Providers & Fallback Work</span>
                </div>
                <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>
                    <strong>Custom Key Override:</strong> When you provide a key for Chat or Embedding, Nexora uses your chosen provider, model, and key.
                  </li>
                  <li>
                    <strong>Automatic Prebuilt Fallback:</strong> If you omit or delete either key (or both), Nexora seamlessly runs that task on the prebuilt system keys.
                  </li>
                  <li>
                    <strong>Completely Independent:</strong> You can provide only a Chat key, only an Embedding key, both, or none.
                  </li>
                  <li>
                    <strong>Zero-Knowledge Storage:</strong> Keys are encrypted in your browser with AES-GCM (256-bit) before being saved to local storage.
                  </li>
                </ul>
              </div>

              {/* 1. Chat & Reasoning Provider, Model & Key */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                      <span>Chat & Reasoning Model</span>
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Powers conversational assistant, multi-agent tools (coding, math), and titles.
                    </p>
                  </div>
                  <div>
                    {customKeys.chatApiKey ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                        Custom Key Active ({maskKey(customKeys.chatApiKey)})
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300 dark:border-white/10">
                        Using Prebuilt System Key (Groq)
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Provider Selector Buttons */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    1. Select Provider
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {Object.values(CHAT_PROVIDERS).map((p) => {
                      const isSelected = chatProvider === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectChatProvider(p.id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                            isSelected
                              ? cn(accentConfig.activeBg, accentConfig.activeBorder, "ring-2", accentConfig.ring, "shadow-xs")
                              : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20"
                          )}
                        >
                          <span className={cn("text-xs font-semibold", isSelected ? accentConfig.activeText : "text-slate-800 dark:text-slate-200")}>
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate w-full mt-0.5">
                            {p.id === "groq" ? "Ultra-fast" : p.id === "gemini" ? "Google AI" : p.id === "openai" ? "GPT-4o" : p.id === "openrouter" ? "DeepSeek" : "Custom"}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Model Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    2. Select Model for {CHAT_PROVIDERS[chatProvider]?.name || "Provider"}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(CHAT_PROVIDERS[chatProvider]?.models || []).map((m) => {
                      const isSelected = chatModel === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setChatModel(m.id)
                            setCustomChatModelInput("")
                          }}
                          className={cn(
                            "flex items-start justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                            isSelected
                              ? cn(accentConfig.activeBg, accentConfig.activeBorder, "ring-2", accentConfig.ring, "shadow-xs")
                              : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20"
                          )}
                        >
                          <div className="min-w-0 pr-2">
                            <span className={cn("text-xs font-semibold block truncate", isSelected ? accentConfig.activeText : "text-slate-800 dark:text-slate-200")}>
                              {m.name}
                            </span>
                            {m.description && (
                              <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                                {m.description}
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                        </button>
                      )
                    })}

                    {/* Custom Model Option */}
                    <button
                      type="button"
                      onClick={() => setChatModel("custom")}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                        chatModel === "custom"
                          ? cn(accentConfig.activeBg, accentConfig.activeBorder, "ring-2", accentConfig.ring, "shadow-xs")
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20"
                      )}
                    >
                      <span className={cn("text-xs font-semibold", chatModel === "custom" ? accentConfig.activeText : "text-slate-800 dark:text-slate-200")}>
                        Other / Custom Model ID...
                      </span>
                      {chatModel === "custom" && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  </div>

                  {/* Custom Model Input if custom is chosen or other provider */}
                  {(chatModel === "custom" || chatProvider === "other") && (
                    <div className="pt-1">
                      <Input
                        type="text"
                        value={customChatModelInput}
                        onChange={(e) => setCustomChatModelInput(e.target.value)}
                        placeholder="e.g. meta-llama/llama-3.3-70b-instruct or mistral-large-2407"
                        className="text-xs font-mono bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10"
                      />
                    </div>
                  )}
                </div>

                {/* API Key Input with Dynamic Placeholder */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      3. {CHAT_PROVIDERS[chatProvider]?.name || "Provider"} API Key
                    </label>
                    {CHAT_PROVIDERS[chatProvider]?.keyDocsUrl && (
                      <a
                        href={CHAT_PROVIDERS[chatProvider].keyDocsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>Get {CHAT_PROVIDERS[chatProvider]?.name} Key</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type={showChatKey ? "text" : "password"}
                      value={chatKeyInput}
                      onChange={(e) => setChatKeyInput(e.target.value)}
                      placeholder={CHAT_PROVIDERS[chatProvider]?.keyPrefixPlaceholder || "api-key-..."}
                      className="pr-10 text-xs font-mono bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowChatKey(!showChatKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showChatKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {customKeys.chatApiKey && (
                  <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteChatKey}
                      className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-8 px-3 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete Key & Revert to Prebuilt (Groq)
                    </Button>
                  </div>
                )}
              </div>

              {/* 2. Vector Embedding Provider, Model & Key */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Database className="h-4 w-4 text-emerald-500" />
                      <span>Embedding & Vector Search Model</span>
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Powers PDF & Word document indexing, YouTube transcripts, and pgvector long-term memory.
                    </p>
                  </div>
                  <div>
                    {customKeys.embeddingApiKey ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                        Custom Key Active ({maskKey(customKeys.embeddingApiKey)})
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300 dark:border-white/10">
                        Using Prebuilt System Key (Gemini)
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Embedding Provider Selector Buttons */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    1. Select Embedding Provider
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(EMBEDDING_PROVIDERS).map((p) => {
                      const isSelected = embeddingProvider === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectEmbeddingProvider(p.id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                            isSelected
                              ? cn(accentConfig.activeBg, accentConfig.activeBorder, "ring-2", accentConfig.ring, "shadow-xs")
                              : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20"
                          )}
                        >
                          <span className={cn("text-xs font-semibold", isSelected ? accentConfig.activeText : "text-slate-800 dark:text-slate-200")}>
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate w-full mt-0.5">
                            {p.id === "gemini" ? "Prebuilt Default" : p.id === "openai" ? "768-dim" : "Custom"}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Embedding Model Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    2. Select Embedding Model
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(EMBEDDING_PROVIDERS[embeddingProvider]?.models || []).map((m) => {
                      const isSelected = embeddingModel === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setEmbeddingModel(m.id)
                            setCustomEmbeddingModelInput("")
                          }}
                          className={cn(
                            "flex items-start justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                            isSelected
                              ? cn(accentConfig.activeBg, accentConfig.activeBorder, "ring-2", accentConfig.ring, "shadow-xs")
                              : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20"
                          )}
                        >
                          <div className="min-w-0 pr-2">
                            <span className={cn("text-xs font-semibold block truncate", isSelected ? accentConfig.activeText : "text-slate-800 dark:text-slate-200")}>
                              {m.name}
                            </span>
                            {m.description && (
                              <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                                {m.description}
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                        </button>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => setEmbeddingModel("custom")}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                        embeddingModel === "custom"
                          ? cn(accentConfig.activeBg, accentConfig.activeBorder, "ring-2", accentConfig.ring, "shadow-xs")
                          : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20"
                      )}
                    >
                      <span className={cn("text-xs font-semibold", embeddingModel === "custom" ? accentConfig.activeText : "text-slate-800 dark:text-slate-200")}>
                        Custom Embedding Model...
                      </span>
                      {embeddingModel === "custom" && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  </div>

                  {(embeddingModel === "custom" || embeddingProvider === "other") && (
                    <div className="pt-1">
                      <Input
                        type="text"
                        value={customEmbeddingModelInput}
                        onChange={(e) => setCustomEmbeddingModelInput(e.target.value)}
                        placeholder="e.g. text-embedding-3-large"
                        className="text-xs font-mono bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10"
                      />
                    </div>
                  )}
                </div>

                {/* Embedding API Key Input with Dynamic Placeholder */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      3. {EMBEDDING_PROVIDERS[embeddingProvider]?.name || "Embedding"} API Key
                    </label>
                    {EMBEDDING_PROVIDERS[embeddingProvider]?.keyDocsUrl && (
                      <a
                        href={EMBEDDING_PROVIDERS[embeddingProvider].keyDocsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>Get {EMBEDDING_PROVIDERS[embeddingProvider]?.name} Key</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type={showEmbeddingKey ? "text" : "password"}
                      value={embeddingKeyInput}
                      onChange={(e) => setEmbeddingKeyInput(e.target.value)}
                      placeholder={EMBEDDING_PROVIDERS[embeddingProvider]?.keyPrefixPlaceholder || "api-key-..."}
                      className="pr-10 text-xs font-mono bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmbeddingKey(!showEmbeddingKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showEmbeddingKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {customKeys.embeddingApiKey && (
                  <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteEmbeddingKey}
                      className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-8 px-3 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete Key & Revert to Prebuilt (Gemini)
                    </Button>
                  </div>
                )}
              </div>

              {/* Master Save and Reset Bar */}
              <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetAllKeys}
                  disabled={!customKeys.chatApiKey && !customKeys.embeddingApiKey}
                  className="w-full sm:w-auto text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset All to Prebuilt Setup
                </Button>

                <Button
                  type="button"
                  onClick={handleSaveCustomKeys}
                  disabled={isSavingKeys}
                  className={cn(
                    "w-full sm:w-auto text-xs font-semibold text-white rounded-xl px-5 py-2 cursor-pointer shadow-md bg-gradient-to-r",
                    accentConfig.gradient
                  )}
                >
                  {isSavingKeys ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Save className="h-4 w-4 mr-1.5" />
                  )}
                  <span>{isSavingKeys ? "Encrypting & Saving..." : "Save & Encrypt Keys"}</span>
                </Button>
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
