"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuContextType {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  triggerRef: React.RefObject<HTMLDivElement | null>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | null>(null)

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLDivElement>(null)

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block text-left" data-state={open ? "open" : "closed"}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
}) {
  const context = React.useContext(DropdownMenuContext)
  if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu")

  return (
    <div
      ref={context.triggerRef}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
        context.setOpen((prev) => !prev)
      }}
      className={cn("cursor-pointer inline-flex items-center", className)}
    >
      {children}
    </div>
  )
}

export function DropdownMenuContent({
  children,
  align = "right",
  className,
}: {
  children: React.ReactNode
  align?: "left" | "right" | "center"
  className?: string
}) {
  const context = React.useContext(DropdownMenuContext)
  const ref = React.useRef<HTMLDivElement>(null)

  if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu")

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        !context?.triggerRef.current?.contains(event.target as Node)
      ) {
        context?.setOpen(false)
      }
    }
    if (context.open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [context.open, context])

  if (!context.open) return null

  const alignClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  }

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute top-full mt-2 z-50 min-w-[12rem] rounded-xl border border-white/10 bg-[#0D131D] p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150",
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  disabled,
}: {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  className?: string
  disabled?: boolean
}) {
  const context = React.useContext(DropdownMenuContext)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (disabled) return
        onClick?.(e)
        context?.setOpen(false)
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        className
      )}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-white/10" />
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider", className)}>{children}</div>
}
