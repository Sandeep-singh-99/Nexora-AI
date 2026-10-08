export type SupportedSandboxLanguage =
  | "python"
  | "py"
  | "javascript"
  | "js"
  | "typescript"
  | "ts"
  | "json"

export type ExecutionRuntimeMode = "client" | "server"

export type ExecutionStatus = "idle" | "initializing" | "running" | "success" | "error"

export interface ExecutionLogEntry {
  id: string
  type: "stdout" | "stderr" | "result" | "system"
  content: string
  timestamp: number
}

export interface ExecutionResult {
  success: boolean
  logs: ExecutionLogEntry[]
  stdout: string
  stderr: string
  result?: string
  executionTimeMs: number
  error?: string
}

export interface RunCodeOptions {
  mode?: ExecutionRuntimeMode
  timeoutMs?: number
}
