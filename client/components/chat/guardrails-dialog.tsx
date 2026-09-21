"use client"

import React from "react"
import {
  ShieldAlert,
  CreditCard,
  Key,
  Lock,
  FileBadge,
  Shield,
  AlertTriangle,
  X,
  Check,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SensitiveDataFinding } from "@/lib/api/documents"

interface GuardrailsDialogProps {
  isOpen: boolean
  filename: string
  findings: SensitiveDataFinding[]
  onProceed: () => void
  onCancel: () => void
  isProcessing?: boolean
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "Credit Card":
      return <CreditCard className="h-4 w-4 text-amber-400" />
    case "Social Security Number (SSN)":
      return <FileBadge className="h-4 w-4 text-rose-400" />
    case "API Key / Secret Token":
      return <Key className="h-4 w-4 text-amber-400" />
    case "Private Key":
      return <Lock className="h-4 w-4 text-rose-400" />
    case "Password / Credential":
      return <Shield className="h-4 w-4 text-amber-400" />
    default:
      return <AlertTriangle className="h-4 w-4 text-amber-400" />
  }
}

export function GuardrailsDialog({
  isOpen,
  filename,
  findings,
  onProceed,
  onCancel,
  isProcessing = false,
}: GuardrailsDialogProps) {
  if (!isOpen) return null

  const totalOccurrences = findings.reduce((acc, f) => acc + f.count, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/30 bg-[#0E131F]/98 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow Header Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/10">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Sensitive Data Detected
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {totalOccurrences} {totalOccurrences === 1 ? "match" : "matches"}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Nexora Safety Guardrails identified sensitive data in{" "}
                <span className="text-slate-200 font-medium font-mono">{filename}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Findings List */}
        <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
          <p className="text-xs text-slate-300 leading-relaxed">
            The following confidential or restricted credentials were found during in-memory document scanning:
          </p>

          <div className="space-y-2.5">
            {findings.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-1.5 p-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-200">
                    {getCategoryIcon(item.category)}
                    <span>{item.category}</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {item.count} {item.count === 1 ? "occurrence" : "occurrences"}
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 pt-1 border-t border-white/5">
                  <span className="truncate max-w-[280px]">Sample: <code className="text-slate-200 bg-black/40 px-1 py-0.5 rounded">{item.sample}</code></span>
                  {item.pages && item.pages.length > 0 && (
                    <span className="text-[10px] text-slate-500 shrink-0">
                      Pages: {item.pages.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Choice Notice */}
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] text-[11px] text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300 block mb-0.5">Decision Required:</strong>
            If you cancel, the task ends immediately and <strong>no chunks or embeddings will be stored</strong>.
            If you proceed, you explicitly authorize indexing this document into your isolated knowledge base.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="border-white/15 text-slate-300 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/30 text-xs h-9 cursor-pointer"
          >
            <X className="h-3.5 w-3.5 mr-1 text-rose-400" />
            No, Cancel Task
          </Button>

          <Button
            type="button"
            onClick={onProceed}
            disabled={isProcessing}
            className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold text-xs h-9 shadow-md shadow-emerald-950/50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Indexing...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Yes, Proceed
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
