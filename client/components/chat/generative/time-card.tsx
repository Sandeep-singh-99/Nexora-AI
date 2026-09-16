"use client"

import React, { useState, useEffect } from "react"
import { Clock, Globe, Calendar, Compass, Sparkles } from "lucide-react"

interface TimeCardProps {
  location?: string
  flag?: string
  time?: string
  date?: string
  timezone?: string
  offset?: string
}

export function TimeCard({
  location = "Tokyo, Japan",
  flag = "🇯🇵",
  time = "Wednesday, September 16, 2026 at 04:53:23 PM JST",
  date = "Wednesday, September 16, 2026",
  timezone = "Asia/Tokyo",
  offset = "+09:00 (JST)",
}: TimeCardProps) {
  const [digitalTime, setDigitalTime] = useState("")
  const [digitalDate, setDigitalDate] = useState("")

  useEffect(() => {
    const update = () => {
      try {
        const now = new Date()
        const tStr = now.toLocaleTimeString("en-US", {
          timeZone: timezone,
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        const dStr = now.toLocaleDateString("en-US", {
          timeZone: timezone,
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        setDigitalTime(tStr)
        setDigitalDate(dStr)
      } catch {
        setDigitalTime(time)
        setDigitalDate(date)
      }
    }

    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [timezone, time, date])

  // Prevent title duplication like "Asia/Tokyo (Asia/Tokyo)"
  let displayTitle = location
  if (displayTitle.toLowerCase().includes("asia/") || displayTitle.toLowerCase().includes("europe/") || displayTitle.toLowerCase().includes("america/")) {
    const city = displayTitle.split("/")[1]?.replace("_", " ") || displayTitle
    displayTitle = city
  }

  return (
    <div className="w-full max-w-md bg-gradient-to-br from-[#0D131D]/95 via-[#0A0F18]/90 to-[#070B12]/95 border border-white/10 shadow-2xl backdrop-blur-2xl rounded-2xl p-4.5 my-3 relative overflow-hidden transition-all duration-300 hover:border-emerald-500/40 hover:shadow-emerald-500/10">
      {/* Background Glows */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="text-xl p-1.5 rounded-xl bg-white/5 border border-white/10 shadow-inner flex items-center justify-center">
            {flag}
          </span>
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 tracking-tight">
              <span>{displayTitle}</span>
              <span className="text-xs font-normal text-slate-400 font-mono">({timezone})</span>
            </h4>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
              <Globe className="h-3 w-3 text-emerald-400" />
              <span>World Clock & Timezone</span>
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium font-mono shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Live</span>
        </div>
      </div>

      {/* Main Digital Clock Card */}
      <div className="my-3 py-3.5 px-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-center shadow-inner relative">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-medium">
          <Clock className="h-3.5 w-3.5 text-emerald-400" />
          <span>Current Local Time</span>
        </div>
        <div className="text-3xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 drop-shadow-sm py-0.5">
          {digitalTime || time}
        </div>
        <div className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mt-1">
          <Calendar className="h-3.5 w-3.5 text-teal-400" />
          <span>{digitalDate || date}</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="py-2 px-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">IANA Timezone</span>
          <span className="font-semibold text-slate-200 font-mono text-[11px] flex items-center gap-1.5 mt-1">
            <Compass className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{timezone}</span>
          </span>
        </div>
        <div className="py-2 px-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">UTC Offset</span>
          <span className="font-semibold text-emerald-300 font-mono text-[11px] flex items-center gap-1.5 mt-1">
            <Sparkles className="h-3.5 w-3.5 text-teal-400 shrink-0" />
            <span>{offset}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
