"use client"

import React, { useState, useEffect } from "react"
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
import { Copy, Check, Hash } from "lucide-react"

interface ArtifactCodeViewerProps {
  code: string
  language?: string
}

export function ArtifactCodeViewer({ code, language = "plaintext" }: ArtifactCodeViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  // Map language aliases to Prism supported languages
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
  const lines = code.split("\n")

  const highlightedHtml = React.useMemo(() => {
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

  return (
    <div className="relative flex flex-col h-full w-full bg-[#070A0F] text-slate-200 font-mono text-xs overflow-hidden select-text">
      {/* Top Floating Copy Bar */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-2">
        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 bg-black/40 px-2 py-1 rounded backdrop-blur-md border border-white/5">
          <Hash className="h-3 w-3" />
          {lines.length} lines
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10 transition-colors cursor-pointer shadow-md"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area with Line Numbers */}
      <div className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
        <div className="flex min-w-full font-mono leading-relaxed">
          {/* Line Numbers Column */}
          <div className="select-none text-right pr-4 text-slate-600 dark:text-slate-600 font-mono text-xs border-r border-white/10 shrink-0">
            {lines.map((_, i) => (
              <div key={i} className="leading-6">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Highlighted Code Column */}
          <div className="pl-4 flex-1 overflow-x-auto">
            {highlightedHtml ? (
              <pre
                className="font-mono text-xs leading-6 text-slate-200"
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            ) : (
              <pre className="font-mono text-xs leading-6 text-slate-200">
                {code}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
