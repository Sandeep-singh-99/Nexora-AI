"use client";

import * as React from "react";
import {
  MessageSquare,
  Brain,
  Search,
  Bot,
  Plug,
  Plus,
  FileText,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Table as TableIcon,
  ChevronRight,
  Database,
  SearchCode,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function HeroProductPreview() {
  return (
    <div className="w-full rounded-2xl border border-white/[0.12] bg-[#0A0F18] shadow-2xl shadow-emerald-950/40 overflow-hidden text-slate-200 text-xs sm:text-sm font-sans transition-all">
      {/* Top Window Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#05070B] border-b border-white/[0.08]">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/[0.03] px-3 py-1 rounded-md border border-white/[0.05]">
          <Database className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
          <span>workspace.nexora.ai/research/v2</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span className="hidden sm:inline">MCP Engine Active</span>
        </div>
      </div>

      {/* Main Workspace Grid: Sidebar + Chat Area + Sources Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px] sm:min-h-[520px]">
        {/* Left Sidebar */}
        <div className="hidden md:flex md:col-span-3 lg:col-span-2 flex-col justify-between p-3.5 border-r border-white/[0.08] bg-[#070B12]">
          <div className="space-y-4">
            {/* App Brand */}
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-bold text-xs">
                  N
                </div>
                <span className="font-semibold text-white tracking-tight text-sm">
                  Nexora
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-300 border-emerald-500/30">
                PRO
              </Badge>
            </div>

            {/* New Chat Button */}
            <button
              type="button"
              aria-label="Start new conversation"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-200 border border-emerald-500/30 py-2 px-3 rounded-xl font-medium transition-all text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>New Chat</span>
            </button>

            {/* Navigation Items */}
            <nav className="space-y-1">
              <div className="px-2 py-1.5 rounded-lg bg-white/[0.08] text-white flex items-center gap-2.5 font-medium cursor-pointer">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Conversations</span>
              </div>
              <div className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] flex items-center gap-2.5 cursor-pointer transition-colors">
                <Brain className="w-4 h-4 text-teal-400" />
                <span>Knowledge</span>
              </div>
              <div className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] flex items-center justify-between cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-emerald-300" />
                  <span>Research</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] flex items-center gap-2.5 cursor-pointer transition-colors">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>Agents</span>
              </div>
              <div className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] flex items-center gap-2.5 cursor-pointer transition-colors">
                <Plug className="w-4 h-4 text-teal-400" />
                <span>MCP Tools</span>
              </div>
            </nav>
          </div>

          {/* User profile preview */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-xs">
              AM
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white truncate">Alex Morgan</p>
              <p className="text-[10px] text-slate-400 truncate">Northstar Labs</p>
            </div>
          </div>
        </div>

        {/* Center Main Chat & Research Area */}
        <div className="col-span-1 md:col-span-6 lg:col-span-7 p-4 sm:p-6 flex flex-col justify-between bg-[#0A0F18]">
          <div className="space-y-5">
            {/* Header Greeting */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <p className="font-semibold text-white text-sm sm:text-base">
                  Deep Research Workflow
                </p>
              </div>
              <Badge variant="secondary" className="text-[11px] bg-white/[0.06] text-slate-300">
                18 Sources Active
              </Badge>
            </div>

            {/* User Prompt */}
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-emerald-600/20 border border-emerald-500/30 rounded-2xl rounded-tr-sm p-3.5 text-slate-100 text-xs sm:text-sm">
                &ldquo;Summarize the latest research from my knowledge base.&rdquo;
              </div>
            </div>

            {/* Research Agent Progress Bar */}
            <div className="bg-[#0D131D] border border-white/[0.08] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                  <SearchCode className="w-3.5 h-3.5 animate-spin text-emerald-400" aria-hidden="true" />
                  Synthesizing vector search & agent outputs...
                </span>
                <span className="text-slate-300 text-[11px]">100%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-full w-full rounded-full" />
              </div>
            </div>

            {/* AI Answer Content */}
            <div className="flex gap-3">
              <div className="w-7 h-7 shrink-0 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-[#05070B] font-bold text-xs shadow-md">
                N
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm text-[#F5F7FA]">
                <p className="leading-relaxed">
                  Based on <span className="text-emerald-400 font-medium">18 relevant sources</span> across your connected documents and vector indices, here are the key findings:
                </p>

                {/* Source Citation Badges */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] px-2.5 py-1 rounded-md text-emerald-300 transition-colors cursor-pointer">
                    <FileText className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                    [1] Research Paper.pdf
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] px-2.5 py-1 rounded-md text-teal-300 transition-colors cursor-pointer">
                    <FileText className="w-3 h-3 text-teal-400" aria-hidden="true" />
                    [2] Product Strategy.md
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] px-2.5 py-1 rounded-md text-emerald-300 transition-colors cursor-pointer">
                    <FileText className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                    [3] Market Report.pdf
                  </span>
                </div>

                {/* Generative UI Table */}
                <div className="rounded-xl border border-white/[0.08] bg-[#0D131D] overflow-hidden text-xs my-2">
                  <div className="bg-white/[0.03] px-3 py-2 border-b border-white/[0.06] flex items-center justify-between font-medium text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <TableIcon className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                      <span>Synthesized Metric Overview</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Generated Table</span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    <div className="grid grid-cols-3 px-3 py-2 text-slate-300 font-medium">
                      <span>Pillar</span>
                      <span>Confidence</span>
                      <span>Impact</span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-2 text-slate-200">
                      <span className="font-medium text-emerald-300">Agent Reasoning</span>
                      <span className="text-emerald-400">98.4%</span>
                      <span>High</span>
                    </div>
                    <div className="grid grid-cols-3 px-3 py-2 text-slate-200">
                      <span className="font-medium text-teal-300">Context Retrieval</span>
                      <span className="text-emerald-400">96.1%</span>
                      <span>Critical</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fake Input Bar */}
          <div className="mt-4 pt-3 border-t border-white/[0.08]">
            <div className="relative flex items-center bg-[#0D131D] border border-white/[0.12] rounded-xl px-3 py-2.5 text-slate-300 text-xs sm:text-sm">
              <span className="flex-1 text-slate-400">Ask a follow-up question or instruct agents...</span>
              <button
                type="button"
                aria-label="Send query"
                className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Sources */}
        <div className="col-span-1 md:col-span-3 lg:col-span-3 p-4 border-t md:border-t-0 md:border-l border-white/[0.08] bg-[#070B12] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
              <span className="font-semibold text-white text-xs uppercase tracking-wider text-slate-400">
                Sources
              </span>
              <Badge variant="outline" className="text-[10px] text-slate-400 border-white/10">
                3 Grounded
              </Badge>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-[#0D131D] border border-white/[0.08] hover:border-emerald-500/40 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-200 truncate max-w-[120px] sm:max-w-[150px]">
                      Research Paper.pdf
                    </span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 transition-colors" aria-hidden="true" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  Multi-agent orchestration and retrieval augmented synthesis benchmarks.
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>94% match</span>
                  <span className="text-emerald-300 font-mono">1.4 MB</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0D131D] border border-white/[0.08] hover:border-teal-500/40 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-medium text-slate-200 truncate max-w-[120px] sm:max-w-[150px]">
                      Product Strategy.md
                    </span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-teal-400 transition-colors" aria-hidden="true" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  Q3 2026 AI workspace roadmap and enterprise MCP integration architecture.
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>88% match</span>
                  <span className="text-teal-300 font-mono">320 KB</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0D131D] border border-white/[0.08] hover:border-emerald-500/40 transition-colors group cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-medium text-slate-200 truncate max-w-[120px] sm:max-w-[150px]">
                      Market Report.pdf
                    </span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 transition-colors" aria-hidden="true" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  Global SaaS market analysis for autonomous knowledge platforms.
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>85% match</span>
                  <span className="text-emerald-300 font-mono">2.8 MB</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> Grounded Verification
            </span>
            <span className="font-mono text-slate-400">v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
