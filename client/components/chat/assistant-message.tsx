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
import { Sparkles, Copy, Check, Terminal, Globe, ExternalLink, Pin, FileText, Play, Tv } from "lucide-react"
import { SearchResultItem } from "@/types/chat"


interface AssistantMessageProps {
  message: ChatMessage
  onRegenerate?: () => void
  isPinned?: boolean
  onTogglePin?: () => void
}

function SourceCitations({ results }: { results: SearchResultItem[] }) {
  if (!results || results.length === 0) return null

  // Deduplicate sources by URL
  const uniqueResults = results.filter(
    (item, index, self) => index === self.findIndex((t) => t.url === item.url)
  )

  return (
    <div className="my-3 p-3 rounded-2xl bg-[#0D131D]/90 border border-white/10 shadow-lg">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 mb-2.5 font-mono">
        <Globe className="h-3.5 w-3.5 text-teal-400" />
        <span>Grounded Web Sources ({uniqueResults.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {uniqueResults.map((res, idx) => {
          let domain = res.source || "web"
          if (res.url) {
            try {
              domain = new URL(res.url).hostname.replace("www.", "")
            } catch {
              domain = res.source || "web"
            }
          }
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`

          return (
            <a
              key={idx}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${res.title}\n${res.url}`}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/10 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all group shrink-0 max-w-[240px]"
            >
              <img
                src={faviconUrl}
                alt=""
                className="h-3.5 w-3.5 rounded-full shrink-0 bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none"
                }}
              />
              <span className="truncate font-medium text-[11px]">{res.title || domain}</span>
              <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-emerald-400 shrink-0 ml-auto" />
            </a>
          )
        })}
      </div>
    </div>
  )
}

function DocumentCitations({ content }: { content: string }) {
  if (!content) return null

  // Match citations like [Document: report.pdf, Page 3] or [Source 1: spec.docx, Page 2] or [contract.pdf, Page 1]
  const regex = /\[(?:(?:Source \d+|Document):\s*)?([^,\]\n]+?\.(?:pdf|docx))(?:,\s*Page\s*(\d+|N\/A))?\]/gi
  const matches = Array.from(content.matchAll(regex))

  if (matches.length === 0) return null

  const seen = new Set<string>()
  const citations: Array<{ filename: string; page?: string }> = []

  for (const m of matches) {
    const filename = m[1].trim()
    const page = m[2]
    const key = `${filename}-${page || ""}`
    if (!seen.has(key)) {
      seen.add(key)
      citations.push({ filename, page })
    }
  }

  return (
    <div className="my-3 p-3 rounded-2xl bg-[#0D131D]/90 border border-teal-500/20 shadow-lg">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2 font-mono">
        <FileText className="h-3.5 w-3.5 text-emerald-400" />
        <span>Grounded Document Sources ({citations.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {citations.map((c, idx) => {
          const isYouTube = c.filename.toLowerCase().includes("youtube")
          const isPdf = c.filename.toLowerCase().endsWith(".pdf")
          return (
            <div
              key={idx}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 shrink-0 hover:border-emerald-500/40 transition-colors"
            >
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
                  isYouTube
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : isPdf
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                }`}
              >
                {isYouTube ? <Tv className="h-2.5 w-2.5 inline" /> : null}
                {isYouTube ? "YouTube" : isPdf ? "PDF" : "DOCX"}
              </span>
              <span className="truncate max-w-[200px] font-medium text-[11px] text-slate-200">
                {c.filename}
              </span>
              {c.page && c.page !== "N/A" && (
                <span className="text-[10px] text-slate-400 font-mono">
                  p. {c.page}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function preprocessLaTeX(content: string): string {

  if (!content) return ""

  // Convert literal escaped "\\n" to real newlines "\n" if present from database storage
  let processed = typeof content === "string" ? content.replace(/\\n/g, "\n") : String(content)

  return processed
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

export function AssistantMessage({ message, onRegenerate, isPinned, onTogglePin }: AssistantMessageProps) {
  const showThinking = Boolean(
    message.thinkingText ||
    message.isSearching ||
    message.activeAgent ||
    (message.searchResults && message.searchResults.length > 0)
  )

  return (
    <div className={`flex w-full gap-3 my-5 group ${isPinned ? "relative pl-3 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-amber-400 before:rounded-full" : ""}`}>
      {/* Nexora AI Icon Avatar */}
      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-lg shrink-0 flex items-center justify-center">
        <div className="h-full w-full rounded-[10px] bg-[#05070B] flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-emerald-400" />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden max-w-full">
        {/* Pinned & Status Badges */}
        <div className="flex items-center gap-2 mb-1">
          {isPinned && (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
              <Pin className="h-2.5 w-2.5 fill-amber-400/40 rotate-45" />
              <span>Pinned</span>
            </div>
          )}
          {message.statusLabel && (
            <div className="text-xs text-emerald-400/80 font-mono flex items-center gap-1.5 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span>{message.statusLabel}</span>
            </div>
          )}
        </div>

        {/* Optional Thinking state & Search status */}
        {showThinking && (
          <AIThinking
            thinkingTime={message.thinkingTime}
            thinkingText={message.thinkingText}
            searchQuery={message.searchQuery}
            isSearching={message.isSearching}
            searchResults={message.searchResults}
            activeAgent={message.activeAgent}
            activeNode={message.activeNode}
          />
        )}

        {/* Grounded Web Sources Badges (ChatGPT / Perplexity style) */}
        {message.searchResults && message.searchResults.length > 0 && (
          <SourceCitations results={message.searchResults} />
        )}

        {/* Grounded Document Sources Badges (Agentic RAG) */}
        {message.content && <DocumentCitations content={message.content} />}


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

                  // Check if this inline code is a timestamp (e.g. 02:15, [02:15], 01:23:45)
                  const cleaned = codeString.replace(/[\[\]]/g, "").trim()
                  const timeMatch = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/.exec(cleaned)
                  if (timeMatch) {
                    const hrs = timeMatch[1] ? parseInt(timeMatch[1], 10) : 0
                    const mins = parseInt(timeMatch[2], 10)
                    const secs = parseInt(timeMatch[3], 10)
                    const totalSeconds = hrs * 3600 + mins * 60 + secs

                    return (
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent("nexora:seek-youtube", {
                              detail: { seconds: totalSeconds },
                            })
                          )
                        }}
                        className="inline-flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white font-mono text-xs px-1.5 py-0.5 rounded border border-red-500/40 transition-colors cursor-pointer"
                        title={`Click to jump to ${cleaned} in video`}
                      >
                        <Play className="h-2.5 w-2.5 fill-current text-red-400" />
                        {cleaned}
                      </button>
                    )
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
                h4: ({ children }) => <h4 className="text-sm font-semibold text-slate-200 mt-2 mb-1">{children}</h4>,
                h5: ({ children }) => <h5 className="text-xs font-semibold text-slate-300 mt-2 mb-1 uppercase tracking-wider">{children}</h5>,
                h6: ({ children }) => <h6 className="text-xs font-semibold text-slate-400 mt-1 mb-1">{children}</h6>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                b: ({ children }) => <b className="font-semibold text-white">{children}</b>,
                em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
                hr: () => <hr className="my-4 border-white/10" />,
                del: ({ children }) => <del className="line-through text-slate-400">{children}</del>,
                p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-slate-200">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-emerald-500/50 pl-3 my-2 text-slate-400 italic bg-white/[0.02] py-1 rounded-r">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => {
                  const isYouTubeLink = href && (href.includes("youtube.com") || href.includes("youtu.be"))
                  const timeMatch = href && href.match(/[?&]t=(\d+)s?/)

                  return (
                    <a
                      href={href}
                      onClick={(e) => {
                        if (isYouTubeLink && timeMatch) {
                          e.preventDefault()
                          const sec = parseInt(timeMatch[1], 10)
                          window.dispatchEvent(
                            new CustomEvent("nexora:seek-youtube", {
                              detail: { seconds: sec },
                            })
                          )
                        }
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 underline underline-offset-4 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {isYouTubeLink && <Play className="h-2.5 w-2.5 fill-current text-red-400 inline" />}
                      {children}
                    </a>
                  )
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3 rounded-xl border border-white/10 shadow-lg">
                    <table className="w-full text-xs text-slate-200 border-collapse">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-white/[0.06] border-b border-white/10 font-semibold">{children}</thead>,
                tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
                tr: ({ children }) => <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>,
                th: ({ children }) => <th className="p-2.5 text-left font-semibold text-slate-200">{children}</th>,
                td: ({ children }) => <td className="p-2.5">{children}</td>,
              }}
            >
              {preprocessLaTeX(message.content)}
            </ReactMarkdown>
          </div>
        )}

        {/* Generative UI Slot */}
        {message.ui && <GenerativeUIRenderer ui={message.ui} />}

        {/* Action bar */}
        {message.content && (
          <MessageActions
            content={message.content}
            onRegenerate={onRegenerate}
            isPinned={isPinned}
            onTogglePin={onTogglePin}
          />
        )}
      </div>
    </div>
  )
}
