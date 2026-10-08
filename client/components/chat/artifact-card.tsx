"use client"

import React from "react"
import { Artifact } from "@/types/artifact"
import { useArtifact } from "@/components/providers/artifact-provider"
import { getArtifactDisplayType } from "@/lib/artifacts"
import {
  Code2,
  Globe,
  FileText,
  Palette,
  Network,
  ArrowUpRight,
  Sparkles,
} from "lucide-react"

interface ArtifactCardProps {
  artifact: Artifact
}

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  const { openArtifact, activeArtifact, isOpen } = useArtifact()

  const isCurrentActive = isOpen && activeArtifact?.id === artifact.id

  const getTypeIcon = () => {
    switch (artifact.type) {
      case "html":
        return <Globe className="h-5 w-5 text-emerald-400" />
      case "mermaid":
        return <Network className="h-5 w-5 text-cyan-400" />
      case "markdown":
        return <FileText className="h-5 w-5 text-indigo-400" />
      case "svg":
        return <Palette className="h-5 w-5 text-fuchsia-400" />
      case "code":
      default:
        return <Code2 className="h-5 w-5 text-emerald-400" />
    }
  }

  const lineCount = (artifact.content || "").split("\n").length

  return (
    <div
      onClick={() => openArtifact(artifact)}
      className={`my-3 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer group shadow-md hover:shadow-xl ${
        isCurrentActive
          ? "bg-slate-900/90 dark:bg-[#0E1522] border-emerald-500/50 ring-1 ring-emerald-500/30"
          : "bg-white/80 dark:bg-[#0B101B]/80 hover:bg-slate-50 dark:hover:bg-[#0F1726] border-slate-200 dark:border-white/10"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Icon & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {getTypeIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-xs md:text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                {artifact.title || "Artifact"}
              </h4>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                {getArtifactDisplayType(artifact)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Click to view in Canvas • {lineCount} {lineCount === 1 ? "line" : "lines"}
            </p>
          </div>
        </div>

        {/* Right: Action pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isCurrentActive ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 group-hover:border-emerald-500/20 transition-all">
              <span>View Canvas</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
