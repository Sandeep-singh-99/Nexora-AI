"use client"

import React, { useState } from "react"
import { ZoomIn, ZoomOut, RotateCcw, Grid } from "lucide-react"

interface ArtifactSvgPreviewProps {
  svgContent: string
}

export function ArtifactSvgPreview({ svgContent }: ArtifactSvgPreviewProps) {
  const [zoom, setZoom] = useState<number>(1)
  const [showGrid, setShowGrid] = useState<boolean>(true)

  const handleZoomIn = () => setZoom((prev) => Math.min(3, prev + 0.2))
  const handleZoomOut = () => setZoom((prev) => Math.max(0.3, prev - 0.2))
  const handleReset = () => setZoom(1)

  return (
    <div className="flex flex-col h-full w-full bg-[#070A0F] text-slate-200 overflow-hidden select-none">
      {/* Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-white/10 shrink-0 text-xs">
        <div className="text-slate-400 font-mono text-[11px]">
          Zoom: {Math.round(zoom * 100)}%
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowGrid((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showGrid ? "bg-white/20 text-white" : "hover:bg-white/10 text-slate-400"
            }`}
            title="Toggle Transparency Checkerboard"
          >
            <Grid className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleReset}
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
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        className={`flex-1 overflow-auto p-8 flex items-center justify-center relative ${
          showGrid
            ? "bg-[linear-gradient(45deg,#111827_25%,transparent_25%),linear-gradient(-45deg,#111827_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#111827_75%),linear-gradient(-45deg,transparent_75%,#111827_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0]"
            : "bg-slate-950"
        }`}
      >
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          className="transition-transform duration-150 flex items-center justify-center max-w-full max-h-full drop-shadow-xl"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    </div>
  )
}
