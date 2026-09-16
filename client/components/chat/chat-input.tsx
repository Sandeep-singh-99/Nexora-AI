"use client"

import React, { useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip } from "@/components/ui/tooltip"
import { ArrowUp, Paperclip, Mic, Square, Sparkles, Globe, Code2 } from "lucide-react"

interface ChatInputProps {
  input: string
  setInput: (val: string) => void
  onSubmit: (e?: React.FormEvent) => void
  isLoading?: boolean
  onStop?: () => void
}

export function ChatInput({ input, setInput, onSubmit, isLoading = false, onStop }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        onSubmit()
      }
    }
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (input.trim() && !isLoading) {
            onSubmit(e)
          }
        }}
        className="relative rounded-2xl border border-white/15 bg-[#0D131D]/90 p-3 shadow-2xl backdrop-blur-2xl transition-all focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Nexora anything... (Shift+Enter for newline)"
          rows={1}
          className="min-h-[44px] max-h-[200px] border-none bg-transparent px-2 text-sm text-[#F5F7FA] placeholder:text-slate-500 focus-visible:ring-0"
        />

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          {/* Quick tool / context badges */}
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Tooltip content="Attach file (UI Mock)">
              <button
                type="button"
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Voice Input (UI Mock)">
              <button
                type="button"
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Mic className="h-4 w-4" />
              </button>
            </Tooltip>

            <div className="hidden sm:flex items-center gap-1.5 ml-2 border-l border-white/10 pl-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                <Globe className="h-3 w-3 text-emerald-400" /> Web Search
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                <Code2 className="h-3 w-3 text-teal-400" /> Generative UI
              </span>
            </div>
          </div>

          {/* Submit / Stop button */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all cursor-pointer"
                aria-label="Stop generating"
              >
                <Square className="h-3.5 w-3.5 fill-rose-300" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all cursor-pointer ${
                  input.trim()
                    ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-950/50"
                    : "bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </form>
      <p className="mt-2 text-center text-[11px] text-slate-500 font-sans">
        Nexora AI can generate text and dynamic React UI interfaces. Powered by Vercel AI SDK.
      </p>
    </div>
  )
}
