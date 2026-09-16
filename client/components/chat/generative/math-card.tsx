"use client"

import React, { useState } from "react"
import { Calculator, Check, Copy, ChevronDown, ChevronUp, Cpu, CheckCircle2 } from "lucide-react"

export interface MathCardProps {
  operation?: string
  expression?: string
  result?: any
  latex?: string
  steps?: string[]
}

export function MathCard({
  operation = "Symbolic Computation",
  expression = "",
  result,
  latex,
  steps = [],
}: MathCardProps) {
  const [copied, setCopied] = useState(false)
  const [showSteps, setShowSteps] = useState(true)

  const formattedResult =
    typeof result === "object" ? JSON.stringify(result, null, 2) : String(result ?? "")

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedResult)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#0B121B] shadow-xl shadow-emerald-950/20 backdrop-blur-md transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <Calculator className="h-4 w-4" />
          </div>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-300">
            {operation.toUpperCase()} • Math Tool
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-all"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-mono">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy result</span>
            </>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-3">
        {/* Input expression */}
        {expression && (
          <div className="rounded-xl border border-white/5 bg-black/40 p-3">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Input Expression
            </div>
            <div className="font-mono text-sm text-slate-200">{expression}</div>
          </div>
        )}

        {/* Calculated Result */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
          <div className="text-[11px] font-mono text-emerald-400/80 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Computed Solution</span>
          </div>

          <div className="font-mono text-base font-semibold text-emerald-200 leading-relaxed whitespace-pre-wrap">
            {formattedResult}
          </div>

          {latex && (
            <div className="mt-2 text-xs font-mono text-teal-300/80 bg-black/30 p-2 rounded-lg border border-white/5">
              LaTeX: <code className="text-teal-200">{latex}</code>
            </div>
          )}
        </div>

        {/* Step-by-step Derivation Drawer */}
        {steps && steps.length > 0 && (
          <div className="pt-1">
            <button
              onClick={() => setShowSteps(!showSteps)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300 transition-colors font-mono cursor-pointer"
            >
              <Cpu className="h-3.5 w-3.5 text-emerald-400" />
              <span>Step-by-step breakdown ({steps.length} steps)</span>
              {showSteps ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showSteps && (
              <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-emerald-500/30 font-mono text-xs text-slate-300">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 py-0.5">
                    <span className="text-emerald-400 font-bold">{idx + 1}.</span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
