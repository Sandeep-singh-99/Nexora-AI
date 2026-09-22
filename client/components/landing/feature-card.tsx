"use client";

import * as React from "react";
import { motion } from "motion/react";
import { FeatureItem } from "@/lib/constants";
import { Play, Sparkles, Shield, Cpu, ExternalLink } from "lucide-react";

interface FeatureCardProps {
  feature: FeatureItem;
  index: number;
}

export function FeatureCard({ feature, index }: FeatureCardProps) {
  const IconComponent = feature.icon;

  // Custom visual micro-demos inside cards
  const renderVisualMockup = () => {
    switch (feature.id) {
      case "youtube-rag":
        return (
          <div className="mt-4 p-2.5 rounded-xl bg-black/40 border border-red-500/20 text-xs">
            <div className="flex items-center justify-between text-[11px] font-mono text-red-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Play className="h-3 w-3 fill-current" />
                /youtube &lt;url&gt;
              </span>
              <span className="text-[10px] text-slate-400">Click to seek</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-mono border border-red-500/30">
                ▶ 00:15 Intro
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 text-[10px] font-mono border border-white/10">
                ▶ 01:42 Key Concept
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 text-[10px] font-mono border border-white/10">
                ▶ 03:10 Takeaway
              </span>
            </div>
          </div>
        );

      case "document-rag":
        return (
          <div className="mt-4 p-2.5 rounded-xl bg-black/40 border border-emerald-500/20 text-xs">
            <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 mb-1.5">
              <span>PDF / DOCX In-Memory</span>
              <span className="text-slate-400">768-dim Embeddings</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Parse (RAM)
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                pgvector (HNSW)
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-slate-200 border border-white/10">
                Citations
              </span>
            </div>
          </div>
        );

      case "multi-agent":
        return (
          <div className="mt-4 p-2.5 rounded-xl bg-black/40 border border-teal-500/20 text-xs">
            <div className="flex items-center justify-between text-[10px] font-mono text-teal-400 mb-1.5">
              <span>LangGraph State Machine</span>
              <span className="text-slate-400">Memory Saver</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
              <div className="p-1 rounded bg-white/5 border border-white/10 text-slate-300">Chat</div>
              <div className="p-1 rounded bg-white/5 border border-white/10 text-slate-300">Code</div>
              <div className="p-1 rounded bg-white/5 border border-white/10 text-slate-300">Math</div>
              <div className="p-1 rounded bg-white/5 border border-white/10 text-slate-300">Research</div>
            </div>
          </div>
        );

      case "web-research":
        return (
          <div className="mt-4 p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-xs">
            <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-1.5">
              <span>Tavily Search Engine</span>
              <span className="text-slate-400">Live Web</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-mono">
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                <ExternalLink className="h-2.5 w-2.5" /> Sources (3)
              </span>
              <span className="truncate text-slate-400">arxiv.org, github.com</span>
            </div>
          </div>
        );

      case "generative-ui":
        return (
          <div className="mt-4 p-2.5 rounded-xl bg-black/40 border border-purple-500/20 text-xs">
            <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 mb-1.5">
              <span>Dynamic Component Stream</span>
              <span className="text-slate-400">React 19</span>
            </div>
            <div className="flex flex-wrap gap-1 text-[10px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20">
                📊 Charts
              </span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20">
                📋 Tables
              </span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20">
                🎬 Player
              </span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20">
                ∑ KaTeX
              </span>
            </div>
          </div>
        );

      case "math-engine":
        return (
          <div className="mt-4 p-2.5 rounded-xl bg-black/40 border border-amber-500/20 text-xs">
            <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 mb-1.5">
              <span>SymPy Exact Solver</span>
              <span className="text-slate-400">KaTeX Formatted</span>
            </div>
            <div className="text-[11px] font-mono text-amber-200/90 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
              {"$$\\int_0^\\infty x^2 e^{-x} dx = 2$$"}
            </div>
          </div>
        );

      case "safety-guardrails":
        return (
          <div className="mt-4 p-2.5 rounded-xl bg-black/40 border border-emerald-500/20 text-xs">
            <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" /> Dual Guardrails
              </span>
              <span className="text-emerald-400">HITL Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                Input Filter
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                PII Scanner
              </span>
              <span className="text-slate-600">&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                Output Filter
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.4,
        delay: (index % 4) * 0.05,
        ease: "easeOut",
      }}
      whileHover={{ y: -4 }}
      className={`group relative h-full rounded-2xl border bg-[#0D131D] p-6 sm:p-7 shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden ${
        feature.highlight
          ? "border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-b from-[#0D1624] to-[#0D131D]"
          : "border-white/[0.08] hover:border-white/[0.2] hover:bg-[#101826]"
      }`}
    >
      {/* Background ambient radial glow */}
      <div
        className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-opacity ${
          feature.highlight
            ? "bg-emerald-500/10 group-hover:bg-emerald-500/20"
            : "bg-teal-500/5 group-hover:bg-teal-500/10"
        }`}
      />

      <div>
        {/* Top Header: Icon + Badge */}
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 transition-all duration-300">
            <IconComponent className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 group-hover:scale-110 transition-all duration-300" />
          </div>

          {feature.badge && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold border ${
                feature.badge === "New Feature"
                  ? "bg-red-500/15 text-red-300 border-red-500/30"
                  : feature.highlight
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-white/5 text-slate-300 border-white/10"
              }`}
            >
              <Sparkles className="h-2.5 w-2.5" />
              {feature.badge}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-[#F5F7FA] tracking-tight group-hover:text-white transition-colors">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm text-[#98A2B3] leading-relaxed group-hover:text-slate-300 transition-colors">
          {feature.description}
        </p>

        {/* Visual Mini Mockup */}
        {renderVisualMockup()}
      </div>

      {/* Feature Tags & Decorative Footer */}
      <div className="mt-6 pt-4 border-t border-white/[0.05]">
        <div className="flex flex-wrap gap-1.5">
          {feature.tags.map((tag, tIdx) => (
            <span
              key={tIdx}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-slate-400 group-hover:border-emerald-500/30 group-hover:text-emerald-300/90 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
