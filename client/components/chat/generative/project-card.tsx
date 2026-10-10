"use client"

import React from "react"
import { FolderGit2, GitBranch, Star, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProjectCardProps {
  name?: string
  status?: string
  techStack?: string[]
  stars?: number
  branches?: number
  lastUpdated?: string
}

export function ProjectCard({
  name = "ClassBuddy",
  status = "Active Development",
  techStack = ["FastAPI", "React 19", "LangGraph", "Groq Llama-3"],
  stars = 42,
  branches = 4,
  lastUpdated = "2 hours ago",
}: ProjectCardProps) {
  return (
    <div className="w-full max-w-md bg-[#0D131D]/90 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl p-4 my-3">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">{name}</h4>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Activity className="h-3 w-3 text-emerald-400 animate-pulse" /> {status}
            </span>
          </div>
        </div>
        <Badge variant="success" className="px-2 py-0.5 text-[10px]">
          v1.0.0
        </Badge>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Technology Stack</span>
          <div className="flex flex-wrap gap-1.5">
            {techStack.map((tech, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[11px] font-mono text-emerald-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-400" /> {stars}
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="h-3 w-3 text-teal-400" /> {branches} branches
            </span>
          </div>
          <span>Updated {lastUpdated}</span>
        </div>
      </div>
    </div>
  )
}
