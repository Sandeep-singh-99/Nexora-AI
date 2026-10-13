"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroProductPreview } from "@/components/landing/hero-product-preview";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

const BlackHoleHeroSection = dynamic(
  () => import("@/components/ui/blackhole-hero-section").then((m) => m.BlackHoleHeroSection),
  { ssr: false }
);

interface HeroProps {
  onOpenAuth?: (tab: "signin" | "signup") => void;
}

export function Hero({ onOpenAuth }: HeroProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // Delay mounting heavy WebGL until after initial paint & hydration
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      router.push("/chat");
    } else {
      onOpenAuth?.("signup");
    }
  };

  return (
    <section aria-label="Hero" className="relative min-h-screen w-full bg-[#05070B] overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      {/* WebGL Black Hole Canvas Background Layer */}
      <div className="absolute inset-0 opacity-40 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {mounted && (
          <BlackHoleHeroSection
            distance={26}
            elevation={-6}
            glow={0.8}
            steps={140}
            starBrightness={0.5}
            diskThickness={0.24}
            resolution={0.65}
            focus={[0.5, 0.35]}
            scrim="top"
            scrimStrength={0.85}
          />
        )}
      </div>

      {/* Subtle Radial Gradient Overlay for Visual Depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none z-0" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
          {/* Top Badge */}
          <div className="inline-block mb-6">
            <Badge
              variant="default"
              role="button"
              tabIndex={0}
              aria-label="Introducing Nexora AI - Get Started"
              className="px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md text-xs sm:text-sm font-medium text-emerald-300 shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer hover:bg-emerald-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              onClick={handleGetStarted}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleGetStarted();
                }
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Introducing Nexora AI</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            </Badge>
          </div>

          {/* Hero Heading Typography: Direct rendering for instant LCP score */}
          <h1 className="text-[44px] leading-[1.05] sm:text-[68px] lg:text-[84px] font-extrabold tracking-[-0.03em] font-sans flex flex-col items-center">
            <span className="bg-gradient-to-b from-white via-[#F5F7FA] to-slate-200 bg-clip-text text-transparent drop-shadow-sm">
              Your knowledge.
            </span>
            <span className="bg-gradient-to-b from-white via-[#F5F7FA] to-slate-300 bg-clip-text text-transparent drop-shadow-sm mt-1 sm:mt-0">
              Your research.
            </span>
            <span className="relative mt-2 sm:mt-1 inline-block">
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                One intelligent workspace.
              </span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent rounded-full blur-[1px]" aria-hidden="true" />
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-7 text-base sm:text-xl text-slate-300 max-w-2xl leading-relaxed font-normal">
            Nexora AI brings your documents, research, AI agents, and knowledge together in one intelligent workspace.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shadow-xl shadow-emerald-500/25 hover:shadow-emerald-400/40 text-base py-6 px-8 rounded-2xl group focus-visible:ring-2 focus-visible:ring-emerald-400"
              onClick={handleGetStarted}
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base py-6 px-8 rounded-2xl border-white/10 hover:border-white/20 hover:bg-white/[0.04] text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-400"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore Nexora
            </Button>
          </div>

          {/* Trust Statement */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400/90" aria-hidden="true" />
            <span>Built for researchers, developers, teams, and modern knowledge workers.</span>
          </div>
        </div>

        {/* Hero Product Visual */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="mt-12 sm:mt-16 relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-emerald-600/20 rounded-3xl blur-xl opacity-70 pointer-events-none" aria-hidden="true" />
          <HeroProductPreview />
        </motion.div>
      </div>
    </section>
  );
}
