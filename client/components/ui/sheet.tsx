"use client";

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  side?: "left" | "right"
  className?: string
  showCloseButton?: boolean
}

export function Sheet({
  isOpen,
  onClose,
  children,
  side = "right",
  className,
  showCloseButton = true,
}: SheetProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  const isLeft = side === "left"

  return (
    <div className={cn("fixed inset-0 z-50 flex", isLeft ? "justify-start" : "justify-end")}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Content */}
      <div
        className={cn(
          "relative z-50 h-full w-4/5 max-w-sm bg-slate-50 dark:bg-[#05070B] shadow-2xl transition-transform duration-300 flex flex-col justify-between animate-in",
          isLeft
            ? "border-r border-slate-200 dark:border-white/10 slide-in-from-left"
            : "border-l border-slate-200 dark:border-white/10 slide-in-from-right p-6",
          className
        )}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className={cn(
              "absolute top-4 z-50 rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer",
              isLeft ? "right-4" : "right-4"
            )}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <div className={cn("flex-1 h-full w-full", isLeft ? "" : "mt-8")}>{children}</div>
      </div>
    </div>
  )
}
