"use client"

import React, { useState, useRef, useMemo } from "react"
import {
  Play,
  Search,
  ExternalLink,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2,
  Tv,
  ListFilter,
} from "lucide-react"
import { YouTubeSnippet } from "@/types/document"

export interface YouTubeCardProps {
  videoId: string
  title?: string
  authorName?: string
  url?: string
  thumbnailUrl?: string
  snippets?: YouTubeSnippet[]
  initialSeekTime?: number
  onSeek?: (seconds: number) => void
  onAskQuestion?: (prompt: string) => void
}

export function YouTubeCard({
  videoId,
  title = "YouTube Video",
  authorName = "YouTube",
  url,
  thumbnailUrl,
  snippets = [],
  initialSeekTime = 0,
  onSeek,
  onAskQuestion,
}: YouTubeCardProps) {
  const [activeTime, setActiveTime] = useState<number>(initialSeekTime)
  const [searchFilter, setSearchFilter] = useState<string>("")
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const safeWatchUrl = React.useMemo(() => {
    if (url) {
      try {
        const parsed = new URL(url)
        if (
          parsed.protocol === "https:" &&
          (parsed.hostname === "www.youtube.com" ||
            parsed.hostname === "youtube.com" ||
            parsed.hostname === "youtu.be")
        ) {
          return url
        }
      } catch {
        // Fallback below
      }
    }
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
  }, [url, videoId])

  // Function to seek video to timestamp and play
  const seekToTimestamp = (seconds: number) => {
    setActiveTime(seconds)
    setIsPlaying(true)
    onSeek?.(seconds)

    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "seekTo", args: [seconds, true] }),
          "*"
        )
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: [] }),
          "*"
        )
      } catch (err) {
        console.warn("Could not postMessage to YouTube iframe:", err)
      }
    }
  }

  // Listen for global timestamp clicks from chat messages
  React.useEffect(() => {
    const handleGlobalSeek = (e: any) => {
      if (typeof e.detail?.seconds === "number") {
        seekToTimestamp(e.detail.seconds)
      }
    }
    window.addEventListener("nexora:seek-youtube", handleGlobalSeek)
    return () => window.removeEventListener("nexora:seek-youtube", handleGlobalSeek)
  }, [])

  // Filter snippets based on user search term
  const filteredSnippets = useMemo(() => {
    if (!searchFilter.trim()) return snippets
    const q = searchFilter.toLowerCase().trim()
    return snippets.filter(
      (s) => s.text.toLowerCase().includes(q) || s.timestamp.includes(q)
    )
  }, [snippets, searchFilter])

  // Total video duration estimate from last snippet
  const totalDurationStr = useMemo(() => {
    if (snippets.length === 0) return ""
    const last = snippets[snippets.length - 1]
    const totalSec = Math.round(last.start + last.duration)
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins}m ${secs}s`
  }, [snippets])

  return (
    <div className="my-4 w-full rounded-2xl border border-red-500/30 bg-[#0B0F17]/95 shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-red-950/30 via-slate-900/40 to-[#0B0F17]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 shrink-0">
            <Tv className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[280px] sm:max-w-md">
                {title}
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="h-2.5 w-2.5" /> RAG Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>{authorName}</span>
              {totalDurationStr && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3 text-slate-500" />
                    {totalDurationStr}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <a
          href={safeWatchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white border border-white/10 transition-colors shrink-0 ml-2"
        >
          <span className="hidden sm:inline">YouTube</span>
          <ExternalLink className="h-3 w-3 text-red-400" />
        </a>
      </div>

      {/* Main Content: Player + Transcript Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Column: Embedded YouTube Player */}
        <div className="lg:col-span-7 p-3 sm:p-4 bg-black/40 flex flex-col justify-between">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&start=${Math.floor(activeTime)}`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-none"
            />
          </div>

          {/* Quick RAG Questions */}
          <div className="mt-3">
            <p className="text-[11px] text-slate-400 font-mono mb-1.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-teal-400" />
              Ask Nexora about this video:
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (onAskQuestion) onAskQuestion("Summarize this video with key points and timestamps")
                  else {
                    const event = new CustomEvent("nexora:ask-rag", {
                      detail: { prompt: "Summarize this video with key points and timestamps" },
                    })
                    window.dispatchEvent(event)
                  }
                }}
                className="px-2 py-1 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/30 text-[11px] text-slate-300 hover:text-emerald-300 transition-all cursor-pointer"
              >
                📄 Summarize video
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onAskQuestion) onAskQuestion("What are the main topics and key takeaways in this video?")
                  else {
                    const event = new CustomEvent("nexora:ask-rag", {
                      detail: { prompt: "What are the main topics and key takeaways in this video?" },
                    })
                    window.dispatchEvent(event)
                  }
                }}
                className="px-2 py-1 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-teal-500/10 hover:border-teal-500/30 text-[11px] text-slate-300 hover:text-teal-300 transition-all cursor-pointer"
              >
                💡 Key takeaways
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onAskQuestion) onAskQuestion("Provide a timestamped outline of this video")
                  else {
                    const event = new CustomEvent("nexora:ask-rag", {
                      detail: { prompt: "Provide a timestamped outline of this video" },
                    })
                    window.dispatchEvent(event)
                  }
                }}
                className="px-2 py-1 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-purple-500/10 hover:border-purple-500/30 text-[11px] text-slate-300 hover:text-purple-300 transition-all cursor-pointer"
              >
                ⏱️ Timestamped outline
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Transcript Browser */}
        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-white/10 bg-white/[0.01] flex flex-col h-[380px] sm:h-[420px]">
          {/* Transcript Search Toolbar */}
          <div className="p-3 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-red-400" />
                Transcript ({snippets.length})
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                Click any line to play
              </span>
            </div>

            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search transcript text or time..."
                className="w-full bg-[#070A0F] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500/50"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300 px-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Transcript Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredSnippets.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                <ListFilter className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                No transcript lines match "{searchFilter}"
              </div>
            ) : (
              filteredSnippets.map((snippet, idx) => {
                const isCurrentActive =
                  activeTime >= snippet.start &&
                  activeTime < snippet.start + Math.max(snippet.duration, 4)

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => seekToTimestamp(snippet.start)}
                    className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2.5 group cursor-pointer ${
                      isCurrentActive
                        ? "bg-red-500/15 border border-red-500/40 shadow-sm"
                        : "bg-white/[0.02] border border-transparent hover:bg-white/[0.06] hover:border-white/10"
                    }`}
                    title={`Click to play video at ${snippet.timestamp}`}
                  >
                    {/* Timestamp Button */}
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 font-bold transition-colors ${
                        isCurrentActive
                          ? "bg-red-500 text-white"
                          : "bg-white/10 text-slate-300 group-hover:bg-red-500/20 group-hover:text-red-300"
                      }`}
                    >
                      <Play className="h-2.5 w-2.5 fill-current" />
                      {snippet.timestamp}
                    </span>

                    {/* Transcript Line Text */}
                    <span
                      className={`text-xs leading-relaxed transition-colors ${
                        isCurrentActive
                          ? "text-white font-medium"
                          : "text-slate-300 group-hover:text-white"
                      }`}
                    >
                      {snippet.text}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
