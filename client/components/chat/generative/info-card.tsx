"use client"

import React from "react"
import { Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface InfoCardProps {
  title?: string
  subtitle?: string
  items?: Array<{ label: string; value: string }>
}

export function InfoCard({
  title = "System Configuration",
  subtitle = "Nexora AI Runtime Metadata",
  items = [
    { label: "Framework", value: "Next.js 16 + React 19" },
    { label: "Orchestrator", value: "FastAPI + LangGraph" },
    { label: "Model Provider", value: "Groq" },
    { label: "Embeddings", value: "Google Gemini (768-dim)" },
    { label: "Streaming", value: "FastAPI SSE + Vercel AI SDK" },
  ],
}: InfoCardProps) {
  return (
    <div className="w-full max-w-md bg-[#0D131D]/90 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl p-4 my-3">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Info className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>
        </div>
        <Badge variant="default" className="text-[10px]">Active</Badge>
      </div>

      <div className="mt-3 space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/5">
            <span className="text-xs text-slate-400">{item.label}</span>
            <span className="text-xs font-medium text-emerald-300 font-mono">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
