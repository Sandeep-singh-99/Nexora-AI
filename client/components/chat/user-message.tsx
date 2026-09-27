"use client"

import React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { useAppearance } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

interface UserMessageProps {
  content: string
}

export function UserMessage({ content }: UserMessageProps) {
  const { accentConfig } = useAppearance()

  return (
    <div className="flex w-full justify-end gap-3 my-4">
      <div className="flex max-w-[85%] md:max-w-[75%] flex-col items-end">
        <div
          className={cn(
            "rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-md border text-slate-900 dark:text-slate-100",
            accentConfig.activeBg,
            accentConfig.activeBorder
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
      </div>
      <Avatar className={cn("h-8 w-8 shrink-0 border", accentConfig.badgeBg, accentConfig.activeBorder)}>
        <AvatarFallback className={cn("bg-transparent font-semibold text-xs", accentConfig.activeText)}>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    </div>
  )
}
