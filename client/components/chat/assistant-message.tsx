"use client"

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { ChatMessage } from "@/types/chat"
import { GenerativeUIRenderer } from "./generative-ui"
import { AIThinking } from "./ai-thinking"
import { MessageActions } from "./message-actions"
import { Sparkles, Copy, Check, Terminal } from "lucide-react"

interface AssistantMessageProps {
  message: ChatMessage
  onRegenerate?: () => void
}

function preprocessLaTeX(content: string): string {
  if (!content) return ""

  return content
    // Convert display math delimiters \[ ... \] -> $$ ... $$
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `\n$$\n${eq.trim()}\n$$\n`)
    // Convert inline math delimiters \( ... \) -> $ ... $
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => `$${eq.trim()}$`)
    // Convert bracketed single lines [ equation ] into $$ equation $$ if math characters present
    .replace(/(^|\n)\[\s*([^\[\]\n\(\)]*?(?:\\boxed|\\Rightarrow|\\pm|=|\\quad|\^|_|\+|-|\*|\/|\\cdot)[^\[\]\n]*?)\s*\](?=\n|$)/g,
      (_, p1, eq) => `${p1}\n$$\n${eq.trim()}\n$$\n`
    )
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="my-3 rounded-xl border border-white/10 bg-[#070A0F] overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.03] border-b border-white/10 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5 text-emerald-400" />
          <span>{language || "code"}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] hover:text-white transition-colors cursor-pointer px-2 py-0.5 rounded bg-white/5 border border-white/10"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy code
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto font-mono text-xs text-emerald-200 leading-relaxed">
        <pre>{value}</pre>
      </div>
    </div>
  )
}

export function AssistantMessage({ message, onRegenerate }: AssistantMessageProps) {
  const showThinking = Boolean(
    message.thinkingTime || message.thinkingText || message.isSearching || (message.searchResults && message.searchResults.length > 0)
  )

  return (
    <div className="flex w-full gap-3 my-5 group">
      {/* Nexora AI Icon Avatar */}
      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-lg shrink-0 flex items-center justify-center">
        <div className="h-full w-full rounded-[10px] bg-[#05070B] flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-emerald-400" />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden max-w-full">
        {/* Agent Status Badge */}
        {message.statusLabel && (
          <div className="mb-1 text-xs text-emerald-400/80 font-mono flex items-center gap-1.5 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span>{message.statusLabel}</span>
          </div>
        )}

        {/* Optional Thinking state & Search status */}
        {showThinking && (
          <AIThinking
            thinkingTime={message.thinkingTime}
            thinkingText={message.thinkingText}
            searchQuery={message.searchQuery}
            isSearching={message.isSearching}
            searchResults={message.searchResults}
          />
        )}

        {/* Message Content */}
        {message.content && (
          <div className="prose prose-invert max-w-none text-sm text-slate-200 leading-relaxed font-sans">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({ node, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "")
                  const codeString = String(children).replace(/\n$/, "")
                  const isInline = !match && !codeString.includes("\n")

                  if (!isInline) {
                    return <CodeBlock language={match ? match[1] : "plaintext"} value={codeString} />
                  }
                  return (
                    <code className="bg-white/10 text-emerald-300 font-mono text-xs px-1.5 py-0.5 rounded border border-white/10" {...props}>
                      {children}
                    </code>
                  )
                },
                h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold text-white mt-3 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold text-slate-100 mt-3 mb-1">{children}</h3>,
                p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-slate-200">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-emerald-500/50 pl-3 my-2 text-slate-400 italic bg-white/[0.02] py-1 rounded-r">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline underline-offset-4 hover:text-emerald-300">
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3 rounded-xl border border-white/10">
                    <table className="w-full text-xs text-slate-200">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-white/[0.05] border-b border-white/10">{children}</thead>,
                th: ({ children }) => <th className="p-2.5 text-left font-semibold text-slate-300">{children}</th>,
                td: ({ children }) => <td className="p-2.5 border-t border-white/5">{children}</td>,
              }}
            >
              {preprocessLaTeX(message.content)}
            </ReactMarkdown>
          </div>
        )}

        {/* Generative UI Slot */}
        {message.ui && <GenerativeUIRenderer ui={message.ui} />}

        {/* Action bar */}
        {message.content && <MessageActions content={message.content} onRegenerate={onRegenerate} />}
      </div>
    </div>
  )
}
