"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-900 group-[.toaster]:text-slate-100 group-[.toaster]:border-slate-800 group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-slate-400",
          actionButton:
            "group-[.toast]:bg-emerald-500 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-800 group-[.toast]:text-slate-400",
          error:
            "group-[.toaster]:!bg-rose-950/90 group-[.toaster]:!border-rose-500/40 group-[.toaster]:!text-rose-100",
          success:
            "group-[.toaster]:!bg-emerald-950/90 group-[.toaster]:!border-emerald-500/40 group-[.toaster]:!text-emerald-100",
          warning:
            "group-[.toaster]:!bg-amber-950/90 group-[.toaster]:!border-amber-500/40 group-[.toaster]:!text-amber-100",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
