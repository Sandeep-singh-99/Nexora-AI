"use client"

import React, { useState } from "react"
import { Sparkles, ChevronDown, ChevronRight, Cpu, Search, Globe, ExternalLink } from "lucide-react"
import { SearchResultItem } from "@/types/chat"

interface AIThinkingProps {
  thinkingTime?: string
  thinkingText?: string
  searchQuery?: string
  isSearching?: boolean
  searchResults?: SearchResultItem[]
  steps?: string[]
  activeAgent?: string
  activeNode?: string
}

export function AIThinking({
  thinkingTime = "1.2s",
  thinkingText,
  searchQuery,
  isSearching,
  searchResults,
  activeAgent,
  activeNode,
  steps = [
    "Analyzing user prompt & intent",
    "Executing LangGraph multi-agent pipeline",
    "Formatting structured response & citations",
  ],
}: AIThinkingProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="my-2 max-w-xl rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0D131D]/80 p-3 shadow-md dark:shadow-lg backdrop-blur-md transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <Sparkles className="relative h-3 w-3 text-emerald-500 dark:text-emerald-400" />
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {activeAgent ? `${activeAgent} Working...` : "Thinking & Reasoning..."}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">({thinkingTime})</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-mono">
            {searchResults && searchResults.length > 0
              ? `${searchResults.length} sources grounded`
              : "View pipeline"}
          </span>
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </div>
      </button>

      {/* Active Search Indicator */}
      {isSearching && (
        <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg animate-pulse">
          <Search className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
          <span>Web Search Grounding: <strong>&quot;{searchQuery || "investigating sources..."}&quot;</strong></span>
        </div>
      )}

      {/* Tavily Web Search Results Drawer inside Thinking */}
      {searchResults && searchResults.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-white/5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-600 dark:text-teal-400 font-mono">
            <Globe className="h-3 w-3" />
            <span>Tavily Web Search Results ({searchResults.length} sources)</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {searchResults.map((res, idx) => (
              <a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/10 text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all group shrink-0"
              >
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                  {res.source || "web"}
                </span>
                <span className="max-w-[140px] truncate font-medium">{res.title}</span>
                <ExternalLink className="h-3 w-3 text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Reasoning & LLM Thought Stream */}
      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-white/5 space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {searchQuery && (
            <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-white/[0.02] p-2 rounded-lg border border-slate-200 dark:border-white/5">
              <Search className="h-3 w-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Target Query: <strong>{searchQuery}</strong></span>
            </div>
          )}

          {thinkingText ? (
            <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-wrap bg-slate-100 dark:bg-black/40 p-2.5 rounded-lg border border-slate-200 dark:border-white/5">
              {thinkingText}
            </div>
          ) : (
            steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <Cpu className="h-3 w-3 text-emerald-500 dark:text-emerald-400/70 shrink-0" />
                <span className="font-mono">{step}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
