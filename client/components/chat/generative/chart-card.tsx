"use client"

import React from "react"
import { TrendingUp, ArrowUpRight, Calendar } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface ChartCardDataItem {
  month?: string
  name?: string
  label?: string
  amount?: number
  value?: number
}

interface ChartCardProps {
  title?: string
  value?: string
  change?: string
  period?: string
  data?: ChartCardDataItem[]
}

const DEFAULT_DATA: ChartCardDataItem[] = [
  { month: "Apr", amount: 12400 },
  { month: "May", amount: 15800 },
  { month: "Jun", amount: 18200 },
  { month: "Jul", amount: 20100 },
  { month: "Aug", amount: 22400 },
  { month: "Sep", amount: 24580 },
]

export function ChartCard({
  title = "Monthly Revenue",
  value = "$24,580",
  change = "+18.4%",
  period = "vs last month",
  data = DEFAULT_DATA,
}: ChartCardProps) {
  const safeData = data && data.length > 0 ? data : DEFAULT_DATA

  const maxAmount = Math.max(
    ...safeData.map((d) => Number(d.amount ?? d.value ?? 0)),
    1
  )

  return (
    <Card className="w-full max-w-lg bg-[#0D131D]/90 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden my-3">
      <CardHeader className="pb-2 border-b border-white/5 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4" />
            </span>
            <CardTitle className="text-base font-semibold text-slate-100">{title}</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Updated recently
          </CardDescription>
        </div>
        <Badge variant="success" className="gap-1 px-2.5 py-1 text-xs">
          <ArrowUpRight className="h-3 w-3" />
          {change}
        </Badge>
      </CardHeader>

      <CardContent className="p-5">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
          <span className="text-xs font-medium text-slate-400">{period}</span>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4 pb-2">
          <div className="h-36 flex items-end justify-between gap-2 px-2">
            {safeData.map((item, idx) => {
              const val = Number(item.amount ?? item.value ?? 0)
              const label = item.month || item.name || item.label || `Item ${idx + 1}`
              const heightPercent = Math.min(100, Math.max(8, Math.round((val / maxAmount) * 100)))
              const isLast = idx === safeData.length - 1

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/15 px-2 py-0.5 rounded text-[10px] text-emerald-300 font-mono pointer-events-none whitespace-nowrap shadow-lg z-10">
                    ${val.toLocaleString()}
                  </div>

                  <div className="w-full bg-white/[0.04] rounded-t-md h-28 flex items-end overflow-hidden p-0.5">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-500 ${
                        isLast
                          ? "bg-emerald-500 shadow-lg shadow-emerald-950/50"
                          : "bg-emerald-500/30 group-hover:bg-emerald-500/50"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 truncate max-w-[75px] text-center" title={label}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
