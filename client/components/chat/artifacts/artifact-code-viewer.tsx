"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import Prism from "prismjs"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-python"
import "prismjs/components/prism-json"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-css"
import "prismjs/components/prism-markup" // HTML/XML/SVG
import "prismjs/components/prism-yaml"
import "prismjs/components/prism-markdown"
import {
  Copy,
  Check,
  Play,
  Square,
  Terminal,
  Download,
  Search,
  WrapText,
  FileCode,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Eye,
  Edit3,
  Cpu,
} from "lucide-react"
import { useCodeRunner } from "@/hooks/use-code-runner"
import { CodeExecutionSandbox } from "../code-execution-sandbox"
import { stripMarkdownCodeFences } from "@/lib/sandbox/sandbox-runner"
import { cn } from "@/lib/utils"

interface ArtifactCodeViewerProps {
  code: string
  language?: string
  title?: string
}

// Maps languages to VS Code style file icons, extensions and colors
function getLanguageMeta(lang: string) {
  const l = (lang || "").toLowerCase().trim()

  if (["py", "python"].includes(l)) {
    return { name: "Python", ext: "py", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", label: "Python 3.12" }
  }
  if (["ts", "typescript"].includes(l)) {
    return { name: "TypeScript", ext: "ts", color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/30", label: "TypeScript" }
  }
  if (["tsx"].includes(l)) {
    return { name: "React TSX", ext: "tsx", color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30", label: "TypeScript JSX" }
  }
  if (["js", "javascript"].includes(l)) {
    return { name: "JavaScript", ext: "js", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", label: "JavaScript" }
  }
  if (["jsx"].includes(l)) {
    return { name: "React JSX", ext: "jsx", color: "text-cyan-300", bg: "bg-cyan-300/10", border: "border-cyan-300/30", label: "JavaScript JSX" }
  }
  if (["html", "xml", "svg"].includes(l)) {
    return { name: "HTML", ext: "html", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", label: "HTML5" }
  }
  if (["css", "scss"].includes(l)) {
    return { name: "CSS", ext: "css", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30", label: "CSS3" }
  }
  if (["json"].includes(l)) {
    return { name: "JSON", ext: "json", color: "text-amber-300", bg: "bg-amber-300/10", border: "border-amber-300/30", label: "JSON" }
  }
  if (["sql"].includes(l)) {
    return { name: "SQL", ext: "sql", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", label: "PostgreSQL" }
  }
  if (["sh", "bash", "shell", "zsh"].includes(l)) {
    return { name: "Bash", ext: "sh", color: "text-lime-400", bg: "bg-lime-400/10", border: "border-lime-400/30", label: "Shell" }
  }
  if (["md", "markdown"].includes(l)) {
    return { name: "Markdown", ext: "md", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30", label: "Markdown" }
  }
  if (["yaml", "yml"].includes(l)) {
    return { name: "YAML", ext: "yaml", color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/30", label: "YAML" }
  }

  return { name: "Code", ext: "txt", color: "text-slate-300", bg: "bg-slate-300/10", border: "border-slate-300/30", label: "Plain Text" }
}

export function ArtifactCodeViewer({ code: rawCode, language = "plaintext", title }: ArtifactCodeViewerProps) {
  const initialClean = stripMarkdownCodeFences(rawCode)
  const [code, setCode] = useState<string>(initialClean)
  const [copied, setCopied] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [wrapLines, setWrapLines] = useState<boolean>(false)
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true)
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const [searchOpen, setSearchOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [activeCursorPos, setActiveCursorPos] = useState({ line: 1, col: 1 })

  const editorRef = useRef<HTMLTextAreaElement>(null)
  const codeContainerRef = useRef<HTMLDivElement>(null)

  // Keep internal code state updated when external prop changes
  useEffect(() => {
    setCode(stripMarkdownCodeFences(rawCode))
  }, [rawCode])

  const meta = getLanguageMeta(language)
  const filename = title ? `${title.replace(/\s+/g, "_").toLowerCase()}.${meta.ext}` : `main.${meta.ext}`

  const {
    status,
    statusMessage,
    runtimeMode,
    setRuntimeMode,
    logs,
    executionTimeMs,
    isRunning,
    isExecutable,
    isOpen: isConsoleOpen,
    setIsOpen: setIsConsoleOpen,
    run,
    stop,
    clearLogs,
  } = useCodeRunner({
    initialCode: code,
    language,
    defaultMode: "client",
  })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Map language aliases to Prism grammar
  const getPrismLang = (lang: string) => {
    const l = lang.toLowerCase()
    if (["ts", "typescript"].includes(l)) return "typescript"
    if (["tsx"].includes(l)) return "tsx"
    if (["js", "javascript"].includes(l)) return "javascript"
    if (["jsx"].includes(l)) return "jsx"
    if (["py", "python"].includes(l)) return "python"
    if (["html", "xml", "svg"].includes(l)) return "markup"
    if (["json"].includes(l)) return "json"
    if (["sh", "bash", "shell", "zsh"].includes(l)) return "bash"
    if (["sql"].includes(l)) return "sql"
    if (["css", "scss"].includes(l)) return "css"
    if (["yaml", "yml"].includes(l)) return "yaml"
    if (["md", "markdown"].includes(l)) return "markdown"
    return "plaintext"
  }

  const prismLang = getPrismLang(language)
  const lines = useMemo(() => code.split("\n"), [code])

  // Real-time Prism highlighting
  const highlightedHtml = useMemo(() => {
    try {
      const grammar = Prism.languages[prismLang] || Prism.languages.plaintext
      if (grammar) {
        return Prism.highlight(code, grammar, prismLang)
      }
    } catch (e) {
      console.error("Prism highlight error:", e)
    }
    return null
  }, [code, prismLang])

  // Handle Tab key in Edit mode for true IDE indentation
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter executes code in sandbox
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      if (isExecutable && !isRunning) {
        run(code)
      }
      return
    }

    // Ctrl+F opens search
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
      e.preventDefault()
      setSearchOpen(true)
      return
    }

    // Tab key inserts 2 spaces instead of losing focus
    if (e.key === "Tab") {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      const updated = code.substring(0, start) + "  " + code.substring(end)
      setCode(updated)

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }

  const updateCursorPosition = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const cursorIndex = textarea.selectionStart
    const textBefore = code.substring(0, cursorIndex)
    const linesBefore = textBefore.split("\n")
    const line = linesBefore.length
    const col = linesBefore[linesBefore.length - 1].length + 1
    setActiveCursorPos({ line, col })
    setActiveLine(line)
  }

  // Count search matches
  const searchMatchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0
    try {
      const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
      const matches = code.match(regex)
      return matches ? matches.length : 0
    } catch {
      return 0
    }
  }, [code, searchQuery])

  return (
    <div className="relative flex flex-col h-full w-full bg-[#080C14] text-slate-200 font-mono text-xs overflow-hidden select-text">
      {/* 1. TOP IDE TITLEBAR & FILE TABS */}
      <div className="flex items-center justify-between bg-[#04070D] border-b border-white/10 px-2 py-0 shrink-0 select-none">
        {/* Left: Active File Tab */}
        <div className="flex items-center">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#080C14] border-t-2 border-emerald-400 border-r border-white/10 text-xs text-slate-100 font-medium shadow-inner">
            <span className={cn("text-xs font-bold", meta.color)}>
              {meta.ext.toUpperCase()}
            </span>
            <span className="text-slate-200 truncate max-w-[180px]">{filename}</span>
            {isEditing && <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" title="Modified" />}
          </div>
        </div>

        {/* Right: IDE Action Toolbar */}
        <div className="flex items-center gap-1.5 py-1 pr-1">
          {/* In-File Search Toggle */}
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className={cn(
              "p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer",
              searchOpen ? "bg-white/10 text-cyan-400" : "text-slate-400 hover:text-white"
            )}
            title="Find in code (Ctrl+F)"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {/* Word Wrap Toggle */}
          <button
            type="button"
            onClick={() => setWrapLines(!wrapLines)}
            className={cn(
              "p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer",
              wrapLines ? "bg-white/10 text-emerald-400" : "text-slate-400 hover:text-white"
            )}
            title={wrapLines ? "Disable word wrap" : "Enable word wrap"}
          >
            <WrapText className="h-3.5 w-3.5" />
          </button>

          {/* Edit / View Toggle */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors cursor-pointer border",
              isEditing
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            )}
            title={isEditing ? "Switch to read-only view" : "Edit code directly"}
          >
            {isEditing ? <Eye className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
            <span className="hidden sm:inline">{isEditing ? "Viewing" : "Edit"}</span>
          </button>

          {/* Run Sandbox Button (if executable) */}
          {isExecutable && (
            <button
              type="button"
              onClick={() => {
                if (isRunning) {
                  stop()
                } else {
                  run(code)
                }
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer shadow-md",
                isRunning
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 hover:shadow-emerald-500/20"
              )}
              title={isRunning ? "Stop execution" : `Run ${meta.name} code`}
            >
              {isRunning ? (
                <>
                  <Square className="h-3 w-3 fill-current" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current text-emerald-400" />
                  <span>Run</span>
                </>
              )}
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Copy code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          {/* Download File */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title={`Download ${filename}`}
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. BREADCRUMBS BAR */}
      <div className="flex items-center justify-between px-3.5 py-1 bg-[#060910] border-b border-white/5 text-[11px] text-slate-400 select-none">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-slate-500">workspace</span>
          <ChevronRight className="h-3 w-3 text-slate-600" />
          <span className="text-slate-500">src</span>
          <ChevronRight className="h-3 w-3 text-slate-600" />
          <span className={cn("font-medium", meta.color)}>{filename}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-slate-500 font-mono">
            {lines.length} lines • {code.length} chars
          </span>
        </div>
      </div>

      {/* Floating In-File Search Bar (Ctrl+F) */}
      {searchOpen && (
        <div className="absolute top-16 right-4 z-20 flex items-center gap-2 bg-[#0F172A] border border-cyan-500/40 rounded-lg p-2 shadow-2xl backdrop-blur-md">
          <Search className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find in file..."
            autoFocus
            className="bg-transparent text-xs text-slate-100 placeholder:text-slate-500 outline-none w-44 font-mono"
          />
          {searchQuery && (
            <span className="text-[10px] text-slate-400 px-1 font-mono">
              {searchMatchCount} found
            </span>
          )}
          <button
            onClick={() => setSearchOpen(false)}
            className="p-0.5 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 3. MAIN EDITOR CANVAS AREA */}
      <div
        ref={codeContainerRef}
        className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-white/10 relative flex min-w-full"
      >
        {isEditing ? (
          /* Live Editable Code Area */
          <div className="flex w-full min-h-full">
            {/* Gutter */}
            {showLineNumbers && (
              <div className="select-none text-right pr-4 pl-3 py-3 text-slate-600 font-mono text-xs border-r border-white/5 bg-[#05080F] shrink-0 leading-6">
                {lines.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "transition-colors",
                      activeLine === i + 1 ? "text-cyan-400 font-bold" : ""
                    )}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            )}
            {/* Interactive Textarea with IDE Tab & Key Handling */}
            <div className="flex-1 p-3">
              <textarea
                ref={editorRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleEditorKeyDown}
                onSelect={updateCursorPosition}
                onClick={updateCursorPosition}
                onKeyUp={updateCursorPosition}
                spellCheck={false}
                className={cn(
                  "w-full h-full bg-transparent text-emerald-200 outline-none resize-none font-mono text-xs leading-6 selection:bg-emerald-500/30",
                  wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"
                )}
                placeholder="Type or paste code here..."
              />
            </div>
          </div>
        ) : (
          /* High-Fidelity Highlighted Code View with Active Line Glow */
          <div className="flex min-w-full font-mono leading-6">
            {/* Gutter with Breakpoint Dots */}
            {showLineNumbers && (
              <div className="select-none text-right pr-4 pl-3 py-3 text-slate-600 font-mono text-xs border-r border-white/5 bg-[#05080F] shrink-0">
                {lines.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveLine(i + 1)}
                    className={cn(
                      "group flex items-center justify-end gap-1.5 cursor-pointer leading-6 transition-colors",
                      activeLine === i + 1 ? "text-emerald-400 font-bold" : "hover:text-slate-400"
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 opacity-0 group-hover:opacity-60 transition-opacity" title="Toggle breakpoint" />
                    <span>{i + 1}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Syntax Highlighted Lines */}
            <div className="flex-1 py-3 pl-4 pr-6 overflow-x-auto">
              {highlightedHtml ? (
                <pre
                  className={cn(
                    "font-mono text-xs leading-6 text-slate-200",
                    wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre"
                  )}
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
              ) : (
                <pre
                  className={cn(
                    "font-mono text-xs leading-6 text-slate-200",
                    wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre"
                  )}
                >
                  {code}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. DOCKED SANDBOX TERMINAL CONSOLE */}
      {isExecutable && isConsoleOpen && (
        <div className="shrink-0 border-t border-white/10 max-h-72">
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
            onClose={() => setIsConsoleOpen(false)}
            compact={true}
          />
        </div>
      )}

      {/* 5. AUTHENTIC VS CODE BOTTOM STATUS BAR */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#007ACC]/90 text-white text-[11px] font-mono shrink-0 select-none shadow-md">
        {/* Left Status Bar Items */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
            <GitBranch className="h-3 w-3" />
            <span>main*</span>
          </div>

          <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors">
            <CheckCircle2 className="h-3 w-3" />
            <span>0</span>
            <AlertCircle className="h-3 w-3 ml-1" />
            <span>0</span>
          </div>

          {isExecutable && (
            <button
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className="flex items-center gap-1 hover:bg-white/15 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
              title="Toggle Terminal Console"
            >
              <Terminal className="h-3 w-3" />
              <span>{isConsoleOpen ? "Terminal: Open" : "Terminal: Closed"}</span>
            </button>
          )}
        </div>

        {/* Right Status Bar Items */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">
            Ln {activeCursorPos.line}, Col {activeCursorPos.col}
          </span>
          <span className="hidden md:inline">Spaces: 2</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="hidden lg:inline">LF</span>
          <span className="font-semibold px-1 rounded bg-black/20">
            {meta.label}
          </span>
        </div>
      </div>
    </div>
  )
}
