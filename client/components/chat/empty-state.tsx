"use client"

import React from "react"
import { Sparkles, BarChart3, Code2, Calculator, Rocket } from "lucide-react"

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
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto animate-in fade-in-0 zoom-in-95 duration-300">
      {/* Icon */}
      <div className="mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-xl shadow-emerald-950/40">
        <div className="h-full w-full rounded-[14px] bg-[#05070B] flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-emerald-400" />
        </div>
      </div>

      {/* Header text */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
        How can I help you today?
      </h1>
      <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
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
              className="flex flex-col items-start p-4 rounded-2xl border border-white/10 bg-[#0D131D]/80 hover:bg-white/[0.06] hover:border-emerald-500/40 transition-all group text-left cursor-pointer shadow-lg backdrop-blur-md"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono line-clamp-1">{item.prompt}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
