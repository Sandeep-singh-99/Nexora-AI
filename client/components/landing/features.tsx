"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { FEATURES, FEATURE_CATEGORIES } from "@/lib/constants";
import { FeatureCard } from "@/components/landing/feature-card";
import {
  ArrowRight,
  Database,
  Layers,
  ShieldCheck,
  Tv,
  Bot,
  Sparkles,
} from "lucide-react";

export function Features() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredFeatures = useMemo(() => {
    if (selectedCategory === "all") return FEATURES;
    return FEATURES.filter((f) => f.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <section
      id="features"
      className="relative py-24 sm:py-32 bg-[#05070B] overflow-hidden border-t border-white/[0.06]"
    >
      {/* Background Technical Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      {/* Ambient Glow Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-900/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-teal-900/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-4"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>FULL-STACK AI CAPABILITIES</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-[#F5F7FA] tracking-tight font-sans leading-tight"
          >
            Everything you need to think, research, and create with AI.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-[#98A2B3] leading-relaxed"
          >
            Nexora seamlessly brings together private document intelligence, real-time YouTube transcription RAG, autonomous multi-agent reasoning, symbolic math, and live web grounding into a unified workspace.
          </motion.p>
        </div>

        {/* Core Pillars Stats Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-14 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto"
        >
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1 font-mono text-sm">
              <Tv className="h-4 w-4 text-red-400" />
              <span className="font-bold text-white text-base">YouTube RAG</span>
            </div>
            <p className="text-[11px] text-slate-400">Click transcript to seek video</p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm text-center">
            <div className="flex items-center justify-center gap-1.5 text-teal-400 mb-1 font-mono text-sm">
              <Database className="h-4 w-4" />
              <span className="font-bold text-white text-base">768-dim pgvector</span>
            </div>
            <p className="text-[11px] text-slate-400">Zero permanent disk storage</p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1 font-mono text-sm">
              <Bot className="h-4 w-4" />
              <span className="font-bold text-white text-base">LangGraph Router</span>
            </div>
            <p className="text-[11px] text-slate-400">4 specialized autonomous agents</p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1 font-mono text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-bold text-white text-base">Dual Guardrails</span>
            </div>
            <p className="text-[11px] text-slate-400">In-memory PII scanner & abuse filter</p>
          </div>
        </motion.div>

        {/* Interactive Category Filter Tabs */}
        <div className="flex items-center justify-center mb-10 overflow-x-auto pb-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
            {FEATURE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-950/40"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Grid: Animated Layout */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredFeatures.map((feature, idx) => (
              <FeatureCard key={feature.id} feature={feature} index={idx} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Bottom CTA to start using the app */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-5 sm:p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-teal-950/20 shadow-2xl backdrop-blur-md max-w-2xl mx-auto">
            <div className="text-left">
              <h4 className="text-sm sm:text-base font-semibold text-white">
                Ready to explore Nexora in real time?
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Launch a session, ask complex questions, or paste a YouTube video to transcribe.
              </p>
            </div>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs sm:text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-950/50 shrink-0 cursor-pointer"
            >
              <span>Open Chat</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
