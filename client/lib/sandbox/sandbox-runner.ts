import { api } from "@/lib/api/axios"
import {
  ExecutionLogEntry,
  ExecutionResult,
  ExecutionStatus,
  RunCodeOptions,
  SupportedSandboxLanguage,
} from "@/types/sandbox"

/**
 * Checks if a language identifier is executable in our sandboxes.
 */
export function isExecutableLanguage(lang?: string): boolean {
  if (!lang) return false
  const l = lang.toLowerCase().trim()
  return ["python", "py", "javascript", "js", "typescript", "ts", "json"].includes(l)
}

/**
 * Normalizes language string to either 'python' or 'javascript'.
 */
export function normalizeLanguage(lang?: string): "python" | "javascript" {
  const l = (lang || "").toLowerCase().trim()
  if (l === "python" || l === "py") return "python"
  return "javascript"
}

/**
 * Strips markdown code block fences (e.g. ```python ... ```) if present.
 */
export function stripMarkdownCodeFences(rawCode: string): string {
  if (!rawCode) return ""
  let code = rawCode.trim()

  if (code.startsWith("```")) {
    const lines = code.split("\n")
    if (lines.length > 0 && lines[0].trim().startsWith("```")) {
      lines.shift()
    }
    if (lines.length > 0 && lines[lines.length - 1].trim().startsWith("```")) {
      lines.pop()
    }
    code = lines.join("\n").trim()
  }

  return code
}

export type LogCallback = (entry: ExecutionLogEntry) => void
export type StatusCallback = (status: ExecutionStatus, message?: string) => void

class CodeSandboxEngine {
  private pyodideWorker: Worker | null = null
  private jsWorker: Worker | null = null
  private activeExecutionId: string | null = null
  private executionTimeoutTimer: any = null

  /**
   * Initializes or gets the Pyodide Web Worker.
   */
  private getPyodideWorker(): Worker {
    if (this.pyodideWorker) return this.pyodideWorker

    try {
      this.pyodideWorker = new Worker("/workers/pyodide-worker.js")
    } catch (e) {
      console.warn("Failed to create worker from /workers/pyodide-worker.js, trying fallback", e)
      throw new Error("Unable to instantiate Pyodide Web Worker in current browser environment.")
    }

    return this.pyodideWorker
  }

  /**
   * Initializes or gets the JavaScript Web Worker.
   */
  private getJsWorker(): Worker {
    if (this.jsWorker) return this.jsWorker

    try {
      this.jsWorker = new Worker("/workers/js-worker.js")
    } catch (e) {
      console.warn("Failed to create worker from /workers/js-worker.js", e)
      throw new Error("Unable to instantiate JavaScript Web Worker.")
    }

    return this.jsWorker
  }

  /**
   * Terminate active execution if user clicks Stop or if timeout occurs.
   */
  public stopActiveExecution(): void {
    if (this.executionTimeoutTimer) {
      clearTimeout(this.executionTimeoutTimer)
      this.executionTimeoutTimer = null
    }

    if (this.pyodideWorker) {
      this.pyodideWorker.terminate()
      this.pyodideWorker = null
    }

    if (this.jsWorker) {
      this.jsWorker.terminate()
      this.jsWorker = null
    }

    this.activeExecutionId = null
  }

  /**
   * Executes code using Server-side isolated sandbox endpoint.
   */
  private async executeOnServer(
    code: string,
    language: string,
    timeoutMs: number,
    onLog?: LogCallback,
    onStatus?: StatusCallback
  ): Promise<ExecutionResult> {
    onStatus?.("running", "Executing on isolated server runner...")
    onLog?.({
      id: `sys-${Date.now()}`,
      type: "system",
      content: `[Server Sandbox] Dispatching to backend isolated runner (${Math.round(timeoutMs / 1000)}s timeout)...`,
      timestamp: Date.now(),
    })

    const timeoutSec = Math.max(1, Math.min(30, Math.round(timeoutMs / 1000)))

    try {
      const response = await api.post("/sandbox/execute", {
        code,
        language: normalizeLanguage(language),
        timeout: timeoutSec,
      })

      const data = response.data
      const logs: ExecutionLogEntry[] = []

      if (data.stdout) {
        const entry: ExecutionLogEntry = {
          id: `stdout-${Date.now()}`,
          type: "stdout",
          content: data.stdout,
          timestamp: Date.now(),
        }
        logs.push(entry)
        onLog?.(entry)
      }

      if (data.stderr) {
        const entry: ExecutionLogEntry = {
          id: `stderr-${Date.now()}`,
          type: "stderr",
          content: data.stderr,
          timestamp: Date.now(),
        }
        logs.push(entry)
        onLog?.(entry)
      }

      onStatus?.(data.success ? "success" : "error")

      return {
        success: Boolean(data.success),
        logs,
        stdout: data.stdout || "",
        stderr: data.stderr || "",
        result: data.result,
        executionTimeMs: data.execution_time_ms || 0,
        error: data.error,
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail || err.response?.data?.error || err.message || "Server execution failed"

      const errEntry: ExecutionLogEntry = {
        id: `err-${Date.now()}`,
        type: "stderr",
        content: `Server Error: ${errorMsg}`,
        timestamp: Date.now(),
      }
      onLog?.(errEntry)
      onStatus?.("error", errorMsg)

      return {
        success: false,
        logs: [errEntry],
        stdout: "",
        stderr: errorMsg,
        executionTimeMs: 0,
        error: errorMsg,
      }
    }
  }

  /**
   * Executes code client-side using Pyodide (Python) or sandboxed Web Worker (JS/TS).
   */
  public async execute(
    code: string,
    rawLanguage: string,
    options: RunCodeOptions = {},
    onLog?: LogCallback,
    onStatus?: StatusCallback
  ): Promise<ExecutionResult> {
    const { mode = "client", timeoutMs = 15000 } = options
    const lang = normalizeLanguage(rawLanguage)
    const cleanCode = stripMarkdownCodeFences(code)

    // Fall back to server if explicitly requested
    if (mode === "server") {
      return this.executeOnServer(cleanCode, lang, timeoutMs, onLog, onStatus)
    }

    // Client-side Web Worker execution
    this.stopActiveExecution()
    const execId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    this.activeExecutionId = execId

    const logs: ExecutionLogEntry[] = []
    let stdoutAcc = ""
    let stderrAcc = ""

    return new Promise<ExecutionResult>((resolve) => {
      let resolved = false

      const cleanup = () => {
        if (this.executionTimeoutTimer) {
          clearTimeout(this.executionTimeoutTimer)
          this.executionTimeoutTimer = null
        }
      }

      // Timeout watchdog
      this.executionTimeoutTimer = setTimeout(() => {
        if (resolved) return
        resolved = true

        this.stopActiveExecution()

        const timeoutMsg = `Execution timed out after ${Math.round(timeoutMs / 1000)} seconds. Sandbox terminated.`
        const timeoutLog: ExecutionLogEntry = {
          id: `timeout-${Date.now()}`,
          type: "stderr",
          content: timeoutMsg,
          timestamp: Date.now(),
        }
        logs.push(timeoutLog)
        onLog?.(timeoutLog)
        onStatus?.("error", timeoutMsg)

        resolve({
          success: false,
          logs,
          stdout: stdoutAcc,
          stderr: timeoutMsg,
          executionTimeMs: timeoutMs,
          error: timeoutMsg,
        })
      }, timeoutMs)

      try {
        const worker = lang === "python" ? this.getPyodideWorker() : this.getJsWorker()

        worker.onmessage = (event) => {
          const msg = event.data || {}

          if (msg.type === "status") {
            const statusType: ExecutionStatus =
              msg.status === "initializing"
                ? "initializing"
                : msg.status === "ready"
                ? "idle"
                : msg.status === "error"
                ? "error"
                : "running"

            onStatus?.(statusType, msg.message)
            const sysLog: ExecutionLogEntry = {
              id: `sys-${Date.now()}-${Math.random()}`,
              type: "system",
              content: msg.message,
              timestamp: Date.now(),
            }
            logs.push(sysLog)
            onLog?.(sysLog)
            return
          }

          if (msg.type === "stdout") {
            stdoutAcc += msg.text
            const logEntry: ExecutionLogEntry = {
              id: `out-${Date.now()}-${Math.random()}`,
              type: "stdout",
              content: msg.text,
              timestamp: Date.now(),
            }
            logs.push(logEntry)
            onLog?.(logEntry)
            return
          }

          if (msg.type === "stderr") {
            stderrAcc += msg.text
            const logEntry: ExecutionLogEntry = {
              id: `err-${Date.now()}-${Math.random()}`,
              type: "stderr",
              content: msg.text,
              timestamp: Date.now(),
            }
            logs.push(logEntry)
            onLog?.(logEntry)
            return
          }

          if (msg.type === "done" && (!msg.id || msg.id === execId)) {
            if (resolved) return
            resolved = true
            cleanup()

            if (msg.result !== undefined && msg.result !== "") {
              const resEntry: ExecutionLogEntry = {
                id: `res-${Date.now()}`,
                type: "result",
                content: String(msg.result),
                timestamp: Date.now(),
              }
              logs.push(resEntry)
              onLog?.(resEntry)
            }

            if (!msg.success && msg.error) {
              const errEntry: ExecutionLogEntry = {
                id: `err-${Date.now()}`,
                type: "stderr",
                content: String(msg.error),
                timestamp: Date.now(),
              }
              logs.push(errEntry)
              onLog?.(errEntry)
              stderrAcc += msg.error
            }

            onStatus?.(msg.success ? "success" : "error")

            resolve({
              success: Boolean(msg.success),
              logs,
              stdout: stdoutAcc,
              stderr: stderrAcc,
              result: msg.result,
              executionTimeMs: msg.executionTimeMs || 0,
              error: msg.error,
            })
          }
        }

        worker.onerror = (errEvent) => {
          if (resolved) return
          resolved = true
          cleanup()

          const errorText = errEvent.message || "Worker execution error occurred."
          const errLog: ExecutionLogEntry = {
            id: `fatal-${Date.now()}`,
            type: "stderr",
            content: errorText,
            timestamp: Date.now(),
          }
          logs.push(errLog)
          onLog?.(errLog)
          onStatus?.("error", errorText)

          resolve({
            success: false,
            logs,
            stdout: stdoutAcc,
            stderr: errorText,
            executionTimeMs: 0,
            error: errorText,
          })
        }

        // Send execution request to worker
        worker.postMessage({
          id: execId,
          type: "run",
          code: cleanCode,
          language: rawLanguage,
          timeout: timeoutMs,
        })
      } catch (err: any) {
        if (resolved) return
        resolved = true
        cleanup()

        // If client worker creation failed, attempt server fallback seamlessly
        console.warn("Client worker failure, attempting server execution fallback...", err)
        return this.executeOnServer(code, lang, timeoutMs, onLog, onStatus).then(resolve)
      }
    })
  }
}

// Global Singleton instance
export const codeSandbox = new CodeSandboxEngine()
