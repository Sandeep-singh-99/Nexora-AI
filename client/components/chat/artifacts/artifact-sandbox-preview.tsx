"use client"

import React, { useState, useEffect, useRef } from "react"
import { useCodeRunner } from "@/hooks/use-code-runner"
import { stripMarkdownCodeFences } from "@/lib/sandbox/sandbox-runner"
import { CodeExecutionSandbox } from "../code-execution-sandbox"
import { Play, Square, RotateCw, Edit3, Eye, Copy, Check, Terminal, Cpu, Sparkles } from "lucide-react"
import { Artifact } from "@/types/artifact"
import { cn } from "@/lib/utils"

interface ArtifactSandboxPreviewProps {
  artifact: Artifact
}

export function ArtifactSandboxPreview({ artifact }: ArtifactSandboxPreviewProps) {
  const [code, setCode] = useState<string>(stripMarkdownCodeFences(artifact.content))
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const language = artifact.language || "python"

  const {
    status,
    statusMessage,
    runtimeMode,
    setRuntimeMode,
    logs,
    executionTimeMs,
    isRunning,
    run,
    stop,
    clearLogs,
  } = useCodeRunner({
    initialCode: code,
    language,
    defaultMode: "client",
  })

  // Synchronize when active artifact changes
  useEffect(() => {
    setCode(stripMarkdownCodeFences(artifact.content))
    clearLogs()
  }, [artifact.id, artifact.content, clearLogs])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to run code
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      if (!isRunning) {
        run(code)
      }
    }
  }

  const isPython = language.toLowerCase().includes("py")

  return (
    <div
      onKeyDown={handleKeyDown}
      className="flex flex-col h-full w-full bg-[#070A0F] text-slate-200 overflow-hidden"
    >
      {/* Top Sandbox Action Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-white/10 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
            <Terminal className="h-3.5 w-3.5" />
            <span>Interactive Sandbox</span>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300 font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300 font-mono">Enter</kbd> to run
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Edit / Read-only Toggle */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer text-xs",
              isEditing
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            )}
            title={isEditing ? "Switch to formatted view" : "Edit code in sandbox"}
          >
            {isEditing ? <Eye className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
            <span>{isEditing ? "Viewing" : "Edit Code"}</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Run / Stop Button */}
          {isRunning ? (
            <button
              type="button"
              onClick={stop}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg transition-colors cursor-pointer font-semibold"
              title="Stop execution"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => run(code)}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg transition-all cursor-pointer font-semibold shadow-md hover:shadow-emerald-500/20"
              title="Execute in sandbox"
            >
              <Play className="h-3.5 w-3.5 fill-current text-emerald-400" />
              <span>Run Code</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Body: Code Editor / Viewer (Top) & Terminal Console (Bottom) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Code View / Edit Area */}
        <div className="h-1/2 min-h-[140px] flex flex-col border-b border-white/10 relative overflow-hidden bg-[#05080E]">
          <div className="px-3 py-1 bg-black/40 border-b border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-slate-300">
              <span>Source ({language})</span>
              {isEditing && <span className="text-cyan-400 text-[10px]">(Editable)</span>}
            </span>
            <span>{code.split("\n").length} lines</span>
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-xs">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full h-full bg-transparent text-emerald-200 outline-none resize-none font-mono text-xs leading-relaxed selection:bg-emerald-500/30"
                placeholder="Enter code to execute..."
              />
            ) : (
              <pre className="text-emerald-200 leading-relaxed overflow-x-auto whitespace-pre">
                {code}
              </pre>
            )}
          </div>
        </div>

        {/* Live Interactive Terminal Sandbox */}
        <div className="h-1/2 min-h-[140px] flex flex-col overflow-hidden">
          <CodeExecutionSandbox
            code={code}
            language={language}
            status={status}
            statusMessage={statusMessage}
            logs={logs}
            executionTimeMs={executionTimeMs}
            runtimeMode={runtimeMode}
            isRunning={isRunning}
            onRun={() => run(code)}
            onStop={stop}
            onClear={clearLogs}
            onToggleMode={setRuntimeMode}
            compact={false}
          />
        </div>
      </div>
    </div>
  )
}
