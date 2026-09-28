"use client"

import React, { useState } from "react"
import { ConversationSession } from "@/types/chat"
import { Plus, Search, MessageSquare, Trash2, Edit3, Settings, Sparkles, MoreHorizontal, Loader2, Pin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Sheet } from "@/components/ui/sheet"
import { useCurrentUser } from "@/hooks/use-auth"
import { ChatSidebarSkeleton } from "@/components/chat/chat-sidebar-skeleton"
import { useAppearance } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

export interface ChatSidebarProps {
  conversations: ConversationSession[]
  activeId: string
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onDeleteConversation: (id: string) => void
  onRenameConversation?: (id: string, newTitle: string) => void
  onTogglePinConversation?: (id: string, isPinned: boolean) => void
  onOpenSettings?: (tab?: "appearance" | "account" | "memory" | "data" | "security") => void
  isOpenMobile?: boolean
  onCloseMobile?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isMessagesLoading?: boolean
  isLoading?: boolean
}

export function SidebarContent({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  onOpenSettings,
  onToggleCollapse,
  isMessagesLoading,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { data: user } = useCurrentUser()
  const { accentConfig } = useAppearance()

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "US"

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-[#05070B] p-4 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-white/10 select-none">
      {/* Top Header & Branding */}
      <div className="shrink-0">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className={cn("h-8 w-8 rounded-xl bg-gradient-to-br p-0.5 shadow-md flex items-center justify-center", accentConfig.gradient)}>
              <div className="h-full w-full rounded-[10px] bg-white dark:bg-[#05070B] flex items-center justify-center">
                <Sparkles className={cn("h-4 w-4", accentConfig.activeText)} />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Nexora AI</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Workspace v1.0</p>
            </div>
          </div>
        </div>

        <Separator className="mb-4 bg-slate-200 dark:bg-white/5" />

        {/* New Chat Button using shadcn Button */}
        <Button
          onClick={onNewChat}
          className={cn(
            "w-full mb-4 flex items-center justify-center gap-2 rounded-xl py-2.5 h-10 px-4 text-xs font-bold text-white shadow-md active:scale-[0.98] transition-all cursor-pointer border-0 bg-gradient-to-r",
            accentConfig.gradient,
            accentConfig.hoverGradient
          )}
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>New Chat</span>
        </Button>

        {/* Search Bar using shadcn Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="h-9 pl-9 text-xs bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
          />
        </div>
      </div>

      {/* Conversations List - takes full available height */}
      <div className="flex-1 min-h-0 space-y-1 overflow-y-auto pr-1 pb-16 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
            No conversations found.
          </div>
        ) : (
          (() => {
            const pinnedItems = filtered.filter((item) => item.isPinned)
            const unpinnedItems = filtered.filter((item) => !item.isPinned)

            const renderConversationRow = (item: typeof filtered[0]) => {
              const isActive = item.id === activeId
              const isLoadingThis = isActive && isMessagesLoading
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectConversation(item.id)}
                  className={cn(
                    "group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer",
                    isActive
                      ? cn(accentConfig.activeBg, accentConfig.activeText, accentConfig.activeBorder, "border shadow-sm font-semibold")
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-2 flex-1 min-w-0">
                    {isLoadingThis ? (
                      <Loader2 className={cn("h-3.5 w-3.5 shrink-0 animate-spin", accentConfig.activeText)} />
                    ) : item.isPinned ? (
                      <Pin className="h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400 fill-amber-400/40 rotate-45" />
                    ) : (
                      <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", isActive ? accentConfig.activeText : "text-slate-400 dark:text-slate-500")} />
                    )}
                    <span className="truncate">{item.title}</span>
                  </div>

                  {/* Dropdown Options on hover/focus/open */}
                  <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100 transition-opacity shrink-0 ml-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"
                          title="Options"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="right" side="auto" className="w-36 min-w-[8.5rem] z-50">
                        <DropdownMenuItem
                          onClick={() => onTogglePinConversation?.(item.id, !item.isPinned)}
                        >
                          <Pin className={`h-3.5 w-3.5 mr-2 ${item.isPinned ? "text-amber-400 fill-amber-400/40 rotate-45" : "text-slate-400"}`} />
                          <span>{item.isPinned ? "Unpin" : "Pin"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const newTitle = prompt("Enter new title:", item.title)
                            if (newTitle && onRenameConversation) {
                              onRenameConversation(item.id, newTitle)
                            }
                          }}
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-2 text-slate-400" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteConversation(item.id)}
                          className="text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            }

            return (
              <div className="space-y-3">
                {/* Pinned Section */}
                {pinnedItems.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400/90">
                      <Pin className="h-2.5 w-2.5 rotate-45 fill-amber-400/40" />
                      <span>Pinned</span>
                      <Badge variant="default" className="ml-auto text-[9px] px-1.5 py-0 rounded-full bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-300 font-mono border-amber-500/20 dark:border-amber-400/20">
                        {pinnedItems.length}
                      </Badge>
                    </div>
                    {pinnedItems.map(renderConversationRow)}
                  </div>
                )}

                {/* Separator between Pinned and Other Chats */}
                {pinnedItems.length > 0 && unpinnedItems.length > 0 && (
                  <div className="relative py-2">
                    <Separator className="bg-slate-200 dark:bg-white/10" />
                    <div className="relative flex justify-center text-[9px] uppercase -top-2.5">
                      <span className="bg-slate-50 dark:bg-[#05070B] px-2 text-slate-400 dark:text-slate-500 font-semibold tracking-wider">
                        Chats
                      </span>
                    </div>
                  </div>
                )}

                {/* Unpinned / Regular Section */}
                {unpinnedItems.length > 0 && (
                  <div className="space-y-1">
                    {pinnedItems.length === 0 && (
                      <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Recent
                      </div>
                    )}
                    {unpinnedItems.map(renderConversationRow)}
                  </div>
                )}
              </div>
            )
          })()
        )}
      </div>

      {/* User Footer Profile & Settings */}
      <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
        <div
          onClick={() => onOpenSettings?.("account")}
          className="flex items-center gap-2.5 overflow-hidden cursor-pointer rounded-xl p-1 -m-1 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          title="Account & Session Settings"
        >
          <Avatar className={cn("h-8 w-8 shrink-0 border", accentConfig.badgeBg, accentConfig.activeBorder)}>
            <AvatarFallback className={cn("text-xs font-bold bg-transparent", accentConfig.activeText)}>
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
              {user?.email || "User Account"}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Pro Workspace</p>
          </div>
        </div>

        <Tooltip content="Settings" side="top">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenSettings?.()}
            className="h-8 w-8 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

export function ChatSidebar(props: ChatSidebarProps) {
  if (props.isLoading) {
    return (
      <ChatSidebarSkeleton
        isOpenMobile={props.isOpenMobile}
        onCloseMobile={props.onCloseMobile}
        isCollapsed={props.isCollapsed}
      />
    )
  }

  return (
    <>
      {/* Desktop Sidebar (Smooth Minimize / Maximize transition) */}
      <aside
        className={cn(
          "hidden md:flex h-screen shrink-0 flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#05070B] transition-all duration-300 ease-in-out overflow-hidden",
          props.isCollapsed ? "w-0 border-r-0 opacity-0 pointer-events-none" : "w-64 opacity-100"
        )}
      >
        <div className="w-64 h-full flex flex-col">
          <SidebarContent {...props} />
        </div>
      </aside>

      {/* Mobile Drawer (Sheet) */}
      {props.isOpenMobile && (
        <Sheet
          isOpen={props.isOpenMobile}
          onClose={props.onCloseMobile || (() => {})}
          side="left"
          showCloseButton={true}
        >
          <div className="h-full w-full">
            <SidebarContent {...props} />
          </div>
        </Sheet>
      )}
    </>
  )
}
