"use client"

import React from "react"
import { Sparkles, BarChart3, Code2, Calculator, Rocket } from "lucide-react"
import { useAppearance } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  onSelectSuggestion: (text: string) => void
}

const SUGGESTIONS = [
  {
    icon: Calculator,
    title: "Solve math & algebra",
    prompt: "Factor x^2 + 5x + 6 and calculate derivative of sin(x)*x^2",
    description: "Symbolic algebra, calculus, matrices & statistics",
  },
  {
    icon: Code2,
    title: "Write code",
    prompt: "Write a FastAPI endpoint with Pydantic validation.",
    description: "Build clean, production-ready backend code",
  },
  {
    icon: BarChart3,
    title: "Analyze data",
    prompt: "Show me my monthly revenue.",
    description: "Generate metrics, charts, & dynamic financial insights",
  },
  {
    icon: Rocket,
    title: "Build something",
    prompt: "Show me my project overview.",
    description: "Inspect project status, milestones & stack",
  },
]

export function EmptyState({ onSelectSuggestion }: EmptyStateProps) {
  const { accentConfig } = useAppearance()

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto animate-in fade-in-0 zoom-in-95 duration-300">
      {/* Icon */}
      <div className={cn("mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br p-0.5 shadow-xl", accentConfig.gradient)}>
        <div className="h-full w-full rounded-[14px] bg-white dark:bg-[#05070B] flex items-center justify-center">
          <Sparkles className={cn("h-6 w-6", accentConfig.activeText)} />
        </div>
      </div>

      {/* Header text */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
        How can I help you today?
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
        Ask questions, write code, analyze information, or generate interactive UI components.
      </p>

      {/* Suggestion cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon
          return (
            <button
              key={idx}
              onClick={() => onSelectSuggestion(item.prompt)}
              className="flex flex-col items-start p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0D131D]/80 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-all group text-left cursor-pointer shadow-sm dark:shadow-lg backdrop-blur-md"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn("p-1.5 rounded-lg transition-colors", accentConfig.badgeBg, accentConfig.activeText)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                  {item.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono line-clamp-1">{item.prompt}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
