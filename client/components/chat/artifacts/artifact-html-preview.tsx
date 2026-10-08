"use client"

import React, { useState, useRef, useEffect } from "react"
import { prepareHtmlForSandboxedPreview } from "@/lib/artifacts"
import { RotateCw, ExternalLink, Monitor, Tablet, Smartphone } from "lucide-react"

interface ArtifactHtmlPreviewProps {
  html: string
}

type ViewportMode = "responsive" | "tablet" | "mobile"

export function ArtifactHtmlPreview({ html }: ArtifactHtmlPreviewProps) {
  const [viewport, setViewport] = useState<ViewportMode>("responsive")
  const [reloadKey, setReloadKey] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const preparedHtml = React.useMemo(() => {
    return prepareHtmlForSandboxedPreview(html)
  }, [html])

  const handleReload = () => {
    setIsLoading(true)
    setReloadKey((prev) => prev + 1)
  }

  const handleOpenExternal = () => {
    const blob = new Blob([preparedHtml], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
  }

  const getViewportWidth = () => {
    switch (viewport) {
      case "mobile":
        return "max-w-[375px] h-[667px] shadow-2xl rounded-2xl border-4 border-slate-700"
      case "tablet":
        return "max-w-[768px] h-[900px] shadow-2xl rounded-2xl border-4 border-slate-700"
      case "responsive":
      default:
        return "w-full h-full"
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 overflow-hidden">
      {/* Secondary Subheader for Viewport & Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-white/10 shrink-0 text-xs">
        {/* Device Viewport Switcher */}
        <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/5">
          <button
            onClick={() => setViewport("responsive")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              viewport === "responsive"
                ? "bg-emerald-500/20 text-emerald-400 font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Full / Responsive"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setViewport("tablet")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              viewport === "tablet"
                ? "bg-emerald-500/20 text-emerald-400 font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Tablet (768px)"
          >
            <Tablet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              viewport === "mobile"
                ? "bg-emerald-500/20 text-emerald-400 font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Mobile (375px)"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
            title="Reload preview"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reload</span>
          </button>
          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
            title="Open in new window"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pop Out</span>
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-2 relative">
        <div className={`transition-all duration-300 w-full flex items-center justify-center ${viewport !== "responsive" ? "my-auto" : "h-full"}`}>
          <iframe
            key={reloadKey}
            ref={iframeRef}
            srcDoc={preparedHtml}
            title="Artifact HTML Preview"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            onLoad={() => setIsLoading(false)}
            className={`bg-white transition-all ${getViewportWidth()}`}
          />
        </div>
      </div>
    </div>
  )
}
