"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Sparkles, ArrowRight, User as UserIcon, LogOut, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/constants";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";

interface NavbarProps {
  onOpenAuth?: (tab: "signin" | "signup") => void;
}

export function Navbar({ onOpenAuth }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: user, isLoading } = useCurrentUser();
  const logoutMutation = useLogout();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#05070B]/80 backdrop-blur-md border-b border-white/[0.08] py-3.5 shadow-2xl"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Nexora Logo + Wordmark */}
          <Link
            href="/"
            aria-label="Nexora Homepage"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600/30 via-emerald-500/20 to-teal-500/30 border border-emerald-500/30 group-hover:border-emerald-400/60 transition-all shadow-inner">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-emerald-400 group-hover:text-emerald-300 transition-colors"
                aria-hidden="true"
              >
                <path
                  d="M4 19L4 5L10 14L16 5L20 5L20 19"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="4" cy="5" r="1.5" fill="#34D399" />
                <circle cx="10" cy="14" r="1.5" fill="#10B981" />
                <circle cx="20" cy="19" r="1.5" fill="#2DD4BF" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#F5F7FA] font-sans">
                Nexora
              </span>
              <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                v2.0
              </span>
            </div>
          </Link>

          {/* Desktop Center Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1.5 py-0.5"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="w-20 h-8 bg-white/5 animate-pulse rounded-xl" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/chat"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4 fill-slate-950" />
                  <span>Go to Chat</span>
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] border border-white/10 rounded-xl text-xs text-slate-300">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="max-w-[140px] truncate">{user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  aria-label="Sign Out"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth?.("signin")}
                  className="text-sm font-medium text-slate-300 hover:text-[#F5F7FA] px-3 py-2 transition-colors hover:underline underline-offset-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
                >
                  Sign In
                </button>
                <Button
                  variant="primary"
                  size="default"
                  className="relative group overflow-hidden shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30 rounded-xl"
                  onClick={() => onOpenAuth?.("signup")}
                >
                  <span className="relative z-10 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-950">
                    Get Started
                    <Sparkles className="w-3.5 h-3.5 text-slate-950 group-hover:rotate-12 transition-transform" />
                  </span>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Menu Icon */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation (Sheet) */}
      <Sheet isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-emerald-400"
            >
              <path
                d="M4 19L4 5L10 14L16 5L20 5L20 19"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">Nexora AI</span>
        </div>

        <nav className="flex flex-col space-y-4">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => {
                setMobileOpen(false);
                document.getElementById(item.href.replace("#", ""))?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-base font-medium text-slate-300 hover:text-emerald-400 transition-colors py-2 border-b border-white/5 flex items-center justify-between"
            >
              <span>{item.label}</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </a>
          ))}
        </nav>

        <div className="mt-8 flex flex-col gap-3 pt-6 border-t border-white/10">
          {user ? (
            <div className="flex flex-col gap-2.5">
              <Link
                href="/chat"
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors cursor-pointer shadow-lg shadow-emerald-950/30"
              >
                <MessageSquare className="w-4 h-4 fill-slate-950" />
                <span>Go to Workspace / Chat</span>
              </Link>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl text-xs text-slate-300">
                <UserIcon className="w-4 h-4 text-emerald-400" />
                <span className="truncate">{user.email}</span>
              </div>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logoutMutation.mutate();
                }}
                className="w-full text-center py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onOpenAuth?.("signin");
                }}
                className="w-full text-center py-2.5 text-sm font-medium text-slate-300 hover:text-white rounded-xl border border-white/10 bg-white/5 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center text-slate-950 font-semibold"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenAuth?.("signup");
                }}
              >
                Get Started
              </Button>
            </>
          )}
        </div>
      </Sheet>
    </>
  );
}
