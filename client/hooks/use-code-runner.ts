"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  codeSandbox,
  isExecutableLanguage,
  normalizeLanguage,
  stripMarkdownCodeFences,
} from "@/lib/sandbox/sandbox-runner"
import {
  ExecutionLogEntry,
  ExecutionResult,
  ExecutionRuntimeMode,
  ExecutionStatus,
} from "@/types/sandbox"

export interface UseCodeRunnerOptions {
  initialCode?: string
  language?: string
  defaultMode?: ExecutionRuntimeMode
}

export function useCodeRunner({
  initialCode = "",
  language = "python",
  defaultMode = "client",
}: UseCodeRunnerOptions = {}) {
  const [status, setStatus] = useState<ExecutionStatus>("idle")
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [runtimeMode, setRuntimeMode] = useState<ExecutionRuntimeMode>(defaultMode)
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([])
  const [executionTimeMs, setExecutionTimeMs] = useState<number>(0)
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const isExecutable = isExecutableLanguage(language)
  const normalizedLang = normalizeLanguage(language)

  const isRunning = status === "running" || status === "initializing"

  const run = useCallback(
    async (codeToRun?: string) => {
      const raw = codeToRun !== undefined ? codeToRun : initialCode
      const targetCode = stripMarkdownCodeFences(raw)
      if (!targetCode.trim()) return

      setIsOpen(true)
      setStatus("initializing")
      setStatusMessage("Preparing runtime environment...")
      setLogs([])
      setExecutionTimeMs(0)

      try {
        const res = await codeSandbox.execute(
          targetCode,
          language,
          { mode: runtimeMode },
          (entry) => {
            setLogs((prev) => [...prev, entry])
          },
          (newStatus, msg) => {
            setStatus(newStatus)
            if (msg) setStatusMessage(msg)
          }
        )

        setLastResult(res)
        setExecutionTimeMs(res.executionTimeMs)
        setStatus(res.success ? "success" : "error")
        setStatusMessage(
          res.success
            ? `Execution completed in ${res.executionTimeMs}ms`
            : res.error || "Execution error"
        )
      } catch (err: any) {
        setStatus("error")
        setStatusMessage(err?.message || "Execution failed")
      }
    },
    [initialCode, language, runtimeMode]
  )

  const stop = useCallback(() => {
    codeSandbox.stopActiveExecution()
    setStatus("idle")
    setStatusMessage("Execution stopped by user")
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
    setStatus("idle")
    setStatusMessage("")
    setLastResult(null)
  }, [])

  return {
    status,
    statusMessage,
    runtimeMode,
    setRuntimeMode,
    logs,
    executionTimeMs,
    lastResult,
    isRunning,
    isExecutable,
    normalizedLang,
    isOpen,
    setIsOpen,
    run,
    stop,
    clearLogs,
  }
}
