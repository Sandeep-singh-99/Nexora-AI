"use client"

import React from "react"
import { useArtifact } from "@/components/providers/artifact-provider"
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"

export interface ChatHeaderProps {
  onToggleSidebar: () => void
  isSidebarOpen?: boolean
  // Optional legacy props accepted for backwards compatibility
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
}

export function ChatHeader({
  onToggleSidebar,
  isSidebarOpen = true,
  onToggleMobileSidebar,
}: ChatHeaderProps) {
  // Use onToggleSidebar, falling back to onToggleMobileSidebar if needed
  const handleToggle = onToggleSidebar || onToggleMobileSidebar || (() => {})
  const { isOpen: isCanvasOpen, toggleCanvas, artifacts } = useArtifact()

  return (
    <header className="sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#05070B]/80 px-3 backdrop-blur-xl shrink-0 transition-colors">
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
