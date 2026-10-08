"use client"

import React from "react"
import { useArtifact } from "@/components/providers/artifact-provider"
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  ChevronDown,
  Cpu,
  Zap,
  KeyRound,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCustomApiKeys } from "@/lib/custom-keys"

export interface ChatHeaderProps {
  onToggleSidebar: () => void
  isSidebarOpen?: boolean
  onToggleMobileSidebar?: () => void
  onNewChat?: () => void
  selectedModel?: string
  setSelectedModel?: (model: string) => void
  pinnedCount?: number
  pinnedItems?: any[]
  onSelectPinnedMessage?: (messageId: string) => void
  documentsCount?: number
  onOpenDocuments?: () => void
  activeDocument?: any
  onClearActiveDocument?: () => void
  onOpenSettings?: (tab?: "appearance" | "account" | "keys" | "memory" | "data" | "security") => void
}

const MODELS = [
  {
    id: "groq",
    name: "Groq",
    modelName: "Llama 3.3 70B",
    speed: "Ultra-fast",
    icon: Zap,
    description: "Lightning-fast inference powered by Groq LPU engine",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    modelName: "Gemini 2.0 Flash",
    speed: "High Speed",
    icon: Sparkles,
    description: "Multimodal reasoning & massive context",
  },
  {
    id: "openai",
    name: "OpenAI",
    modelName: "GPT-4o Mini",
    speed: "Standard",
    icon: Cpu,
    description: "High-capability reasoning and instruction following",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    modelName: "DeepSeek R1",
    speed: "Reasoning",
    icon: Cpu,
    description: "Open-weights reasoning model via OpenRouter API",
  },
]

export function ChatHeader({
  onToggleSidebar,
  isSidebarOpen = true,
  onToggleMobileSidebar,
  selectedModel = "groq",
  setSelectedModel,
  onOpenSettings,
}: ChatHeaderProps) {
  const handleToggle = onToggleSidebar || onToggleMobileSidebar || (() => {})
  const { isOpen: isCanvasOpen, toggleCanvas, artifacts } = useArtifact()
  const { hasChatKey } = useCustomApiKeys()

  const currentModelConfig =
    MODELS.find((m) => m.id === selectedModel) ||
    MODELS.find((m) => selectedModel.toLowerCase().includes(m.id)) ||
    {
      id: selectedModel,
      name: selectedModel.includes("gemini")
        ? "Google Gemini"
        : selectedModel.includes("gpt") || selectedModel.includes("openai")
        ? "OpenAI"
        : selectedModel.includes("deepseek") || selectedModel.includes("qwen")
        ? "OpenRouter"
        : "Groq",
      modelName: selectedModel,
      speed: "Custom",
      icon: Cpu,
      description: "Custom user-selected model",
    }
  const IconComponent = currentModelConfig.icon

  return (
    <header className="sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#05070B]/80 px-3 backdrop-blur-xl shrink-0 transition-colors">
      <div className="flex items-center gap-2">
        <Tooltip
          content={isSidebarOpen ? "Minimize sidebar" : "Maximize sidebar"}
          side="right"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
            aria-label={isSidebarOpen ? "Minimize sidebar" : "Maximize sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
        </Tooltip>

        {/* Model Selector Dropdown (Per-Session Model Preference) */}
        {setSelectedModel && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/80 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
              >
                <IconComponent className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {currentModelConfig.name} <span className="text-slate-400 dark:text-slate-500 font-normal">({currentModelConfig.modelName})</span>
                </span>
                {hasChatKey && (
                  <Badge className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    BYOK
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 text-slate-400 dark:text-slate-500 ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="left" className="w-64 p-1.5 z-50">
              <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Select Model for this Chat
              </div>

              {MODELS.map((item) => {
                const isSelected = item.id === selectedModel
                const ItemIcon = item.icon
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => setSelectedModel(item.id)}
                    className="flex items-start justify-between p-2 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 p-1 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                        <ItemIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({item.modelName})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />}
                  </DropdownMenuItem>
                )
              })}

              <Separator className="my-1.5 bg-slate-200 dark:bg-white/10" />

              <DropdownMenuItem
                onClick={() => onOpenSettings?.("keys")}
                className="flex items-center justify-between p-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>Custom API Keys (BYOK)...</span>
                </div>
                {hasChatKey ? (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 text-emerald-500 border-emerald-500/30">
                    Configured
                  </Badge>
                ) : (
                  <span className="text-[10px] text-slate-400">Prebuilt</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Right side: Canvas toggle button */}
      {artifacts.length > 0 && (
        <Tooltip content={isCanvasOpen ? "Hide Canvas" : "Open Canvas"} side="left">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCanvas}
            className={`h-8 px-2.5 text-xs font-medium rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
              isCanvasOpen
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            {isCanvasOpen ? (
              <PanelRightClose className="h-4 w-4 text-emerald-500" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
            <span className="font-medium">Canvas</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              {artifacts.length}
            </span>
          </Button>
        </Tooltip>
      )}
    </header>
  )
}
