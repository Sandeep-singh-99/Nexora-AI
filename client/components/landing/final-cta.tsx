"use client";

import * as React from "react";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

interface FinalCTAProps {
  onOpenAuth?: (tab: "signin" | "signup") => void;
}

export function FinalCTA({ onOpenAuth }: FinalCTAProps) {
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
    <section className="relative py-16 sm:py-24 bg-[#0A0F18] border-t border-white/[0.06] overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-[#0D131D] via-[#0A0F18] to-[#05070B] p-8 sm:p-14 text-center overflow-hidden shadow-2xl"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Transform Your Workflow</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F5F7FA] tracking-tight">
              Ready to build a smarter way to work?
            </h2>

            <p className="mt-4 text-base sm:text-lg text-[#98A2B3] leading-relaxed">
              Bring your knowledge, research, and AI workflows together with Nexora.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-xl shadow-emerald-500/30 hover:shadow-emerald-400/40 text-base py-6 px-8 rounded-2xl group"
                onClick={handleGetStarted}
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
