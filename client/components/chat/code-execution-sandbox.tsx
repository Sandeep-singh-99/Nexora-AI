"use client"

import React, { useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Play,
  Square,
  RotateCw,
  Trash2,
  Terminal,
  Cpu,
  Clock,
  AlertCircle,
  CheckCircle2,
  Server,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  ExecutionLogEntry,
  ExecutionRuntimeMode,
  ExecutionStatus,
} from "@/types/sandbox"
import { cn } from "@/lib/utils"

interface CodeExecutionSandboxProps {
  code: string
  language: string
  status: ExecutionStatus
  statusMessage?: string
  logs: ExecutionLogEntry[]
  executionTimeMs: number
  runtimeMode: ExecutionRuntimeMode
  isRunning: boolean
  onRun: () => void
  onStop: () => void
  onClear: () => void
  onToggleMode: (mode: ExecutionRuntimeMode) => void
  onClose?: () => void
  compact?: boolean
}

export function CodeExecutionSandbox({
  code,
  language,
  status,
  statusMessage,
  logs,
  executionTimeMs,
  runtimeMode,
  isRunning,
  onRun,
  onStop,
  onClear,
  onToggleMode,
  onClose,
  compact = false,
}: CodeExecutionSandboxProps) {
  const terminalRef = useRef<HTMLDivElement>(null)

  // Auto-scroll terminal to bottom when new logs arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs, isRunning, statusMessage])

  const isPython = language.toLowerCase().includes("py")

  const getRuntimeLabel = () => {
    if (runtimeMode === "server") {
      return isPython ? "Python (Isolated Server)" : "Node.js (Server Sandbox)"
    }
    return isPython ? "Pyodide v0.27 (WebAssembly)" : "V8 Worker Sandbox"
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-[#04070D] overflow-hidden shadow-2xl flex flex-col font-mono text-xs",
        compact ? "mt-2 border-t border-emerald-500/20" : "h-full w-full"
      )}
    >
      {/* Top Console Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/90 border-b border-white/10 select-none">
        {/* Left: Terminal indicator & status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-colors",
                isRunning
                  ? "bg-amber-400 animate-pulse"
                  : status === "success"
                  ? "bg-emerald-400"
                  : status === "error"
                  ? "bg-rose-400"
                  : "bg-slate-600"
              )}
            />
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span>Console</span>
          </div>

          {/* Runtime Badge */}
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
            <Cpu className="h-2.5 w-2.5" />
            {getRuntimeLabel()}
          </span>

          {/* Execution Time */}
          {executionTimeMs > 0 && !isRunning && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              <Clock className="h-2.5 w-2.5 text-cyan-400" />
              {executionTimeMs}ms
            </span>
          )}
        </div>

        {/* Right: Runtime mode switch & action buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Runtime Mode Selector */}
          <div className="flex items-center bg-black/50 rounded-lg p-0.5 border border-white/10 text-[10px]">
            <button
              type="button"
              onClick={() => onToggleMode("client")}
              className={cn(
                "px-2 py-0.5 rounded transition-all cursor-pointer",
                runtimeMode === "client"
                  ? "bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              )}
              title="Execute in browser using WebAssembly / Web Worker"
            >
              Client (Wasm)
            </button>
            <button
              type="button"
              onClick={() => onToggleMode("server")}
              className={cn(
                "px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1",
                runtimeMode === "server"
                  ? "bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200"
              )}
              title="Execute on isolated backend server"
            >
              <Server className="h-2.5 w-2.5" />
              Server
            </button>
          </div>

          {/* Run / Stop Button */}
          {isRunning ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
              title="Stop execution"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onRun}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer shadow-sm hover:shadow-emerald-500/10 font-semibold"
              title="Run code"
            >
              <Play className="h-3 w-3 fill-current text-emerald-400" />
              <span>Run</span>
            </button>
          )}

          {/* Clear Button */}
          {logs.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              disabled={isRunning}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer disabled:opacity-40"
              title="Clear console output"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Close / Minimize */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
              title="Collapse console"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        ref={terminalRef}
        className={cn(
          "p-3.5 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 select-text leading-relaxed font-mono",
          compact ? "max-h-60 min-h-[90px]" : "flex-1"
        )}
      >
        {logs.length === 0 && !isRunning && (
          <div className="text-slate-500 text-xs italic py-2 flex items-center gap-2">
            <span className="text-emerald-500/60">&gt;</span>
            <span>Click &apos;Run&apos; to execute this {isPython ? "Python" : "JavaScript"} snippet in the sandbox.</span>
          </div>
        )}

        {/* Streamed Log Entries */}
        {logs.map((log) => {
          if (log.type === "system") {
            return (
              <div
                key={log.id}
                className="text-indigo-400/90 text-[11px] italic flex items-center gap-1.5 py-0.5"
              >
                <span className="text-indigo-500 font-bold">&gt;&gt;</span>
                <span>{log.content}</span>
              </div>
            )
          }

          if (log.type === "stderr") {
            return (
              <div
                key={log.id}
                className="text-rose-400 bg-rose-500/5 px-2 py-1 rounded border-l-2 border-rose-500 whitespace-pre-wrap break-words"
              >
                {log.content}
              </div>
            )
          }

          if (log.type === "result") {
            return (
              <div
                key={log.id}
                className="text-cyan-300 bg-cyan-500/5 px-2 py-1 rounded border-l-2 border-cyan-400 flex items-start gap-1.5 whitespace-pre-wrap break-words"
              >
                <span className="text-cyan-400 font-bold shrink-0">&lt;=</span>
                <span className="font-semibold">{log.content}</span>
              </div>
            )
          }

          // stdout
          return (
            <div
              key={log.id}
              className="text-slate-200 whitespace-pre-wrap break-words"
            >
              {log.content}
            </div>
          )
        })}

        {/* Running status indicator */}
        {isRunning && (
          <div className="flex items-center gap-2 text-amber-300/90 text-xs py-1 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>{statusMessage || "Executing in sandbox..."}</span>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="px-3 py-1 bg-black/60 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 select-none">
        <div className="flex items-center gap-1.5 truncate">
          {status === "success" && (
            <>
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 truncate">
                Success {executionTimeMs > 0 && `(${executionTimeMs}ms)`}
              </span>
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle className="h-3 w-3 text-rose-400 shrink-0" />
              <span className="text-rose-400 truncate">{statusMessage || "Execution failed"}</span>
            </>
          )}
          {status === "idle" && (
            <span>Ready. Shortcut: Run code directly in-browser without server dependencies.</span>
          )}
          {isRunning && (
            <span className="text-amber-300 truncate">{statusMessage || "Running..."}</span>
          )}
        </div>
        <div className="shrink-0 pl-2">
          <span>Sandbox isolation active</span>
        </div>
      </div>
    </div>
  )
}
