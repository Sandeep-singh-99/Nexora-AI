"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlackHoleHeroSection } from "@/components/ui/blackhole-hero-section";
import { HeroProductPreview } from "@/components/landing/hero-product-preview";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

interface HeroProps {
  onOpenAuth?: (tab: "signin" | "signup") => void;
}

export function Hero({ onOpenAuth }: HeroProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      router.push("/chat");
    } else {
      onOpenAuth?.("signup");
    }
  };
  return (
    <section className="relative min-h-screen w-full bg-[#05070B] overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      {/* WebGL Black Hole Canvas Background Layer */}
      <div className="absolute inset-0 opacity-40 pointer-events-none z-0 overflow-hidden">
        <BlackHoleHeroSection
          distance={26}
          elevation={-6}
          glow={0.8}
          steps={220}
          starBrightness={0.5}
          diskThickness={0.24}
          resolution={0.65}
          focus={[0.5, 0.35]}
          scrim="top"
          scrimStrength={0.85}
        />
      </div>

      {/* Subtle Radial Gradient Overlay for Visual Depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-block mb-6"
          >
            <Badge
              variant="default"
              className="px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md text-xs sm:text-sm font-medium text-emerald-300 shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer hover:bg-emerald-500/20 transition-colors"
              onClick={handleGetStarted}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Introducing Nexora AI</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </Badge>
          </motion.div>

          {/* Hero Heading Typography */}
          <h1 className="text-[44px] leading-[1.05] sm:text-[68px] lg:text-[84px] font-extrabold tracking-[-0.03em] font-sans flex flex-col items-center">
            <motion.span
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="bg-gradient-to-b from-white via-[#F5F7FA] to-slate-300 bg-clip-text text-transparent drop-shadow-sm"
            >
              Your knowledge.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="bg-gradient-to-b from-white via-[#F5F7FA] to-slate-400 bg-clip-text text-transparent drop-shadow-sm mt-1 sm:mt-0"
            >
              Your research.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="relative mt-2 sm:mt-1 inline-block"
            >
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                One intelligent workspace.
              </span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent rounded-full blur-[1px]" />
            </motion.span>
          </h1>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="mt-7 text-base sm:text-xl text-[#98A2B3] max-w-2xl leading-relaxed font-normal"
          >
            Nexora AI brings your documents, research, AI agents, and knowledge together in one intelligent workspace.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shadow-xl shadow-emerald-500/25 hover:shadow-emerald-400/40 text-base py-6 px-8 rounded-2xl group"
              onClick={handleGetStarted}
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base py-6 px-8 rounded-2xl border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore Nexora
            </Button>
          </motion.div>

          {/* Trust Statement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            className="mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-[#667085]"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
            <span>Built for researchers, developers, teams, and modern knowledge workers.</span>
          </motion.div>
        </div>

        {/* Hero Product Visual */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
          className="mt-12 sm:mt-16 relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-emerald-600/20 rounded-3xl blur-xl opacity-70 pointer-events-none" />
          <HeroProductPreview />
        </motion.div>
      </div>
    </section>
  );
}
