"use client"

import React from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
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

  return (
    <header className="sticky top-0 z-30 flex h-12 w-full items-center border-b border-white/10 bg-[#05070B]/80 px-3 backdrop-blur-xl shrink-0">
      <Tooltip
        content={isSidebarOpen ? "Minimize sidebar" : "Maximize sidebar"}
        side="right"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
          aria-label={isSidebarOpen ? "Minimize sidebar" : "Maximize sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
      </Tooltip>
    </header>
  )
}
