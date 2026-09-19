"use client"

import React from "react"
import { ChatMessage as ChatMessageType } from "@/types/chat"
import { UserMessage } from "./user-message"
import { AssistantMessage } from "./assistant-message"

interface ChatMessageProps {
  message: ChatMessageType
  onRegenerate?: () => void
  isPinned?: boolean
  onTogglePin?: () => void
}

export function ChatMessageItem({ message, onRegenerate, isPinned, onTogglePin }: ChatMessageProps) {
  if (message.role === "user") {
    return <UserMessage content={message.content} />
  }
  return (
    <AssistantMessage
      message={message}
      onRegenerate={onRegenerate}
      isPinned={isPinned}
      onTogglePin={onTogglePin}
    />
  )
}
