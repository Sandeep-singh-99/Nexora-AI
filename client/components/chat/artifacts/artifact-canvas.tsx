"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useArtifact } from "@/components/providers/artifact-provider"
import { getArtifactFileName, getArtifactDisplayType } from "@/lib/artifacts"
import { isExecutableLanguage } from "@/lib/sandbox/sandbox-runner"
import { ArtifactCodeViewer } from "./artifact-code-viewer"
import { ArtifactHtmlPreview } from "./artifact-html-preview"
import { ArtifactMermaidPreview } from "./artifact-mermaid-preview"
import { ArtifactMarkdownPreview } from "./artifact-markdown-preview"
import { ArtifactSvgPreview } from "./artifact-svg-preview"
import { ArtifactSandboxPreview } from "./artifact-sandbox-preview"
import {
  X,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  ChevronLeft,
  ChevronRight,
  Code2,
  Eye,
  FileCode,
  Globe,
  FileText,
  Palette,
  Network,
  Terminal,
  Columns2,
} from "lucide-react"

export function ArtifactCanvas() {
  const {
    isOpen,
    isMaximized,
    activeArtifact,
    artifacts,
    currentIndex,
    selectNextArtifact,
    selectPrevArtifact,
    toggleMaximize,
    closeCanvas,
    updateArtifactContent,
  } = useArtifact()

  const [activeTab, setActiveTab] = useState<"preview" | "code" | "split">("preview")
  const [copied, setCopied] = useState<boolean>(false)

  // Determine if the artifact can run in interactive sandbox or has visual preview
  const isRunnable = Boolean(
    activeArtifact && isExecutableLanguage(activeArtifact.language || activeArtifact.type)
  )
  const hasPreview = Boolean(
    activeArtifact &&
      (["html", "mermaid", "markdown", "svg"].includes(activeArtifact.type) || isRunnable)
  )
  const canSplit = Boolean(activeArtifact && activeArtifact.type === "html")

  const effectiveTab = hasPreview ? activeTab : "code"

  if (!isOpen || !activeArtifact) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeArtifact.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleDownload = () => {
    const filename = getArtifactFileName(activeArtifact)
    const blob = new Blob([activeArtifact.content], {
      type:
        activeArtifact.type === "html"
          ? "text/html"
          : activeArtifact.type === "svg"
          ? "image/svg+xml"
          : activeArtifact.type === "markdown"
          ? "text/markdown"
          : "text/plain",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTypeIcon = () => {
    switch (activeArtifact.type) {
      case "html":
        return <Globe className="h-4 w-4 text-emerald-400" />
      case "mermaid":
        return <Network className="h-4 w-4 text-cyan-400" />
      case "markdown":
        return <FileText className="h-4 w-4 text-indigo-400" />
      case "svg":
        return <Palette className="h-4 w-4 text-fuchsia-400" />
      case "code":
      default:
        return <Code2 className="h-4 w-4 text-emerald-400" />
    }
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex flex-col h-full bg-[#080D16] text-slate-100 border-l border-slate-200 dark:border-white/10 shadow-2xl relative z-20 ${
        isMaximized ? "fixed inset-0 z-50 w-screen" : "w-full"
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-white/10 shrink-0 backdrop-blur-md">
        {/* Left: Icon, Title & Type Badge */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="h-7 w-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            {getTypeIcon()}
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <h2 className="font-semibold text-xs md:text-sm text-slate-100 truncate">
              {activeArtifact.title || "Artifact Canvas"}
            </h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              {getArtifactDisplayType(activeArtifact)}
            </span>
          </div>

          {/* Artifact Navigator if multiple artifacts exist */}
          {artifacts.length > 1 && (
            <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-white/10 text-[11px] text-slate-400 font-mono shrink-0">
              <button
                onClick={selectPrevArtifact}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Previous Artifact"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span>
                {currentIndex + 1} / {artifacts.length}
              </span>
              <button
                onClick={selectNextArtifact}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Next Artifact"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Center: Preview vs Code Tabs Switcher */}
        {hasPreview && (
          <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 text-xs shrink-0 mx-2">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                effectiveTab === "preview"
                  ? "bg-emerald-500/20 text-emerald-400 font-medium shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isRunnable ? (
                <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              <span>
                {activeArtifact.type === "mermaid"
                  ? "Diagram"
                  : activeArtifact.type === "svg"
                  ? "Visual"
                  : isRunnable
                  ? "Run Sandbox"
                  : "Preview"}
              </span>
            </button>

            {canSplit && (
              <button
                onClick={() => setActiveTab("split")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                  effectiveTab === "split"
                    ? "bg-emerald-500/20 text-emerald-400 font-medium shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Side-by-side code editor and live preview"
              >
                <Columns2 className="h-3.5 w-3.5" />
                <span>Split</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                effectiveTab === "code"
                  ? "bg-emerald-500/20 text-emerald-400 font-medium shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Code</span>
            </button>
          </div>
        )}

        {/* Right: Actions (Copy, Download, Maximize, Close) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Copy artifact contents"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-emerald-400 text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden sm:inline text-[11px]">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={toggleMaximize}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title={isMaximized ? "Restore split pane" : "Expand to fullscreen"}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={closeCanvas}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer ml-1"
            title="Close Canvas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden relative">
        {effectiveTab === "split" && canSplit ? (
          <div className="flex h-full w-full overflow-hidden">
            <div className="w-1/2 h-full border-r border-white/10 overflow-hidden">
              <ArtifactCodeViewer
                code={activeArtifact.content}
                language={activeArtifact.language || activeArtifact.type}
                title={activeArtifact.title || activeArtifact.identifier}
                onChange={(newContent) => {
                  updateArtifactContent(activeArtifact.id, newContent)
                }}
              />
            </div>
            <div className="w-1/2 h-full overflow-hidden">
              <ArtifactHtmlPreview html={activeArtifact.content} />
            </div>
          </div>
        ) : effectiveTab === "preview" ? (
          <>
            {isRunnable && (
              <ArtifactSandboxPreview artifact={activeArtifact} />
            )}
            {!isRunnable && activeArtifact.type === "html" && (
              <ArtifactHtmlPreview html={activeArtifact.content} />
            )}
            {!isRunnable && activeArtifact.type === "mermaid" && (
              <ArtifactMermaidPreview chart={activeArtifact.content} />
            )}
            {!isRunnable && activeArtifact.type === "markdown" && (
              <ArtifactMarkdownPreview content={activeArtifact.content} />
            )}
            {!isRunnable && activeArtifact.type === "svg" && (
              <ArtifactSvgPreview svgContent={activeArtifact.content} />
            )}
          </>
        ) : (
          <ArtifactCodeViewer
            code={activeArtifact.content}
            language={activeArtifact.language || activeArtifact.type}
            title={activeArtifact.title || activeArtifact.identifier}
            onChange={(newContent) => {
              updateArtifactContent(activeArtifact.id, newContent)
            }}
          />
        )}
      </div>
    </motion.aside>
  )
}
