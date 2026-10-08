"use client"

import React, { useEffect, useState, useRef } from "react"
import mermaid from "mermaid"
import { ZoomIn, ZoomOut, RotateCcw, Download, AlertCircle } from "lucide-react"

interface ArtifactMermaidPreviewProps {
  chart: string
}

export function ArtifactMermaidPreview({ chart }: ArtifactMermaidPreviewProps) {
  const [svgContent, setSvgContent] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState<number>(1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    const renderChart = async () => {
      try {
        setError(null)
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "monospace",
        })

        const id = `mermaid-${Date.now()}`
        const { svg } = await mermaid.render(id, chart)
        if (isMounted) {
          setSvgContent(svg)
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Mermaid rendering failed:", err)
          setError(err?.message || "Failed to render Mermaid diagram.")
        }
      }
    }

    renderChart()

    return () => {
      isMounted = false
    }
  }, [chart])

  const handleZoomIn = () => setZoom((prev) => Math.min(2.5, prev + 0.15))
  const handleZoomOut = () => setZoom((prev) => Math.max(0.4, prev - 0.15))
  const handleResetZoom = () => setZoom(1)

  const handleDownloadSvg = () => {
    if (!svgContent) return
    const blob = new Blob([svgContent], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `diagram-${Date.now()}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#070A0F] text-slate-200 overflow-hidden select-none">
      {/* Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-white/10 shrink-0 text-xs">
        <div className="text-slate-400 font-mono text-[11px]">
          Zoom: {Math.round(zoom * 100)}%
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button
            onClick={handleDownloadSvg}
            disabled={!svgContent}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer disabled:opacity-50"
            title="Download Diagram as SVG"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export SVG</span>
          </button>
        </div>
      </div>

      {/* Diagram Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-8 flex items-center justify-center relative scrollbar-thin scrollbar-thumb-white/10"
      >
        {error ? (
          <div className="max-w-md p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Mermaid Syntax Warning</p>
              <p className="opacity-80 break-words">{error}</p>
            </div>
          </div>
        ) : svgContent ? (
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            className="transition-transform duration-150 flex items-center justify-center w-full h-full max-w-full max-h-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="text-slate-500 text-xs animate-pulse">
            Rendering diagram...
          </div>
        )}
      </div>
    </div>
  )
}
