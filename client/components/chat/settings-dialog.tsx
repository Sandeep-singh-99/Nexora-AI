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
  BarChart3,
  Maximize2,
  Minimize2,
  Shield,
  FileText,
  HardDrive,
  Download,
  Key,
  Cpu,
  Layers,
  Activity,
  CheckCircle,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useCurrentUser, useLogout } from "@/hooks/use-auth"
import { useAppearance, ACCENT_COLORS, AccentColor } from "@/components/providers/theme-provider"
import { MemoryManagementView } from "./memory-management-view"
import { UsageAnalyticsView } from "./usage-analytics-view"
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

export type TabType = "appearance" | "account" | "keys" | "analytics" | "memory" | "data" | "security"

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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false)
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

  // Sync state with stored keys
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

  // Reset confirmation state when closing or switching tabs
  useEffect(() => {
    setIsConfirmingClearAll(false)
  }, [activeTab, isOpen])

  // Sync activeTab with defaultTab prop
  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

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
      const finalChatModel =
        chatModel === "custom" || chatProvider === "other"
          ? customChatModelInput.trim() || CHAT_PROVIDERS[chatProvider]?.defaultModel || "custom-model"
          : chatModel

      const finalEmbModel =
        embeddingModel === "custom" || embeddingProvider === "other"
          ? customEmbeddingModelInput.trim() || EMBEDDING_PROVIDERS[embeddingProvider]?.defaultModel || "custom-embedding"
          : embeddingModel

      await saveKeys({
        chatProvider,
        chatModel: finalChatModel,
        chatApiKey: chatKeyInput.trim(),
        embeddingProvider,
        embeddingModel: finalEmbModel,
        embeddingApiKey: embeddingKeyInput.trim(),
      })

      setKeysFeedback({
        type: "success",
        text: "Custom API keys successfully encrypted and saved to browser vault.",
      })
      setTimeout(() => setKeysFeedback(null), 4000)
    } catch {
      setKeysFeedback({
        type: "error",
        text: "Failed to securely save keys. Please check your browser storage permissions.",
      })
    } finally {
      setIsSavingKeys(false)
    }
  }

  const handleDeleteChatKey = async () => {
    setChatKeyInput("")
    setCustomChatModelInput("")
    setChatProvider("groq")
    setChatModel("llama-3.3-70b-versatile")
    await deleteChatKey()
    setKeysFeedback({
      type: "success",
      text: "Custom Chat API key deleted. Reverted chat to prebuilt setup (Groq).",
    })
    setTimeout(() => setKeysFeedback(null), 4000)
  }

  const handleDeleteEmbeddingKey = async () => {
    setEmbeddingKeyInput("")
    setCustomEmbeddingModelInput("")
    setEmbeddingProvider("gemini")
    setEmbeddingModel("text-embedding-004")
    await deleteEmbeddingKey()
    setKeysFeedback({
      type: "success",
      text: "Custom Embedding API key deleted. Reverted embeddings to prebuilt setup (Gemini).",
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

  interface NavItem {
    id: TabType
    label: string
    icon: any
    description: string
    badge?: string
    badgeColor?: string
    isLive?: boolean
  }

  interface NavSection {
    group: string
    items: NavItem[]
  }

  // Tab definitions with categorization for modern sidebar
  const NAV_SECTIONS: NavSection[] = [
    {
      group: "Preferences",
      items: [
        {
          id: "appearance" as TabType,
          label: "Appearance",
          icon: Palette,
          description: "Theme & Accents",
        },
        {
          id: "account" as TabType,
          label: "Account",
          icon: User,
          description: "Profile & Plan",
          badge: "Pro",
        },
      ],
    },
    {
      group: "Intelligence & Compute",
      items: [
        {
          id: "keys" as TabType,
          label: "Custom API Keys",
          icon: KeyRound,
          description: "BYOK Providers",
          badge: customKeys.chatApiKey || customKeys.embeddingApiKey ? "Active" : "BYOK",
          badgeColor:
            customKeys.chatApiKey || customKeys.embeddingApiKey
              ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              : "border-slate-300 dark:border-white/10 text-slate-400",
        },
        {
          id: "analytics" as TabType,
          label: "Usage & Analytics",
          icon: BarChart3,
          description: "Telemetry & Tokens",
          badge: "Live",
          isLive: true,
        },
        {
          id: "memory" as TabType,
          label: "AI Memory",
          icon: Brain,
          description: "Knowledge Graph",
          badge: "Graph",
          badgeColor: "border-indigo-500/30 text-indigo-500 dark:text-indigo-400 bg-indigo-500/10",
        },
      ],
    },
    {
      group: "Data & Security",
      items: [
        {
          id: "data" as TabType,
          label: "Data Controls",
          icon: Database,
          description: "History & Export",
        },
        {
          id: "security" as TabType,
          label: "Security & Privacy",
          icon: ShieldCheck,
          description: "Encryption & Auth",
          badge: "AES-256",
          badgeColor: "border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10",
        },
      ],
    },
  ]

  // Tab titles and descriptions for the main header
  const TAB_HEADERS: Record<TabType, { title: string; subtitle: string; icon: any }> = {
    appearance: {
      title: "Appearance & Theme",
      subtitle: "Customize color modes, personalized accent hues, and interactive interface styling.",
      icon: Palette,
    },
    account: {
      title: "Account & Profile",
      subtitle: "Manage your user profile, active sessions, and workspace subscription tier.",
      icon: User,
    },
    keys: {
      title: "Custom API Keys & Models (BYOK)",
      subtitle: "Bring your own keys for Groq, Gemini, OpenAI, or OpenRouter. Fallback to prebuilt system keys is automated.",
      icon: KeyRound,
    },
    analytics: {
      title: "Usage & Token Analytics",
      subtitle: "Real-time AI telemetry, database consumption logs, cost estimation, and model performance metrics.",
      icon: BarChart3,
    },
    memory: {
      title: "AI Long-Term Memory & Knowledge Graph",
      subtitle: "Inspect persistent semantic memories, entities, preferences, and knowledge connections stored in pgvector.",
      icon: Brain,
    },
    data: {
      title: "Data Controls & Retention",
      subtitle: "Export your workspace session archives, purge conversation history, or manage local cache.",
      icon: Database,
    },
    security: {
      title: "Security & Encryption Architecture",
      subtitle: "Explore Nexora's zero-knowledge client encryption, session security, and tenant data isolation.",
      icon: ShieldCheck,
    },
  }

  const CurrentTabIcon = TAB_HEADERS[activeTab]?.icon || Sliders

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Spacious Unified Dialog Box - Roomy size for ALL tabs */}
      <div
        className={cn(
          "relative z-50 flex overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#070A10] shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-200 transition-all",
          isFullscreen
            ? "w-[99vw] h-[96vh] max-w-[100vw]"
            : "w-[96vw] max-w-6xl xl:max-w-7xl h-[88vh] max-h-[920px] min-h-[640px]"
        )}
      >
        {/* Left Sidebar Navigation */}
        <aside className="w-64 lg:w-72 shrink-0 border-r border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-[#04060A]/95 p-4 sm:p-5 flex flex-col justify-between select-none">
          <div>
            {/* Header / Logo */}
            <div className="flex items-center gap-3 mb-6 px-2">
              <div
                className="h-8 w-8 rounded-xl p-1 flex items-center justify-center shadow-md"
                style={{ background: accentConfig.hex }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Settings
                </h3>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Workspace Control Center
                </span>
              </div>
            </div>

            {/* Categorized Navigation */}
            <div className="space-y-5 overflow-y-auto max-h-[calc(70vh-120px)] pr-1 scrollbar-none">
              {NAV_SECTIONS.map((section) => (
                <div key={section.group} className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
                    {section.group}
                  </span>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = activeTab === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer text-left",
                            isActive
                              ? cn(accentConfig.activeBg, accentConfig.activeText, accentConfig.activeBorder, "border shadow-xs")
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-200"
                          )}
                        >
                          <div
                            className={cn(
                              "h-7 w-7 rounded-xl flex items-center justify-center transition-colors shrink-0",
                              isActive
                                ? "bg-white/40 dark:bg-white/10"
                                : "bg-slate-200/60 dark:bg-white/[0.04] group-hover:bg-slate-300/60 dark:group-hover:bg-white/10"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate">{item.label}</span>
                              {item.badge && (
                                <div className="flex items-center gap-1 shrink-0">
                                  {item.isLive && (
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </span>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[9px] px-1.5 py-0 font-mono tracking-tight",
                                      item.badgeColor ||
                                        (item.isLive
                                          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                          : "border-slate-300 dark:border-white/10 text-slate-500")
                                    )}
                                  >
                                    {item.badge}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate block">
                              {item.description}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Footer User Card */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 px-2">
              <Avatar className={cn("h-8 w-8 border", accentConfig.activeBg, accentConfig.activeBorder)}>
                <AvatarFallback className={cn("text-xs font-bold", accentConfig.activeText)}>
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                  {user?.email || "User Account"}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Pro Workspace
                </span>
              </div>
            </div>

            <div className="px-2 flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500">
              <span>Nexora AI v1.0.0</span>
              <span className="text-slate-400">Enterprise</span>
            </div>
          </div>
        </aside>

        {/* Right Main Content Pane */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#070A10]">
          {/* Universal Header with Breadcrumb & Window Actions */}
          <header className="h-16 shrink-0 border-b border-slate-200/80 dark:border-white/10 px-6 sm:px-8 flex items-center justify-between bg-white/80 dark:bg-[#070A10]/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04]"
                style={{ color: accentConfig.hex }}
              >
                <CurrentTabIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {TAB_HEADERS[activeTab]?.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                  {TAB_HEADERS[activeTab]?.subtitle}
                </p>
              </div>
            </div>

            {/* Window Controls (Fullscreen & Close) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                title={isFullscreen ? "Exit fullscreen" : "Expand settings to fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-colors"
                aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Tab Content Canvas */}
          <main
            className={cn(
              "flex-1 min-h-0",
              activeTab === "memory"
                ? "p-4 sm:p-6 overflow-hidden flex flex-col"
                : activeTab === "analytics"
                ? "p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar"
                : "p-6 sm:p-8 overflow-y-auto custom-scrollbar"
            )}
          >
            {/* ========================================================= */}
            {/* TAB: APPEARANCE */}
            {/* ========================================================= */}
            {activeTab === "appearance" && (
              <div className="max-w-5xl space-y-8 animate-in fade-in-0 duration-150">
                {/* 1. Theme Color Mode */}
                <div className="space-y-3.5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Interface Theme Mode
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Choose between light mode, deep dark mode, or system-adaptive theme.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Light Mode Card */}
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex flex-col items-start justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer group hover:scale-[1.01]",
                        theme === "light"
                          ? cn(accentConfig.activeBg, accentConfig.activeBorder, "ring-2", accentConfig.ring, "shadow-md")
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20"
                      )}
                    >
                      {/* Realistic UI Preview */}
                      <div className="w-full h-24 rounded-xl bg-white border border-slate-200 p-2.5 flex flex-col justify-between shadow-xs mb-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-slate-400" />
                            <div className="h-1.5 w-12 rounded bg-slate-300" />
                          </div>
                          <div className="h-1.5 w-6 rounded bg-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-2 w-3/4 rounded bg-slate-200" />
                          <div className="h-2 w-1/2 rounded bg-slate-100" />
                        </div>
                        <div className="flex justify-end">
                          <div className="h-3 w-10 rounded bg-slate-800" />
                        </div>
                      </div>

                      <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Sun className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Light</span>
                            <span className="text-[10px] text-slate-500">Crisp high-contrast</span>
                          </div>
                        </div>
                        {theme === "light" && <Check className="h-4 w-4 text-emerald-500 stroke-[3]" />}
                      </div>
                    </button>

                    {/* Dark Mode Card */}
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex flex-col items-start justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer group hover:scale-[1.01]",
                        theme === "dark"
                          ? cn(accentConfig.activeBg, accentConfig.activeBorder, "ring-2", accentConfig.ring, "shadow-md")
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20"
                      )}
                    >
                      {/* Realistic UI Preview */}
                      <div className="w-full h-24 rounded-xl bg-[#070A0F] border border-white/10 p-2.5 flex flex-col justify-between shadow-xs mb-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-slate-600" />
                            <div className="h-1.5 w-12 rounded bg-slate-700" />
                          </div>
                          <div className="h-1.5 w-6 rounded bg-slate-800" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-2 w-3/4 rounded bg-slate-800" />
                          <div className="h-2 w-1/2 rounded bg-slate-900" />
                        </div>
                        <div className="flex justify-end">
                          <div className="h-3 w-10 rounded bg-white/20" />
                        </div>
                      </div>

                      <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                            <Moon className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Dark</span>
                            <span className="text-[10px] text-slate-500">OLED midnight</span>
                          </div>
                        </div>
                        {theme === "dark" && <Check className="h-4 w-4 text-emerald-500 stroke-[3]" />}
                      </div>
                    </button>

                    {/* System Mode Card */}
                    <button
                      type="button"
                      onClick={() => setTheme("system")}
                      className={cn(
                        "flex flex-col items-start justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer group hover:scale-[1.01]",
                        theme === "system"
                          ? cn(accentConfig.activeBg, accentConfig.activeBorder, "ring-2", accentConfig.ring, "shadow-md")
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20"
                      )}
                    >
                      {/* Realistic UI Preview */}
                      <div className="w-full h-24 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-2.5 flex flex-col justify-between shadow-xs mb-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-slate-400" />
                            <div className="h-1.5 w-12 rounded bg-slate-400" />
                          </div>
                          <div className="h-1.5 w-6 rounded bg-slate-400/50" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-2 w-3/4 rounded bg-slate-400/50" />
                          <div className="h-2 w-1/2 rounded bg-slate-400/30" />
                        </div>
                        <div className="flex justify-end">
                          <div className="h-3 w-10 rounded bg-slate-500" />
                        </div>
                      </div>

                      <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                            <Laptop className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">System</span>
                            <span className="text-[10px] text-slate-500">Auto match OS</span>
                          </div>
                        </div>
                        {theme === "system" && <Check className="h-4 w-4 text-emerald-500 stroke-[3]" />}
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Accent Colors */}
                <div className="space-y-3.5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Accent Color Theme
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Applied across buttons, active conversation states, glow borders, and focus rings.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((colKey) => {
                      const conf = ACCENT_COLORS[colKey]
                      const isSelected = accentColor === colKey
                      return (
                        <button
                          key={colKey}
                          type="button"
                          onClick={() => setAccentColor(colKey)}
                          className={cn(
                            "flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02]",
                            isSelected
                              ? cn("border-transparent ring-2", conf.ring, "bg-slate-100 dark:bg-white/[0.08] shadow-md")
                              : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                          )}
                        >
                          <div
                            className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110"
                            style={{ backgroundColor: conf.hex }}
                          >
                            {isSelected && <Check className="h-5 w-5 text-white stroke-[3]" />}
                          </div>
                          <div className="text-center">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              {conf.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {conf.hex}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Live Interactive Sandbox Preview */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Live Component Sandbox Preview
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px] text-slate-400">
                      Active: {theme} / {accentColor}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div
                      className={cn(
                        "p-4 rounded-xl border flex items-center gap-3 shadow-xs",
                        accentConfig.activeBg,
                        accentConfig.activeBorder,
                        accentConfig.activeText
                      )}
                    >
                      <Sparkles className="h-4 w-4 shrink-0" />
                      <div>
                        <span className="text-xs font-bold block">Active Chat Tab</span>
                        <span className="text-[10px] opacity-80">Selected conversation state</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={cn(
                        "p-4 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer",
                        accentConfig.gradient
                      )}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Primary Action Button</span>
                    </button>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070A10] flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Focus Ring</span>
                      <div
                        className={cn("h-4 w-4 rounded-full ring-4", accentConfig.ring)}
                        style={{ backgroundColor: accentConfig.hex }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: ACCOUNT */}
            {/* ========================================================= */}
            {activeTab === "account" && (
              <div className="max-w-5xl space-y-8 animate-in fade-in-0 duration-150">
                {/* Hero Profile Bento Card */}
                <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
                  <div className="flex items-center gap-5">
                    <Avatar className={cn("h-20 w-20 border-2 shadow-md", accentConfig.activeBg, accentConfig.activeBorder)}>
                      <AvatarFallback className={cn("font-bold text-2xl", accentConfig.activeText)}>
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                          {user?.email || "User Account"}
                        </h4>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user?.created_at
                          ? `Account created on ${new Date(user.created_at).toLocaleDateString(undefined, {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}`
                          : "Connected User Account"}
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <Badge className={cn("text-[10px] font-semibold", accentConfig.activeBg, accentConfig.activeBorder, accentConfig.activeText)}>
                          Pro Workspace Tier
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-mono">
                          Session Verified
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 min-w-[240px] pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200 dark:border-white/10 md:pl-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Workspace ID</span>
                      <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {user?.id ? user.id.slice(0, 12) + "..." : "tenant-main"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Auth Security</span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        HttpOnly Cookie
                      </span>
                    </div>
                  </div>
                </div>

                {/* Workspace Capabilities Bento Grid */}
                <div className="space-y-3.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Plan Entitlements & Features
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4.5 space-y-2">
                      <div className="h-8 w-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">Prebuilt System Inference</h5>
                      <p className="text-[11px] text-slate-500">
                        Unlimited fast inference via Groq Llama 3.3 70B & Google Gemini 2.0.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4.5 space-y-2">
                      <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <Key className="h-4 w-4" />
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">BYOK Custom Keys</h5>
                      <p className="text-[11px] text-slate-500">
                        Client-side AES-256 encrypted storage for private API keys.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4.5 space-y-2">
                      <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <Brain className="h-4 w-4" />
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">pgvector Knowledge Graph</h5>
                      <p className="text-[11px] text-slate-500">
                        Long-term semantic memory and interactive graph visualization.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4.5 space-y-2">
                      <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Database className="h-4 w-4" />
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">Document & YouTube RAG</h5>
                      <p className="text-[11px] text-slate-500">
                        Agentic retrieval over PDF, Word documents, and video transcripts.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Session Sign Out Card */}
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/[0.02] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <LogOut className="h-4 w-4 text-rose-500" />
                      <span>Active Browser Session</span>
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Terminate your authenticated session on this computer.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    {logoutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5 text-rose-500" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-1.5" />
                    )}
                    <span>{logoutMutation.isPending ? "Signing out..." : "Sign Out of Workspace"}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: CUSTOM API KEYS (BYOK) */}
            {/* ========================================================= */}
            {activeTab === "keys" && (
              <div className="max-w-6xl space-y-6 animate-in fade-in-0 duration-150 pb-6">
                {/* Security Info Banner */}
                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/[0.03] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        Zero-Knowledge Client-Side AES-256 Vault
                      </h5>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        API keys are encrypted in your local browser using AES-GCM (256-bit). If you delete or omit any key, Nexora automatically runs that task using prebuilt system keys without disruption.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 font-mono text-[10px]">
                      Fallback Automated
                    </Badge>
                  </div>
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

                {/* 2-Column Responsive Engine Setup */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* ENGINE 1: Chat & Reasoning Model */}
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs">
                    <div className="space-y-4">
                      {/* Engine Header */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-white/10">
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                            <span>1. Chat & Reasoning Model</span>
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Powers chat messages, agents, coding, and math tools.
                          </p>
                        </div>
                        {customKeys.chatApiKey ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] whitespace-nowrap">
                            Custom Key Active ({maskKey(customKeys.chatApiKey)})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-teal-600 dark:text-teal-400 border-teal-500/30 bg-teal-500/10 whitespace-nowrap">
                            System Prebuilt (Groq)
                          </Badge>
                        )}
                      </div>

                      {/* Provider Selectors */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Select Provider
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                                <span className={cn("text-xs font-bold", isSelected ? accentConfig.activeText : "text-slate-800 dark:text-slate-200")}>
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
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Select Model for {CHAT_PROVIDERS[chatProvider]?.name || "Provider"}
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

                      {/* API Key Input */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {CHAT_PROVIDERS[chatProvider]?.name || "Provider"} API Key
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
                    </div>

                    {customKeys.chatApiKey && (
                      <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleDeleteChatKey}
                          className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-8 px-3 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Delete Key & Revert to Prebuilt (Groq)
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* ENGINE 2: Embedding & Vector Search Model */}
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs">
                    <div className="space-y-4">
                      {/* Engine Header */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-white/10">
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Database className="h-4 w-4 text-emerald-500" />
                            <span>2. Embedding & Vector Search Model</span>
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Powers PDF & Word indexing, YouTube RAG, and pgvector memory.
                          </p>
                        </div>
                        {customKeys.embeddingApiKey ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] whitespace-nowrap">
                            Custom Key Active ({maskKey(customKeys.embeddingApiKey)})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-teal-600 dark:text-teal-400 border-teal-500/30 bg-teal-500/10 whitespace-nowrap">
                            System Prebuilt (Gemini)
                          </Badge>
                        )}
                      </div>

                      {/* Provider Selectors */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Select Embedding Provider
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
                                <span className={cn("text-xs font-bold", isSelected ? accentConfig.activeText : "text-slate-800 dark:text-slate-200")}>
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

                      {/* Model Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Select Embedding Model
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

                      {/* API Key Input */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {EMBEDDING_PROVIDERS[embeddingProvider]?.name || "Embedding"} API Key
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
                    </div>

                    {customKeys.embeddingApiKey && (
                      <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleDeleteEmbeddingKey}
                          className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-8 px-3 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Delete Key & Revert to Prebuilt (Gemini)
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Master Save and Reset Bar */}
                <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                      "w-full sm:w-auto text-xs font-bold text-white rounded-xl px-6 py-2.5 cursor-pointer shadow-md",
                      accentConfig.gradient
                    )}
                  >
                    {isSavingKeys ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <Save className="h-4 w-4 mr-1.5" />
                    )}
                    <span>{isSavingKeys ? "Encrypting & Storing..." : "Save & Encrypt Keys"}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: USAGE & TOKEN ANALYTICS */}
            {/* ========================================================= */}
            {activeTab === "analytics" && (
              <div className="w-full animate-in fade-in-0 duration-150">
                <UsageAnalyticsView
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                />
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: LONG-TERM AI MEMORY & KNOWLEDGE GRAPH */}
            {/* ========================================================= */}
            {activeTab === "memory" && (
              <div className="h-full flex flex-col animate-in fade-in-0 duration-150">
                <MemoryManagementView
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                />
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: DATA CONTROLS */}
            {/* ========================================================= */}
            {activeTab === "data" && (
              <div className="max-w-5xl space-y-8 animate-in fade-in-0 duration-150">
                {/* Conversations Retention */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-6 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Database className="h-4 w-4 text-indigo-500" />
                        <span>Chat Conversation Storage</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Chat messages are persisted in your partitioned PostgreSQL Neon database.
                      </p>
                    </div>

                    {!isConfirmingClearAll ? (
                      <Button
                        type="button"
                        onClick={() => setIsConfirmingClearAll(true)}
                        className="bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold cursor-pointer rounded-xl"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Clear All Conversations
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 animate-in fade-in-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsConfirmingClearAll(false)}
                          className="h-8 text-xs rounded-xl"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setIsConfirmingClearAll(false)
                            onDeleteAllChats?.()
                          }}
                          className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer"
                        >
                          Confirm Delete All
                        </Button>
                      </div>
                    )}
                  </div>

                  {isConfirmingClearAll && (
                    <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-600 dark:text-rose-400 font-medium">
                      Warning: This action will permanently erase all conversations, assistant replies, and attached session telemetry. This cannot be undone.
                    </div>
                  )}
                </div>

                {/* Workspace Data Portability & Export */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-6 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Download className="h-4 w-4 text-emerald-500" />
                        <span>Data Export & Portability</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Download your workspace telemetry and analytics logs as structured JSON or CSV.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("analytics")}
                      className="text-xs rounded-xl border-slate-200 dark:border-white/10"
                    >
                      <BarChart3 className="h-4 w-4 mr-1.5 text-emerald-500" />
                      Go to Analytics Export
                    </Button>
                  </div>
                </div>

                {/* Local Cache & Encrypted Vault */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-6 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-amber-500" />
                        <span>Client Browser Storage Vault</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Cached appearance preferences, client UI states, and encrypted BYOK credentials.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetAllKeys}
                      className="text-xs rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-500"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Reset Encrypted Vault
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: SECURITY & PRIVACY */}
            {/* ========================================================= */}
            {activeTab === "security" && (
              <div className="max-w-5xl space-y-8 animate-in fade-in-0 duration-150">
                {/* 5 Security Architecture Pillars */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Enterprise-Grade Security Architecture
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Nexora AI adheres to zero-trust encryption and strict tenant privacy principles.
                      </p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                      All Protocols Active
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pillar 1 */}
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                          <Lock className="h-4 w-4" />
                        </div>
                        <Badge variant="outline" className="border-teal-500/30 text-teal-600 dark:text-teal-400 font-mono text-[9px]">
                          XSS-Proof
                        </Badge>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">HttpOnly Cookie Auth</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Authentication JWT tokens are stored exclusively in HttpOnly, SameSite cookies. Scripts in the browser cannot read or exfiltrate session keys.
                      </p>
                    </div>

                    {/* Pillar 2 */}
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                          <KeyRound className="h-4 w-4" />
                        </div>
                        <Badge variant="outline" className="border-purple-500/30 text-purple-600 dark:text-purple-400 font-mono text-[9px]">
                          Zero-Knowledge
                        </Badge>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">AES-GCM 256 Client Encryption</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Custom API keys are encrypted via standard Web Crypto API before persisting. Unencrypted keys are never logged or stored server-side.
                      </p>
                    </div>

                    {/* Pillar 3 */}
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                          <Database className="h-4 w-4" />
                        </div>
                        <Badge variant="outline" className="border-indigo-500/30 text-indigo-500 dark:text-indigo-400 font-mono text-[9px]">
                          PostgreSQL Row-Level
                        </Badge>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">Tenant Isolation</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Every database query to Neon PostgreSQL (messages, vector embeddings, memories, documents) is explicitly scoped to the verified `user_id`.
                      </p>
                    </div>

                    {/* Pillar 4 */}
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[9px]">
                          TLS 1.3 Transport
                        </Badge>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">In-Transit Encryption</h5>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        All communications between your browser, FastAPI server, and AI model providers occur over TLS 1.3 encrypted HTTPS / WSS pipelines.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Privacy Commitment */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-6 space-y-2">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Zero AI Model Training Guarantee</span>
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Data sent through Groq, Google Gemini, OpenAI, or OpenRouter in Nexora AI is processed via commercial API endpoints with zero-retention policies. Your private code, prompts, and memory embeddings are never used to train or fine-tune public foundation models.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
