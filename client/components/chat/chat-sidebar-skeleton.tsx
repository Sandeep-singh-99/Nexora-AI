"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet } from "@/components/ui/sheet"

export interface ChatSidebarSkeletonProps {
  className?: string
  isOpenMobile?: boolean
  onCloseMobile?: () => void
  isCollapsed?: boolean
}

export function SidebarSkeletonContent({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col bg-white dark:bg-[#05070B] p-4 text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-white/10 select-none",
        className
      )}
    >
      {/* Top Section */}
      <div className="shrink-0">
        {/* Header & Branding Skeleton */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-white/10 p-0.5 shadow-sm flex items-center justify-center animate-pulse">
              <div className="h-3.5 w-3.5 rounded bg-slate-300 dark:bg-white/20" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24 bg-slate-200 dark:bg-white/10" />
              <Skeleton className="h-2.5 w-16 bg-slate-100 dark:bg-white/5" />
            </div>
          </div>
        </div>

        {/* New Chat Button Skeleton */}
        <div className="w-full h-10 rounded-xl bg-slate-200/80 dark:bg-white/10 flex items-center justify-center gap-2 mb-4 animate-pulse">
          <div className="h-4 w-4 rounded-full bg-slate-300 dark:bg-white/20" />
          <div className="h-3 w-16 rounded bg-slate-300 dark:bg-white/20" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="relative mb-4">
          <div className="h-9 w-full rounded-md bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center px-3 gap-2.5 animate-pulse">
            <div className="h-3.5 w-3.5 rounded bg-slate-200 dark:bg-white/10 shrink-0" />
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-white/10" />
          </div>
        </div>
      </div>

      {/* Conversations List Skeleton */}
      <div className="flex-1 min-h-0 space-y-5 overflow-hidden pr-1 pb-4">
        {/* Section 1: Today */}
        <div className="space-y-2">
          <div className="px-2">
            <Skeleton className="h-2.5 w-12 bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 bg-slate-200/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.04]">
              <div className="h-3.5 w-3.5 rounded bg-slate-300 dark:bg-white/20 shrink-0" />
              <Skeleton className="h-3.5 w-3/4 bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
              <div className="h-3.5 w-3.5 rounded bg-slate-200 dark:bg-white/10 shrink-0" />
              <Skeleton className="h-3.5 w-4/5 bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
              <div className="h-3.5 w-3.5 rounded bg-slate-200 dark:bg-white/10 shrink-0" />
              <Skeleton className="h-3.5 w-3/5 bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        </div>

        {/* Section 2: Previous 7 Days */}
        <div className="space-y-2">
          <div className="px-2">
            <Skeleton className="h-2.5 w-24 bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
              <div className="h-3.5 w-3.5 rounded bg-slate-200 dark:bg-white/10 shrink-0" />
              <Skeleton className="h-3.5 w-2/3 bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
              <div className="h-3.5 w-3.5 rounded bg-slate-200 dark:bg-white/10 shrink-0" />
              <Skeleton className="h-3.5 w-4/5 bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
              <div className="h-3.5 w-3.5 rounded bg-slate-200 dark:bg-white/10 shrink-0" />
              <Skeleton className="h-3.5 w-1/2 bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      {/* User Footer Profile Skeleton */}
      <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-white/10 shrink-0 animate-pulse" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20 bg-slate-300 dark:bg-white/15" />
            <Skeleton className="h-2 w-14 bg-slate-200 dark:bg-white/5" />
          </div>
        </div>
        <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-white/5 animate-pulse" />
      </div>
    </div>
  )
}

export function ChatSidebarSkeleton({
  className,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
}: ChatSidebarSkeletonProps) {
  return (
    <>
      {/* Desktop Sidebar Skeleton */}
      <aside
        className={cn(
          "hidden md:flex h-screen shrink-0 flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#05070B] transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "w-0 border-r-0 opacity-0 pointer-events-none" : "w-64 opacity-100",
          className
        )}
      >
        <div className="w-64 h-full flex flex-col">
          <SidebarSkeletonContent />
        </div>
      </aside>

      {/* Mobile Drawer (Sheet) Skeleton */}
      {isOpenMobile && (
        <Sheet
          isOpen={isOpenMobile}
          onClose={onCloseMobile || (() => {})}
          side="left"
          showCloseButton={false}
        >
          <div className="h-full w-full">
            <SidebarSkeletonContent />
          </div>
        </Sheet>
      )}
    </>
  )
}

export { ChatSidebarSkeleton as SidebarSkeleton }
