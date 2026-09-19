"use client"

import React, { useState } from "react"
import { Copy, Check, RotateCw, ThumbsUp, ThumbsDown, MoreHorizontal, Share2, Pin } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

interface MessageActionsProps {
  content: string
  onRegenerate?: () => void
  isPinned?: boolean
  onTogglePin?: () => void
}

export function MessageActions({ content, onRegenerate, isPinned, onTogglePin }: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState<boolean | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="flex items-center gap-1 mt-2 opacity-80 hover:opacity-100 transition-opacity">
      <Tooltip content={copied ? "Copied!" : "Copy response"}>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Copy message"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </Tooltip>

      {onRegenerate && (
        <Tooltip content="Regenerate response">
          <button
            onClick={onRegenerate}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Regenerate response"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      )}

      <Tooltip content="Good response">
        <button
          onClick={() => setLiked(liked === true ? null : true)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            liked === true ? "text-emerald-400 bg-emerald-500/10" : "text-slate-400 hover:text-white hover:bg-white/10"
          }`}
          aria-label="Like response"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
      </Tooltip>

      <Tooltip content="Bad response">
        <button
          onClick={() => setLiked(liked === false ? null : false)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            liked === false ? "text-rose-400 bg-rose-500/10" : "text-slate-400 hover:text-white hover:bg-white/10"
          }`}
          aria-label="Dislike response"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </Tooltip>

      {onTogglePin && (
        <Tooltip content={isPinned ? "Unpin message" : "Pin message"}>
          <button
            onClick={onTogglePin}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isPinned
                ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            aria-label={isPinned ? "Unpin message" : "Pin message"}
          >
            <Pin className={`h-3.5 w-3.5 ${isPinned ? "fill-amber-400/40 rotate-45" : ""}`} />
          </button>
        </Tooltip>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="left">
          {onTogglePin && (
            <DropdownMenuItem onClick={onTogglePin}>
              <Pin className={`h-3.5 w-3.5 mr-2 ${isPinned ? "text-amber-400 fill-amber-400/40 rotate-45" : ""}`} />
              {isPinned ? "Unpin Message" : "Pin Message"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5 mr-2" /> Copy Text
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>
            <Share2 className="h-3.5 w-3.5 mr-2" /> Share Message
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
