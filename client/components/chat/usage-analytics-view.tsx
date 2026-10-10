"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Zap,
  RotateCw,
  Cpu,
  Layers,
  Calendar,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  PieChart,
  Download,
  Search,
  FileText,
  DollarSign,
  Filter,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAppearance } from "@/components/providers/theme-provider"
import { fetchTokenAnalyticsApi } from "@/lib/api/chat"
import {
  TokenAnalyticsData,
  TimelinePoint,
  ProviderStat,
  ModelStat,
  TokenActivityItem,
} from "@/types/chat"
import { cn } from "@/lib/utils"

export type TimeframeOption = "day" | "week" | "month" | "year" | "all"

const TIMEFRAMES: { id: TimeframeOption; label: string; periodLabel: string; description: string }[] = [
  { id: "day", label: "24h", periodLabel: "Last 24 Hours", description: "Hourly activity" },
  { id: "week", label: "7d", periodLabel: "Last 7 Days", description: "Daily breakdown" },
  { id: "month", label: "30d", periodLabel: "Last 30 Days", description: "30-day view" },
  { id: "year", label: "1y", periodLabel: "Last 12 Months", description: "Monthly trend" },
  { id: "all", label: "All", periodLabel: "All Time", description: "Lifetime telemetry" },
]

function formatTokenCount(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M"
  }
  if (num >= 10_000) {
    return (num / 1_000).toFixed(1) + "k"
  }
  return (num || 0).toLocaleString()
}

function formatCurrency(amount: number): string {
  if (!amount || amount === 0) return "$0.00"
  if (amount < 0.01) return `< $0.01`
  return `$${amount.toFixed(2)}`
}

function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

function getProviderBadgeConfig(provider: string) {
  const p = (provider || "").toLowerCase()
  if (p.includes("groq")) {
    return {
      name: "Groq",
      bg: "bg-orange-500/10 dark:bg-orange-500/15",
      border: "border-orange-500/30",
      text: "text-orange-600 dark:text-orange-400",
      bar: "bg-orange-500",
      indicator: "bg-orange-500",
    }
  }
  if (p.includes("gemini")) {
    return {
      name: "Google Gemini",
      bg: "bg-blue-500/10 dark:bg-blue-500/15",
      border: "border-blue-500/30",
      text: "text-blue-600 dark:text-blue-400",
      bar: "bg-blue-500",
      indicator: "bg-blue-500",
    }
  }
  if (p.includes("openai") || p.includes("gpt")) {
    return {
      name: "OpenAI",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      border: "border-emerald-500/30",
      text: "text-emerald-600 dark:text-emerald-400",
      bar: "bg-emerald-500",
      indicator: "bg-emerald-500",
    }
  }
  if (p.includes("anthropic") || p.includes("claude")) {
    return {
      name: "Anthropic",
      bg: "bg-amber-500/10 dark:bg-amber-500/15",
      border: "border-amber-500/30",
      text: "text-amber-600 dark:text-amber-400",
      bar: "bg-amber-500",
      indicator: "bg-amber-500",
    }
  }
  if (p.includes("openrouter")) {
    return {
      name: "OpenRouter",
      bg: "bg-violet-500/10 dark:bg-violet-500/15",
      border: "border-violet-500/30",
      text: "text-violet-600 dark:text-violet-400",
      bar: "bg-violet-500",
      indicator: "bg-violet-500",
    }
  }
  if (p.includes("deepseek")) {
    return {
      name: "DeepSeek",
      bg: "bg-cyan-500/10 dark:bg-cyan-500/15",
      border: "border-cyan-500/30",
      text: "text-cyan-600 dark:text-cyan-400",
      bar: "bg-cyan-500",
      indicator: "bg-cyan-500",
    }
  }
  return {
    name: provider ? provider.toUpperCase() : "AI SERVICE",
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    border: "border-purple-500/30",
    text: "text-purple-600 dark:text-purple-400",
    bar: "bg-purple-500",
    indicator: "bg-purple-500",
  }
}

interface UsageAnalyticsViewProps {
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export function UsageAnalyticsView({
  isFullscreen = false,
  onToggleFullscreen,
}: UsageAnalyticsViewProps) {
  const { accentConfig } = useAppearance()
  const [timeframe, setTimeframe] = useState<TimeframeOption>("week")
  const [chartMetric, setChartMetric] = useState<"tokens" | "requests">("tokens")
  const [data, setData] = useState<TokenAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<TimelinePoint | null>(null)
  const [searchModel, setSearchModel] = useState<string>("")
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const loadAnalytics = async (selected: TimeframeOption) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetchTokenAnalyticsApi(selected)
      setData(res)
      setLastRefreshed(new Date())
    } catch (err: any) {
      console.error("Failed to load token analytics:", err)
      setError("Unable to retrieve usage analytics from database. Please verify network or reload.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics(timeframe)
  }, [timeframe])

  const maxTimelineValue = useMemo(() => {
    if (!data?.timeline || data.timeline.length === 0) return 1
    const values = data.timeline.map((t) =>
      chartMetric === "tokens" ? t.total_tokens : t.requests
    )
    const maxVal = Math.max(...values)
    return maxVal > 0 ? maxVal : 1
  }, [data, chartMetric])

  const peakTimelinePoint = useMemo(() => {
    if (!data?.timeline || data.timeline.length === 0) return null
    return data.timeline.reduce((max, cur) => (cur.total_tokens > max.total_tokens ? cur : max), data.timeline[0])
  }, [data])

  const activePeriod = TIMEFRAMES.find((t) => t.id === timeframe)

  // Smart label interval to avoid collision
  const labelInterval = useMemo(() => {
    if (!data?.timeline) return 1
    const count = data.timeline.length
    if (count <= 8) return 1
    if (count <= 16) return 2
    if (count <= 25) return 4
    return 6
  }, [data])

  // Filtered models
  const filteredModels = useMemo(() => {
    if (!data?.models) return []
    if (!searchModel.trim()) return data.models
    const q = searchModel.toLowerCase()
    return data.models.filter(
      (m) => m.model.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q)
    )
  }, [data, searchModel])

  // Export JSON
  const handleExportJSON = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `nexora-ai-analytics-${timeframe}-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!data) return
    const headers = [
      "Timestamp",
      "Conversation",
      "Role",
      "Provider",
      "Model",
      "KeyType",
      "PromptTokens",
      "CompletionTokens",
      "TotalTokens",
    ]
    const rows = (data.recent_activity || []).map((a) => [
      `"${a.created_at}"`,
      `"${(a.conversation_title || "Chat").replace(/"/g, '""')}"`,
      `"${a.role}"`,
      `"${a.provider}"`,
      `"${a.model}"`,
      `"${a.is_custom_key ? "BYOK" : "Prebuilt"}"`,
      a.prompt_tokens ?? 0,
      a.completion_tokens ?? 0,
      a.tokens_used,
    ])
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `nexora-ai-activity-${timeframe}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 animate-in fade-in-0 duration-150 pb-6 text-slate-800 dark:text-slate-200">
      {/* Executive Header Bar (Sticky at top when scrolling) */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#070A10]/95 backdrop-blur-md py-3 border-b border-slate-200/80 dark:border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Token Usage & AI Telemetry
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    Database Live
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time token consumption, BYOK savings, model distribution, and database audit trail.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Timeframe Pill Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-white/[0.04] p-1 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            {TIMEFRAMES.map((tf) => {
              const isSelected = timeframe === tf.id
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeframe(tf.id)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                    isSelected
                      ? cn("bg-white dark:bg-[#0A0F18] shadow-xs text-slate-900 dark:text-white font-bold", accentConfig.activeText)
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
                  )}
                  title={tf.description}
                >
                  {tf.label}
                </button>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadAnalytics(timeframe)}
              disabled={isLoading}
              className="h-8 px-2.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer shadow-2xs group"
              title={`Last refreshed at ${lastRefreshed.toLocaleTimeString()}`}
            >
              <RotateCw
                className={cn(
                  "h-3.5 w-3.5 mr-1.5 transition-colors",
                  isLoading
                    ? "animate-spin text-emerald-500"
                    : "text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300"
                )}
              />
              <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                Refresh
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!data || !data.recent_activity || data.recent_activity.length === 0}
              className="h-8 px-2.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer shadow-2xs group"
              title="Export recent activity as CSV"
            >
              <Download className="h-3.5 w-3.5 mr-1.5 text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors" />
              <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                Export CSV
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportJSON}
              disabled={!data}
              className="h-8 px-2.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer shadow-2xs group"
              title="Export complete telemetry payload as JSON"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors" />
              <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                JSON
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadAnalytics(timeframe)}
            className="h-7 text-xs border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
          >
            Retry Sync
          </Button>
        </div>
      )}

      {/* 4 Hero KPI Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Tokens */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-4 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-5 dark:opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
            <Zap className="h-24 w-24 text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Tokens</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <Zap className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLoading ? "—" : (data?.total_tokens || 0).toLocaleString()}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Prompt / Input:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {(data?.prompt_tokens || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Completion / Output:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {(data?.completion_tokens || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Prebuilt Keys (System Default) */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-4 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between gap-2 text-slate-500 dark:text-slate-400 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider truncate">Prebuilt Keys</span>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10 font-mono whitespace-nowrap shrink-0"
              >
                System Default
              </Badge>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLoading ? "—" : (data?.prebuilt_tokens || 0).toLocaleString()}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] font-mono whitespace-nowrap">
            <span className="text-teal-600 dark:text-teal-400 font-semibold">
              {data?.prebuilt_percentage || 0}% share
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {data?.prebuilt_requests || 0} {data?.prebuilt_requests === 1 ? "query" : "queries"}
            </span>
          </div>
        </div>

        {/* Card 3: Custom Keys (BYOK) */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-4 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between gap-2 text-slate-500 dark:text-slate-400 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider truncate">Custom Keys</span>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10 font-mono whitespace-nowrap shrink-0"
              >
                BYOK
              </Badge>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLoading ? "—" : (data?.custom_tokens || 0).toLocaleString()}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] font-mono whitespace-nowrap">
            <span className="text-purple-600 dark:text-purple-400 font-semibold">
              {data?.custom_percentage || 0}% share
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {data?.custom_requests || 0} {data?.custom_requests === 1 ? "query" : "queries"}
            </span>
          </div>
        </div>

        {/* Card 3: Estimated API Spend / Savings */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-4 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Estimated Value</span>
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLoading ? "—" : formatCurrency(data?.estimated_cost_usd || 0)}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Pricing Tier:</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold font-mono">
              {(data?.custom_tokens || 0) > 0 ? "BYOK Direct Quota" : "Free Cloud Included"}
            </span>
          </div>
        </div>

        {/* Card 4: Workload & Efficiency */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] p-4 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Query Efficiency</span>
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                <Activity className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLoading ? "—" : `${data?.avg_tokens_per_request || 0}`}
              <span className="text-xs font-normal text-slate-400 ml-1">tok / req</span>
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">{data?.total_requests || 0} total requests</span>
            {data?.top_provider && (
              <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                {data.top_provider}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Visual Prebuilt vs Custom Ratio Distribution */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Key Distribution Ratio
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {data?.total_tokens ? `${data.total_tokens.toLocaleString()} tokens accounted` : "Awaiting queries"}
          </span>
        </div>

        {/* Multi-segment ratio bar */}
        <div className="w-full h-2.5 bg-slate-200/70 dark:bg-white/10 rounded-full overflow-hidden flex shadow-inner">
          {data?.total_tokens && data.total_tokens > 0 ? (
            <>
              <div
                style={{ width: `${data.prebuilt_percentage}%` }}
                className="h-full bg-teal-500 transition-all duration-500"
                title={`Prebuilt System: ${data.prebuilt_tokens.toLocaleString()} tokens (${data.prebuilt_percentage}%)`}
              />
              <div
                style={{ width: `${data.custom_percentage}%` }}
                className="h-full bg-purple-500 transition-all duration-500"
                title={`Custom BYOK: ${data.custom_tokens.toLocaleString()} tokens (${data.custom_percentage}%)`}
              />
            </>
          ) : (
            <div className="w-full h-full bg-slate-200 dark:bg-white/5" />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px] whitespace-nowrap">Prebuilt System Key</span>
            </div>
            <div className="font-mono text-[11px] whitespace-nowrap pl-2">
              <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                {(data?.prebuilt_tokens || 0).toLocaleString()}
              </span>
              <span className="text-teal-600 dark:text-teal-400 font-semibold">
                ({data?.prebuilt_percentage || 0}%)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px] whitespace-nowrap">Custom BYOK Key</span>
            </div>
            <div className="font-mono text-[11px] whitespace-nowrap pl-2">
              <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                {(data?.custom_tokens || 0).toLocaleString()}
              </span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">
                ({data?.custom_percentage || 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Interactive Activity Timeline Chart */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Token Activity Flow ({activePeriod?.periodLabel})
              </h4>
              {peakTimelinePoint && peakTimelinePoint.total_tokens > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono">
                  Peak: {peakTimelinePoint.total_tokens.toLocaleString()} tokens
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Hover over columns to inspect interval breakdown between Prebuilt system tokens and Custom BYOK keys.
            </p>
          </div>

          {/* Metric Selector & Dynamic Hover Tooltip */}
          <div className="flex items-center gap-3">
            {hoveredPoint ? (
              <div className="text-xs bg-white dark:bg-[#0A0F18] border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-xl shadow-xs font-mono flex items-center gap-3">
                <span className="font-bold text-slate-900 dark:text-white">{hoveredPoint.label}</span>
                <span className="text-teal-600 dark:text-teal-400">
                  Prebuilt: {hoveredPoint.prebuilt_tokens.toLocaleString()}
                </span>
                <span className="text-purple-600 dark:text-purple-400">
                  BYOK: {hoveredPoint.custom_tokens.toLocaleString()}
                </span>
                <span className="text-slate-400">
                  ({hoveredPoint.requests} {hoveredPoint.requests === 1 ? "query" : "queries"})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-xs bg-teal-500" /> Prebuilt Keys
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-xs bg-purple-500" /> BYOK Keys
                </span>
              </div>
            )}

            <div className="flex items-center bg-slate-200/60 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200/80 dark:border-white/5">
              <button
                type="button"
                onClick={() => setChartMetric("tokens")}
                className={cn(
                  "px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
                  chartMetric === "tokens"
                    ? "bg-white dark:bg-[#0A0F18] text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                Tokens
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("requests")}
                className={cn(
                  "px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
                  chartMetric === "requests"
                    ? "bg-white dark:bg-[#0A0F18] text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                Requests
              </button>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="pt-2">
          {isLoading ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
              <RotateCw className="h-4 w-4 animate-spin mr-2 text-emerald-500" /> Syncing database metrics...
            </div>
          ) : !data?.timeline || data.timeline.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4">
              <Clock className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No activity recorded for this period</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                Start a chat session or ask questions to log real-time token telemetry into the database.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Bars container */}
              <div className="h-40 flex items-end gap-1 sm:gap-1.5 justify-between px-1 border-b border-slate-200 dark:border-white/10 pb-1">
                {data.timeline.map((point, idx) => {
                  const val = chartMetric === "tokens" ? point.total_tokens : point.requests
                  const heightPct = val > 0 ? Math.max(8, Math.round((val / maxTimelineValue) * 100)) : 3
                  const totalTok = point.total_tokens
                  const prebuiltH = totalTok > 0 ? (point.prebuilt_tokens / totalTok) * 100 : 0
                  const customH = totalTok > 0 ? (point.custom_tokens / totalTok) * 100 : 0

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Bar */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={cn(
                          "w-full max-w-[24px] rounded-t-sm flex flex-col justify-end overflow-hidden transition-all duration-150",
                          val === 0
                            ? "bg-slate-200/60 dark:bg-white/[0.04]"
                            : "group-hover:scale-y-105 group-hover:brightness-110 shadow-xs ring-1 ring-white/10"
                        )}
                      >
                        {chartMetric === "tokens" ? (
                          <>
                            {customH > 0 && (
                              <div style={{ height: `${customH}%` }} className="w-full bg-purple-500" />
                            )}
                            {prebuiltH > 0 && (
                              <div style={{ height: `${prebuiltH}%` }} className="w-full bg-teal-500" />
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full bg-emerald-500" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* X-Axis Smart Labels */}
              <div className="flex justify-between px-1 text-[10px] text-slate-400 font-mono select-none">
                {data.timeline.map((point, idx) => {
                  const isVisible = idx === 0 || idx === data.timeline.length - 1 || idx % labelInterval === 0
                  return (
                    <div key={idx} className="flex-1 text-center truncate">
                      {isVisible ? (
                        <span>
                          {timeframe === "day"
                            ? point.label.split(":")[0] + "h"
                            : point.label.split(" ")[0]}
                        </span>
                      ) : (
                        <span className="opacity-0">·</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Provider Ecosystem and Model Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Model Providers Ecosystem */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Providers Breakdown
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {data?.providers?.length || 0} active {data?.providers?.length === 1 ? "provider" : "providers"}
            </span>
          </div>

          <div className="space-y-2">
            {!data?.providers || data.providers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No provider activity recorded in this period.
              </div>
            ) : (
              data.providers.map((p) => {
                const cfg = getProviderBadgeConfig(p.provider)
                return (
                  <div
                    key={p.provider}
                    className="p-3 rounded-xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-white/[0.02] space-y-2 transition-all hover:border-slate-300 dark:hover:border-white/15"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] uppercase font-mono font-bold px-2 py-0.5", cfg.bg, cfg.border, cfg.text)}
                        >
                          {cfg.name}
                        </Badge>
                        <span className="text-slate-400 text-[11px] font-mono">
                          {p.requests} {p.requests === 1 ? "query" : "queries"}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white font-mono text-[11px]">
                        {p.tokens.toLocaleString()} tokens ({p.percentage}%)
                      </span>
                    </div>

                    {/* Progress indicator */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${p.percentage}%` }}
                        className={cn("h-full rounded-full transition-all duration-300", cfg.bar)}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Model Intelligence Breakdown */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Specific Models
              </h4>
            </div>
            <div className="w-36">
              <Input
                type="text"
                placeholder="Filter models..."
                value={searchModel}
                onChange={(e) => setSearchModel(e.target.value)}
                className="h-7 text-[11px] rounded-lg bg-white dark:bg-white/5"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {filteredModels.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {searchModel ? "No models match your filter." : "No model activity recorded."}
              </div>
            ) : (
              filteredModels.map((m) => (
                <div
                  key={m.model}
                  className="p-3 rounded-xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-white/[0.02] space-y-2 transition-all hover:border-slate-300 dark:hover:border-white/15"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">
                        {m.model}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-white/5 rounded shrink-0">
                        {m.provider}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono text-[11px] shrink-0">
                      {m.tokens.toLocaleString()} ({m.percentage}%)
                    </span>
                  </div>

                  {/* Progress indicator */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${m.percentage}%` }}
                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Database Query Audit Trail */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Telemetry Audit Trail
              </h4>
              <p className="text-[11px] text-slate-400">
                Recent AI queries saved in PostgreSQL with exact token breakdown.
              </p>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {data?.recent_activity?.length || 0} logged transactions
          </span>
        </div>

        {!data?.recent_activity || data.recent_activity.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No queries logged yet. Start chatting to view exact prompt & completion metrics here.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-white/5 text-slate-400 text-[10px] uppercase">
                  <th className="pb-2 font-medium">Timestamp</th>
                  <th className="pb-2 font-medium">Conversation</th>
                  <th className="pb-2 font-medium">Provider & Model</th>
                  <th className="pb-2 font-medium">Key Type</th>
                  <th className="pb-2 font-medium text-right">Prompt</th>
                  <th className="pb-2 font-medium text-right">Completion</th>
                  <th className="pb-2 font-medium text-right">Total Tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {data.recent_activity.map((item) => {
                  const cfg = getProviderBadgeConfig(item.provider)
                  return (
                    <tr key={item.id} className="hover:bg-white/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        {formatDateDisplay(item.created_at)}
                      </td>
                      <td className="py-2.5 text-slate-800 dark:text-slate-200 font-sans font-medium text-xs max-w-[160px] truncate">
                        {item.conversation_title || "Chat Session"}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={cn("text-[9px] uppercase px-1.5 py-0", cfg.bg, cfg.border, cfg.text)}>
                            {cfg.name}
                          </Badge>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[120px]">
                            {item.model}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        {item.is_custom_key ? (
                          <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10">
                            BYOK
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10">
                            System
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">
                        {(item.prompt_tokens ?? 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">
                        {(item.completion_tokens ?? 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                        {(item.tokens_used || 0).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
