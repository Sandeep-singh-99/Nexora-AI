"use client"

import React from "react"
import { GenerativeUIResponse } from "@/types/chat"
import { ChartCard } from "./generative/chart-card"
import { DataTable } from "./generative/data-table"
import { InfoCard } from "./generative/info-card"
import { SearchResults } from "./generative/search-results"
import { ProjectCard } from "./generative/project-card"
import { TimeCard } from "./generative/time-card"
import { MathCard } from "./generative/math-card"
import { AlertCircle } from "lucide-react"

// Explicit safe component registry map
const componentRegistry: Record<string, React.ComponentType<any>> = {
  chart: ChartCard,
  table: DataTable,
  card: InfoCard,
  search_results: SearchResults,
  project: ProjectCard,
  time: TimeCard,
  time_card: TimeCard,
  math: MathCard,
  math_card: MathCard,
}

interface GenerativeUIRendererProps {
  ui: GenerativeUIResponse
}

export function GenerativeUIRenderer({ ui }: GenerativeUIRendererProps) {
  if (!ui || !ui.type) return null

  const TargetComponent = componentRegistry[ui.type.toLowerCase()]

  if (!TargetComponent) {
    return (
      <div className="my-2 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Unrecognized Generative UI component type: <code className="font-mono">{ui.type}</code></span>
      </div>
    )
  }

  return (
    <div className="mt-2 mb-3">
      <TargetComponent {...(ui.props || {})} />
    </div>
  )
}
