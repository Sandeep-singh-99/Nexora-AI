"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet } from "@/components/ui/sheet"

export interface ChatSidebarSkeletonProps {
  className?: string
  isOpenMobile?: boolean
  onCloseMobile?: () => void
}

export function SidebarSkeletonContent({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-between bg-[#05070B] p-4 text-slate-200 border-r border-white/10 select-none",
        className
      )}
    >
      {/* Top Section */}
      <div>
        {/* Header & Branding Skeleton */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-0.5 shadow-sm flex items-center justify-center animate-pulse">
              <div className="h-3.5 w-3.5 rounded bg-emerald-400/30" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24 bg-white/10" />
              <Skeleton className="h-2.5 w-16 bg-white/5" />
            </div>
          </div>
        </div>

        {/* New Chat Button Skeleton */}
        <div className="w-full h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center gap-2 mb-4 animate-pulse">
          <div className="h-4 w-4 rounded-full bg-emerald-400/30" />
          <div className="h-3 w-16 rounded bg-emerald-400/30" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="relative mb-4">
          <div className="h-9 w-full rounded-md bg-white/[0.03] border border-white/10 flex items-center px-3 gap-2.5 animate-pulse">
            <div className="h-3.5 w-3.5 rounded bg-white/10 shrink-0" />
            <div className="h-3 w-24 rounded bg-white/10" />
          </div>
        </div>

        {/* Conversations List Skeleton */}
        <div className="space-y-5 max-h-[calc(100vh-280px)] overflow-hidden pr-1">
          {/* Section 1: Today */}
          <div className="space-y-2">
            <div className="px-2">
              <Skeleton className="h-2.5 w-12 bg-white/10" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 bg-white/[0.03] border border-white/[0.04]">
                <div className="h-3.5 w-3.5 rounded bg-emerald-500/20 shrink-0" />
                <Skeleton className="h-3.5 w-3/4 bg-white/10" />
              </div>
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
                <div className="h-3.5 w-3.5 rounded bg-white/10 shrink-0" />
                <Skeleton className="h-3.5 w-4/5 bg-white/10" />
              </div>
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
                <div className="h-3.5 w-3.5 rounded bg-white/10 shrink-0" />
                <Skeleton className="h-3.5 w-3/5 bg-white/10" />
              </div>
            </div>
          </div>

          {/* Section 2: Previous 7 Days */}
          <div className="space-y-2">
            <div className="px-2">
              <Skeleton className="h-2.5 w-24 bg-white/10" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
                <div className="h-3.5 w-3.5 rounded bg-white/10 shrink-0" />
                <Skeleton className="h-3.5 w-2/3 bg-white/10" />
              </div>
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
                <div className="h-3.5 w-3.5 rounded bg-white/10 shrink-0" />
                <Skeleton className="h-3.5 w-4/5 bg-white/10" />
              </div>
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
                <div className="h-3.5 w-3.5 rounded bg-white/10 shrink-0" />
                <Skeleton className="h-3.5 w-1/2 bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Footer Profile Skeleton */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-emerald-950/50 border border-emerald-500/20 shrink-0 animate-pulse" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20 bg-white/15" />
            <Skeleton className="h-2 w-14 bg-white/5" />
          </div>
        </div>
        <div className="h-8 w-8 rounded-xl bg-white/5 animate-pulse" />
      </div>
    </div>
  )
}

export function ChatSidebarSkeleton({
  className,
  isOpenMobile,
  onCloseMobile,
}: ChatSidebarSkeletonProps) {
  return (
    <>
      {/* Desktop Sidebar Skeleton (Fixed 260px) */}
      <aside className={cn("hidden md:flex h-screen w-64 shrink-0 flex-col", className)}>
        <SidebarSkeletonContent />
      </aside>

      {/* Mobile Drawer (Sheet) Skeleton */}
      {isOpenMobile && (
        <Sheet isOpen={isOpenMobile} onClose={onCloseMobile || (() => {})}>
          <div className="h-full w-full">
            <SidebarSkeletonContent />
          </div>
        </Sheet>
      )}
    </>
  )
}

export { ChatSidebarSkeleton as SidebarSkeleton }
