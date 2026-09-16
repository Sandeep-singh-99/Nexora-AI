"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "motion/react"
import { MessageSquare } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatHeader } from "@/components/chat/chat-header"
import { AssistantMessage } from "@/components/chat/assistant-message"
import { UserMessage } from "@/components/chat/user-message"
import { EmptyState } from "@/components/chat/empty-state"
import { ChatInput } from "@/components/chat/chat-input"
import { ScrollToBottom } from "@/components/chat/scroll-to-bottom"
import { SettingsDialog } from "@/components/chat/settings-dialog"
import { ChatMessage, ConversationSession, ApiConversation, ApiMessage } from "@/types/chat"
import { sendStreamingChatMessageApi } from "@/lib/api/ai"
import {
  fetchConversationsApi,
  createConversationApi,
  fetchConversationMessagesApi,
  deleteConversationApi,
  updateConversationApi,
  addMessageApi,
} from "@/lib/api/chat"

function ChatSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8 pt-4 animate-pulse">
      {/* Assistant bubble skeleton */}
      <div className="flex w-full gap-3 my-5">
        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0" />
        <div className="flex-1 space-y-3 max-w-2xl">
          <div className="h-4 w-36 rounded-md bg-white/[0.08]" />
          <div className="space-y-2 pt-1">
            <div className="h-3.5 w-full rounded bg-white/[0.05]" />
            <div className="h-3.5 w-5/6 rounded bg-white/[0.05]" />
            <div className="h-3.5 w-2/3 rounded bg-white/[0.04]" />
          </div>
        </div>
      </div>

      {/* User bubble skeleton */}
      <div className="flex w-full justify-end gap-3 my-5">
        <div className="w-1/3 h-11 rounded-2xl rounded-tr-sm bg-emerald-600/15 border border-emerald-500/20" />
        <div className="h-8 w-8 rounded-full bg-emerald-950/40 border border-emerald-500/20 shrink-0" />
      </div>

      {/* Another Assistant bubble skeleton */}
      <div className="flex w-full gap-3 my-5">
        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0" />
        <div className="flex-1 space-y-3 max-w-2xl">
          <div className="h-3.5 w-4/5 rounded bg-white/[0.05]" />
          <div className="h-28 w-full rounded-xl bg-white/[0.03] border border-white/5" />
          <div className="h-3.5 w-1/2 rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  )
}

function mapApiToSession(apiConv: ApiConversation): ConversationSession {
  return {
    id: apiConv.id,
    title: apiConv.title,
    updatedAt: new Date(apiConv.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    preview: "Chat session",
    model: "gemini-2.5-flash",
    category: "Today",
    isPinned: apiConv.is_pinned,
    isArchived: apiConv.is_archived,
  }
}

function mapApiToChatMessage(apiMsg: ApiMessage): ChatMessage {
  return {
    id: apiMsg.id,
    role: apiMsg.role as "user" | "assistant",
    content: apiMsg.content,
    createdAt: new Date(apiMsg.created_at),
  }
}

export default function ChatPage() {
  const { user, isLoading: isAuthLoading } = useAuth()

  const [conversations, setConversations] = useState<ConversationSession[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({})

  const [isConversationsLoading, setIsConversationsLoading] = useState<boolean>(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false)

  const [input, setInput] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false)
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const activeMessages = activeId ? messagesMap[activeId] || [] : []

  // Refresh conversation list from backend
  const refreshConversations = async () => {
    try {
      const remoteConvs = await fetchConversationsApi()
      const sessions = remoteConvs.map(mapApiToSession)
      setConversations(sessions)
      return sessions
    } catch (err) {
      console.error("Failed to refresh conversations:", err)
      return []
    }
  }

  // Load user conversations on initial render
  // Helper to load messages for a given conversation safely
  const loadConversationMessages = async (convId: string) => {
    if (!convId) return
    if (messagesMap[convId] && messagesMap[convId].length > 0) return

    setIsMessagesLoading(true)
    try {
      const msgs = await fetchConversationMessagesApi(convId)
      const formatted = msgs.map(mapApiToChatMessage)
      setMessagesMap((prev) => {
        // Never overwrite if this conversation already has active or streaming messages
        if (prev[convId] && prev[convId].length > 0) return prev
        return { ...prev, [convId]: formatted }
      })
    } catch (err) {
      console.error(`Failed to load messages for conversation ${convId}:`, err)
    } finally {
      setIsMessagesLoading(false)
    }
  }

  // Load user conversations on initial render
  useEffect(() => {
    let isMounted = true
    async function initConversations() {
      setIsConversationsLoading(true)
      try {
        const remoteConvs = await fetchConversationsApi()
        if (!isMounted) return

        if (remoteConvs.length > 0) {
          const sessions = remoteConvs.map(mapApiToSession)
          setConversations(sessions)
          const firstId = sessions[0].id
          setActiveId(firstId)
          loadConversationMessages(firstId)
        } else {
          // If no conversations exist, set activeId to blank draft state
          setConversations([])
          setActiveId("")
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err)
      } finally {
        if (isMounted) {
          setIsConversationsLoading(false)
        }
      }
    }

    if (user) {
      initConversations()
    } else if (!isAuthLoading) {
      setIsConversationsLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [user, isAuthLoading])

  // Auto-scroll to bottom on message change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeMessages.length, isLoading, isMessagesLoading])

  // Track scroll position for floating button
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 150
      setShowScrollBottom(isFarFromBottom)
    }
  }

  // Handle New Chat (Switch to fresh blank draft state without creating empty DB rows)
  const handleNewChat = () => {
    setActiveId("")
    setInput("")
    setMobileSidebarOpen(false)
  }

  // Handle selecting a conversation from sidebar
  const handleSelectConversation = (id: string) => {
    if (id === activeId) {
      setMobileSidebarOpen(false)
      return
    }
    setActiveId(id)
    setMobileSidebarOpen(false)

    if (!messagesMap[id] || messagesMap[id].length === 0) {
      loadConversationMessages(id)
    }
  }

  // Rename Conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await updateConversationApi(id, { title: newTitle })
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      )
    } catch (err) {
      console.error("Failed to rename conversation:", err)
    }
  }

  // Delete Single Conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversationApi(id)
      const nextConvs = conversations.filter((c) => c.id !== id)
      setConversations(nextConvs)

      setMessagesMap((prev) => {
        const nextMap = { ...prev }
        delete nextMap[id]
        return nextMap
      })

      if (activeId === id) {
        if (nextConvs.length > 0) {
          setActiveId(nextConvs[0].id)
        } else {
          setActiveId("")
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err)
    }
  }

  // Delete All Conversations
  const handleDeleteAllConversations = async () => {
    for (const conv of conversations) {
      try {
        await deleteConversationApi(conv.id)
      } catch (e) {
        console.error(`Failed to delete conversation ${conv.id}:`, e)
      }
    }
    setConversations([])
    setMessagesMap({})
    setActiveId("")
    setIsSettingsOpen(false)
  }

  // Stop Generation Handler
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
    if (activeId) {
      setMessagesMap((prev) => {
        const currentList = prev[activeId] || []
        const updatedList = currentList.map((msg) => ({
          ...msg,
          statusLabel: undefined,
          isSearching: false,
        }))
        return { ...prev, [activeId]: updatedList }
      })
    }
  }

  // Submit User Message
  const handleSubmitMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input
    if (!textToSend.trim() || isLoading) return

    let currentConvId = activeId

    // If draft mode (no active conversation), create conversation in DB now
    if (!currentConvId) {
      try {
        const titleSnippet = textToSend.slice(0, 30) + (textToSend.length > 30 ? "..." : "")
        const created = await createConversationApi(titleSnippet)
        const session = mapApiToSession(created)
        setConversations((prev) => [session, ...prev])
        setActiveId(session.id)
        currentConvId = session.id
      } catch (err) {
        console.error("Failed to create conversation on message submit:", err)
        return
      }
    }

    // Cancel any previous stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: textToSend,
      createdAt: new Date(),
    }

    const assistantMsgId = `msg-ai-${Date.now()}`
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      thinkingText: "",
      statusLabel: "Connecting...",
      createdAt: new Date(),
    }

    setMessagesMap((prev) => ({
      ...prev,
      [currentConvId]: [...(prev[currentConvId] || []), userMsg, initialAssistantMsg],
    }))

    setInput("")
    setIsLoading(true)

    // Save user message to backend DB asynchronously
    addMessageApi(currentConvId, textToSend, "user").catch((err) =>
      console.error("Failed to persist user message:", err)
    )

    const startTime = Date.now()
    let finalAssistantText = ""
    let accumulatedThinking = ""

    try {
      await sendStreamingChatMessageApi(
        { message: textToSend, thread_id: currentConvId },
        (event) => {
          const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1)

          if (event.type === "token") {
            finalAssistantText += event.content
          } else if (event.type === "thinking") {
            accumulatedThinking += event.content
          }

          setMessagesMap((prev) => {
            const currentList = prev[currentConvId] || []
            const updatedList = currentList.map((msg) => {
              if (msg.id !== assistantMsgId) return msg

              if (event.type === "status") {
                return { ...msg, statusLabel: event.label, thinkingTime: `${durationSeconds}s` }
              } else if (event.type === "search") {
                return {
                  ...msg,
                  isSearching: event.status === "searching",
                  searchQuery: event.query || msg.searchQuery,
                  searchResults: event.results && event.results.length > 0 ? event.results : msg.searchResults,
                }
              } else if (event.type === "thinking") {
                return {
                  ...msg,
                  thinkingText: accumulatedThinking,
                  thinkingTime: `${durationSeconds}s`,
                }
              } else if (event.type === "token") {
                return {
                  ...msg,
                  content: finalAssistantText,
                  statusLabel: undefined,
                  thinkingTime: `${durationSeconds}s`,
                }
              } else if (event.type === "ui") {
                return {
                  ...msg,
                  ui: event.ui,
                }
              } else if (event.type === "end") {
                return {
                  ...msg,
                  statusLabel: undefined,
                  isSearching: false,
                }
              }
              return msg
            })
            return { ...prev, [currentConvId]: updatedList }
          })
        },
        controller.signal
      )

      // Ensure any status badges and search indicators are cleared on completion
      setMessagesMap((prev) => {
        const currentList = prev[currentConvId] || []
        const updatedList = currentList.map((msg) => {
          if (msg.id !== assistantMsgId) return msg
          return {
            ...msg,
            statusLabel: undefined,
            isSearching: false,
          }
        })
        return { ...prev, [currentConvId]: updatedList }
      })

      // Persist assistant message to DB after streaming completes
      if (finalAssistantText) {
        await addMessageApi(currentConvId, finalAssistantText, "assistant").catch((err) =>
          console.error("Failed to persist assistant message:", err)
        )
      }

      // Re-sync conversation list from backend so titles & timestamps update
      await refreshConversations()
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Chat error:", err)
        setMessagesMap((prev) => {
          const currentList = prev[currentConvId] || []
          const updatedList = currentList.map((msg) => {
            if (msg.id === assistantMsgId) {
              return {
                ...msg,
                content: "An error occurred while communicating with Nexora AI. Please try again.",
                statusLabel: undefined,
                isSearching: false,
              }
            }
            return msg
          })
          return { ...prev, [currentConvId]: updatedList }
        })
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
      setMessagesMap((prev) => {
        const currentList = prev[currentConvId] || []
        const updatedList = currentList.map((msg) => {
          if (msg.id !== assistantMsgId) return msg
          return {
            ...msg,
            statusLabel: undefined,
            isSearching: false,
          }
        })
        return { ...prev, [currentConvId]: updatedList }
      })
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0F18] text-slate-100 font-sans">
      {/* Sidebar Component */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isMessagesLoading={isMessagesLoading}
      />

      {/* Main Chat Interface */}
      <div className="flex flex-1 flex-col h-full overflow-hidden relative">
        {/* Fixed Header */}
        <ChatHeader
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          onNewChat={handleNewChat}
        />

        {/* Scrollable Messages Area Wrapper */}
        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto px-4 md:px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
          >
            {isConversationsLoading ? (
              <ChatSkeleton />
            ) : isLoading ? (
              <div className="max-w-4xl mx-auto space-y-6 pb-8">
                {activeMessages.map((msg) => {
                  if (msg.role === "user") {
                    return <UserMessage key={msg.id} content={msg.content} />
                  } else {
                    return <AssistantMessage key={msg.id} message={msg} />
                  }
                })}
                <div ref={messagesEndRef} />
              </div>
            ) : activeId === "" ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col justify-center min-h-full py-8"
              >
                <EmptyState onSelectSuggestion={(promptText: string) => handleSubmitMessage(promptText)} />
              </motion.div>
            ) : isMessagesLoading ? (
              <ChatSkeleton />
            ) : activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[45vh] py-8 text-center text-slate-400">
                <div className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-3 text-emerald-400 shadow-inner">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-200">No messages in this chat yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">Ask a question or enter a prompt below to start chatting.</p>
              </div>
            ) : (
              <motion.div
                key={activeId || "active-chat"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="max-w-4xl mx-auto space-y-6 pb-8"
              >
                {activeMessages.map((msg) => {
                  if (msg.role === "user") {
                    return <UserMessage key={msg.id} content={msg.content} />
                  } else {
                    return <AssistantMessage key={msg.id} message={msg} />
                  }
                })}
                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && <ScrollToBottom onClick={scrollToBottom} />}
        </div>

        {/* Dedicated Chat Input Area with clear spacing */}
        <div className="shrink-0 px-4 md:px-8 pt-4 pb-6 bg-[#0A0F18] border-t border-white/[0.06]">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              onSubmit={() => handleSubmitMessage()}
              onStop={handleStopGeneration}
            />
          </div>
        </div>
      </div>

      {/* Settings & Personalization Dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDeleteAllChats={handleDeleteAllConversations}
      />
    </div>
  )
}
