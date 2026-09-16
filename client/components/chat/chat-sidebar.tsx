"use client"

import React, { useState } from "react"
import { ConversationSession } from "@/types/chat"
import { Plus, Search, MessageSquare, Trash2, Edit3, Settings, User, Sparkles, MoreHorizontal, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Sheet } from "@/components/ui/sheet"
import { useCurrentUser } from "@/hooks/use-auth"

interface ChatSidebarProps {
  conversations: ConversationSession[]
  activeId: string
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onDeleteConversation: (id: string) => void
  onRenameConversation?: (id: string, newTitle: string) => void
  onOpenSettings?: () => void
  isOpenMobile?: boolean
  onCloseMobile?: () => void
  isMessagesLoading?: boolean
}

export function SidebarContent({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenSettings,
  isMessagesLoading,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { data: user } = useCurrentUser()

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "US"

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = ["Today", "Yesterday", "Previous 7 Days"] as const

  return (
    <div className="flex h-full w-full flex-col justify-between bg-[#05070B] p-4 text-slate-200 border-r border-white/10">
      {/* Top Header & Branding */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-md flex items-center justify-center">
              <div className="h-full w-full rounded-[10px] bg-[#05070B] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Nexora AI</h2>
              <p className="text-[10px] text-slate-400 font-mono">Workspace v1.0</p>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 px-4 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-950/40 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] transition-all cursor-pointer mb-4"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>New Chat</span>
        </button>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="h-9 pl-9 text-xs bg-white/[0.03] border-white/10 placeholder:text-slate-500"
          />
        </div>

        {/* Conversations List */}
        <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-slate-500">
              No conversations found.
            </div>
          ) : (
            categories.map((cat) => {
              const items = filtered.filter((c) => (c.category || "Today") === cat)
              if (items.length === 0) return null

              return (
                <div key={cat} className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 block">
                    {cat}
                  </span>
                  {items.map((item) => {
                    const isActive = item.id === activeId
                    const isLoadingThis = isActive && isMessagesLoading
                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectConversation(item.id)}
                        className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-sm"
                            : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                          {isLoadingThis ? (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 text-emerald-400 animate-spin" />
                          ) : (
                            <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                          )}
                          <span className="truncate">{item.title}</span>
                        </div>

                        {/* Dropdown Options on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="right">
                              <DropdownMenuItem
                                onClick={() => {
                                  const newTitle = prompt("Enter new title:", item.title)
                                  if (newTitle && onRenameConversation) {
                                    onRenameConversation(item.id, newTitle)
                                  }
                                }}
                              >
                                <Edit3 className="h-3.5 w-3.5 mr-2" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDeleteConversation(item.id)}
                                className="text-rose-400 hover:text-rose-300"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* User Footer Profile & Settings */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Avatar className="h-8 w-8 bg-emerald-950 border border-emerald-500/30 shrink-0">
            <AvatarFallback className="bg-emerald-950 text-emerald-300 text-xs font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate max-w-[120px]">
              {user?.email || "User Account"}
            </p>
            <p className="text-[10px] text-slate-400">Pro Workspace</p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ChatSidebar(props: ChatSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar (Fixed 260px) */}
      <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile Drawer (Sheet) */}
      {props.isOpenMobile && (
        <Sheet isOpen={props.isOpenMobile} onClose={props.onCloseMobile || (() => {})}>
          <div className="h-full w-full">
            <SidebarContent {...props} />
          </div>
        </Sheet>
      )}
    </>
  )
}
