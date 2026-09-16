"use client"

import React, { useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatHeader } from "@/components/chat/chat-header"
import { AssistantMessage } from "@/components/chat/assistant-message"
import { UserMessage } from "@/components/chat/user-message"
import { EmptyState } from "@/components/chat/empty-state"
import { ChatInput } from "@/components/chat/chat-input"
import { ScrollToBottom } from "@/components/chat/scroll-to-bottom"
import { SettingsDialog } from "@/components/chat/settings-dialog"
import { ChatMessage, ConversationSession } from "@/types/chat"
import { sendStreamingChatMessageApi } from "@/lib/api/ai"

const INITIAL_CONVERSATIONS: ConversationSession[] = [
  {
    id: "conv-1",
    title: "Monthly Revenue Analytics",
    updatedAt: "Just now",
    preview: "Show me my monthly revenue.",
    model: "llama-3.3-70b-versatile",
    category: "Today",
  },
  {
    id: "conv-2",
    title: "Recent User Transactions",
    updatedAt: "1 hour ago",
    preview: "Show my recent transactions.",
    model: "gemini-2.5-flash",
    category: "Today",
  },
  {
    id: "conv-3",
    title: "ClassBuddy Project Summary",
    updatedAt: "Yesterday",
    preview: "Show me my project overview.",
    model: "gemini-2.5-pro",
    category: "Yesterday",
  },
]

const INITIAL_MESSAGES_MAP: Record<string, ChatMessage[]> = {
  "conv-1": [
    {
      id: "msg-1-1",
      role: "user",
      content: "Show me my monthly revenue.",
      createdAt: new Date(),
    },
    {
      id: "msg-1-2",
      role: "assistant",
      content: "Your monthly revenue reached **$24,580** in September, representing an **+18.4% increase** compared to last month. Here is your detailed revenue breakdown chart:",
      thinkingTime: "1.8s",
      createdAt: new Date(),
      ui: {
        type: "chart",
        props: {
          title: "September 2026 Monthly Revenue Breakdown",
          description: "Revenue performance across main subscription tiers.",
          totalAmount: "$24,580",
          growthRate: "+18.4%",
          data: [
            { name: "Pro Tier ($49/mo)", value: 12400 },
            { name: "Enterprise ($499/mo)", value: 8500 },
            { name: "Starter ($19/mo)", value: 3680 },
          ],
        },
      },
    },
  ],
  "conv-2": [
    {
      id: "msg-2-1",
      role: "user",
      content: "Show my recent transactions.",
      createdAt: new Date(),
    },
    {
      id: "msg-2-2",
      role: "assistant",
      content: "Here are the 4 most recent user transactions processed in your workspace:",
      thinkingTime: "1.2s",
      createdAt: new Date(),
      ui: {
        type: "table",
        props: {
          title: "Recent Workspaces Transactions",
          rows: [
            { id: "TX-9021", user: "Acme Corp", amount: "$1,490.00", status: "Completed", date: "Sep 14, 2026" },
            { id: "TX-9022", user: "DevStudio Inc", amount: "$490.00", status: "Completed", date: "Sep 14, 2026" },
            { id: "TX-9023", user: "SaaSify Co", amount: "$99.00", status: "Pending", date: "Sep 15, 2026" },
            { id: "TX-9024", user: "John Doe", amount: "$29.00", status: "Completed", date: "Sep 15, 2026" },
          ],
        },
      },
    },
  ],
  "conv-3": [
    {
      id: "msg-3-1",
      role: "user",
      content: "Show me my project overview.",
      createdAt: new Date(),
    },
    {
      id: "msg-3-2",
      role: "assistant",
      content: "Here is your active project card summary:",
      thinkingTime: "1.0s",
      createdAt: new Date(),
      ui: {
        type: "project",
        props: {
          title: "ClassBuddy AI Platform",
          status: "In Progress",
          progress: 78,
          membersCount: 6,
          updatedDate: "Sep 14, 2026",
          tags: ["Next.js 15", "FastAPI", "LangGraph", "PostgreSQL"],
        },
      },
    },
  ],
}

export default function ChatPage() {
  const { user, isLoading: isAuthLoading } = useAuth()

  const [conversations, setConversations] = useState<ConversationSession[]>(INITIAL_CONVERSATIONS)
  const [activeId, setActiveId] = useState<string>("conv-1")
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES_MAP)

  const [input, setInput] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("llama-3.3-70b-versatile")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false)
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const activeMessages = messagesMap[activeId] || []

  // Auto-scroll to bottom on message change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeMessages.length, isLoading])

  // Track scroll position for floating button
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 150
      setShowScrollBottom(isFarFromBottom)
    }
  }

  // Create New Chat
  const handleNewChat = () => {
    const newId = `conv-${Date.now()}`
    const newSession: ConversationSession = {
      id: newId,
      title: "New Chat",
      updatedAt: "Just now",
      preview: "Empty conversation",
      model: selectedModel,
      category: "Today",
    }
    setConversations([newSession, ...conversations])
    setMessagesMap({ ...messagesMap, [newId]: [] })
    setActiveId(newId)
    setMobileSidebarOpen(false)
  }

  // Delete Single Conversation
  const handleDeleteConversation = (id: string) => {
    const nextConvs = conversations.filter((c) => c.id !== id)
    setConversations(nextConvs)
    if (activeId === id && nextConvs.length > 0) {
      setActiveId(nextConvs[0].id)
    }
  }

  // Delete All Conversations (Data Control)
  const handleDeleteAllConversations = () => {
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
  }

  // Submit User Message
  const handleSubmitMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input
    if (!textToSend.trim() || isLoading) return

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
      [activeId]: [...(prev[activeId] || []), userMsg, initialAssistantMsg],
    }))

    setInput("")
    setIsLoading(true)

    // Update conversation title if it was new chat
    const currentConv = conversations.find((c) => c.id === activeId)
    if (currentConv && currentConv.title === "New Chat") {
      currentConv.title = textToSend.slice(0, 30) + (textToSend.length > 30 ? "..." : "")
    }

    const startTime = Date.now()

    try {
      await sendStreamingChatMessageApi(
        { message: textToSend, thread_id: activeId },
        (event) => {
          const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1)

          setMessagesMap((prev) => {
            const currentList = prev[activeId] || []
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
                  thinkingText: (msg.thinkingText || "") + event.content,
                  thinkingTime: `${durationSeconds}s`,
                }
              } else if (event.type === "token") {
                return {
                  ...msg,
                  content: msg.content + event.content,
                  thinkingTime: `${durationSeconds}s`,
                  statusLabel: undefined,
                }
              } else if (event.type === "ui") {
                return {
                  ...msg,
                  ui: event.ui || (event as any).component,
                }
              } else if (event.type === "end") {
                return { ...msg, statusLabel: undefined }
              }
              return msg
            })
            return { ...prev, [activeId]: updatedList }
          })
        },
        controller.signal
      )
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Stream stopped by user abort signal.")
        setMessagesMap((prev) => {
          const currentList = prev[activeId] || []
          const updatedList = currentList.map((msg) => {
            if (msg.id !== assistantMsgId) return msg
            return {
              ...msg,
              statusLabel: undefined,
              content: msg.content ? msg.content + " *(Stopped)*" : "*(Response stopped by user)*",
            }
          })
          return { ...prev, [activeId]: updatedList }
        })
        return
      }

      console.error("AI Chat API Error:", error)
      let displayError = "⚠️ **Connection Error**: Unable to connect to the backend server `/api/v1/ai/chat/stream`. Please make sure your FastAPI backend server is running on `http://localhost:8000`."

      if (error && typeof error === "object") {
        const detail = error.detail || error
        if (typeof detail === "object" && detail !== null) {
          if (detail.code === "CONTENT_BLOCKED") {
            displayError = `🛡️ **Content Blocked**: ${detail.message || "Your message was flagged by safety guardrails and could not be processed."}`
          } else if (detail.message) {
            displayError = `⚠️ **Error**: ${detail.message}`
          }
        } else if (typeof detail === "string") {
          displayError = `⚠️ **Error**: ${detail}`
        }
      }

      setMessagesMap((prev) => {
        const currentList = prev[activeId] || []
        const updatedList = currentList.map((msg) => {
          if (msg.id !== assistantMsgId) return msg
          return { ...msg, content: displayError, statusLabel: undefined }
        })
        return { ...prev, [activeId]: updatedList }
      })
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#05070B] text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-mono text-slate-400">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#05070B] text-slate-100 font-sans">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={setActiveId}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex flex-1 flex-col h-full overflow-hidden relative">
        {/* Header */}
        <ChatHeader
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          onNewChat={handleNewChat}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />

        {/* Scrollable Message Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-4 max-w-4xl w-full mx-auto scrollbar-thin"
        >
          {activeMessages.length === 0 ? (
            <EmptyState onSelectSuggestion={(promptText) => handleSubmitMessage(promptText)} />
          ) : (
            activeMessages.map((msg) => (
              <React.Fragment key={msg.id}>
                {msg.role === "user" ? (
                  <UserMessage content={msg.content} />
                ) : (
                  <AssistantMessage
                    message={msg}
                    onRegenerate={() => handleSubmitMessage(msg.content)}
                  />
                )}
              </React.Fragment>
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 my-4 animate-pulse">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-mono">
                ✦
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Nexora AI is processing response...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll To Bottom Floating Trigger */}
        <ScrollToBottom onClick={scrollToBottom} visible={showScrollBottom} />

        {/* Composer Input Area */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={() => handleSubmitMessage()}
          isLoading={isLoading}
          onStop={handleStopGeneration}
        />
      </div>

      {/* ChatGPT-style Settings Dialog Modal */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDeleteAllChats={handleDeleteAllConversations}
      />
    </div>
  )
}
