"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Testimonials } from "@/components/landing/testimonials";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { AuthModal } from "@/components/auth/auth-modal";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");

  // Automatically navigate to chat page UI if user is already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/chat");
    }
  }, [user, isLoading, router]);

  // Open auth modal if redirected with ?auth=signin or ?auth=signup
  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth === "signin" || auth === "signup") {
      setAuthTab(auth);
      setAuthOpen(true);
    }
  }, [searchParams]);

  const handleOpenAuth = (tab: "signin" | "signup") => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  // If user is already logged in, show redirecting state while navigating
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070B] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-400">Redirecting to chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#05070B] text-[#F5F7FA] selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar onOpenAuth={handleOpenAuth} />
      <main className="flex-1">
        <Hero onOpenAuth={handleOpenAuth} />
        <Features onOpenAuth={handleOpenAuth} />
        <Testimonials />
        <FinalCTA onOpenAuth={handleOpenAuth} />
      </main>
      <Footer />
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialTab={authTab}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
