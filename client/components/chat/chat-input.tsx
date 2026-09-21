"use client"

import React, { useRef, useEffect, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip } from "@/components/ui/tooltip"
import {
  ArrowUp,
  Paperclip,
  Mic,
  Square,
  Globe,
  Code2,
  FileText,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Database,
} from "lucide-react"
import {
  uploadDocumentApi,
  validateDocumentFile,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/api/documents"
import { UserDocument } from "@/types/document"

interface AttachedFileState {
  file: File
  status: "validating" | "uploading" | "ready" | "error"
  error?: string
  docRecord?: UserDocument
}

interface ChatInputProps {
  input: string
  setInput: (val: string) => void
  onSubmit: (customPrompt?: string) => void
  isLoading?: boolean
  onStop?: () => void
  onOpenDocuments?: () => void
  documentCount?: number
  onDocumentAttached?: (doc: UserDocument) => void
  activeDocument?: UserDocument | null
  onClearActiveDocument?: () => void
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isLoading = false,
  onStop,
  onOpenDocuments,
  documentCount = 0,
  onDocumentAttached,
  activeDocument,
  onClearActiveDocument,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<AttachedFileState | null>(null)

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        onSubmit()
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 50 MB & extension validation
    const validation = validateDocumentFile(file)
    if (!validation.isValid) {
      setAttachedFile({
        file,
        status: "error",
        error: validation.error || "File must be a PDF or DOCX under 50 MB",
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setAttachedFile({
      file,
      status: "uploading",
    })

    try {
      const doc = await uploadDocumentApi(file)
      setAttachedFile({
        file,
        status: "ready",
        docRecord: doc,
      })
      onDocumentAttached?.(doc)
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to index document."
      setAttachedFile({
        file,
        status: "error",
        error: msg,
      })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeAttachedFile = () => {
    setAttachedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Scoped Active Document Focus Banner */}
      {activeDocument && (
        <div className="mb-2 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-xs shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 shrink-0">
              <FileText className="h-3 w-3" />
            </span>
            <span className="text-white font-medium truncate max-w-[200px] sm:max-w-xs">
              {activeDocument.filename}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
              <CheckCircle2 className="h-2.5 w-2.5" /> Chat Scoped
            </span>
          </div>
          {onClearActiveDocument && (
            <button
              type="button"
              onClick={onClearActiveDocument}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Exit document focus"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit Scope</span>
            </button>
          )}
        </div>
      )}

      {/* Suggestion Chips when Scoped Document is Active */}
      {activeDocument && !input.trim() && (
        <div className="mb-2 flex items-center gap-1.5 overflow-x-auto py-0.5 text-xs">
          <span className="text-[11px] text-slate-400 font-mono shrink-0 mr-1">Suggestions:</span>
          <button
            type="button"
            onClick={() => onSubmit("Summarize this document")}
            className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all text-xs shrink-0 cursor-pointer"
          >
            📄 Summarize this document
          </button>
          <button
            type="button"
            onClick={() => onSubmit("What is the context of this PDF?")}
            className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all text-xs shrink-0 cursor-pointer"
          >
            💡 What is the context of this PDF?
          </button>
          <button
            type="button"
            onClick={() => onSubmit("What are the key points and takeaways?")}
            className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all text-xs shrink-0 cursor-pointer"
          >
            🔍 Key points & takeaways
          </button>
        </div>
      )}

      {/* Attached Document Status Chip */}
      {attachedFile && (
        <div className="mb-2 flex items-center gap-2 max-w-fit px-3 py-1.5 rounded-xl border border-white/10 bg-[#0D131D]/90 text-xs shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          {attachedFile.status === "uploading" && (
            <>
              <Loader2 className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
              <span className="text-slate-300 truncate max-w-[200px]">
                {attachedFile.file.name}
              </span>
              <span className="text-emerald-400 font-mono text-[11px]">Indexing (pgvector)...</span>
            </>
          )}

          {attachedFile.status === "ready" && (
            <>
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-200 font-medium truncate max-w-[220px]">
                {attachedFile.file.name}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="h-2.5 w-2.5" /> Ready for RAG
              </span>
            </>
          )}

          {attachedFile.status === "error" && (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span className="text-rose-300 font-medium truncate max-w-[280px]">
                {attachedFile.error}
              </span>
            </>
          )}

          <button
            type="button"
            onClick={removeAttachedFile}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
            aria-label="Remove attached document"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (input.trim() && !isLoading) {
            onSubmit()
          }
        }}
        className="relative rounded-2xl border border-white/15 bg-[#0D131D]/90 p-3 shadow-2xl backdrop-blur-2xl transition-all focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50"
      >
        {/* Hidden File Input for PDF/DOCX */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.docx"
          onChange={handleFileChange}
          hidden
        />

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeDocument
              ? `Ask anything about "${activeDocument.filename}" (AI answers only from this doc)...`
              : attachedFile?.status === "ready"
              ? `Ask questions about "${attachedFile.file.name}"...`
              : "Ask Nexora anything or attach a PDF/DOCX... (Shift+Enter for newline)"
          }
          rows={1}
          className="min-h-[44px] max-h-[200px] border-none bg-transparent px-2 text-sm text-[#F5F7FA] placeholder:text-slate-500 focus-visible:ring-0"
        />

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          {/* Quick tool / context badges */}
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Tooltip content="Attach PDF or Word document (Max 50 MB)">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || attachedFile?.status === "uploading"}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  attachedFile?.status === "ready"
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    : "hover:text-white hover:bg-white/10"
                }`}
                aria-label="Attach document"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </Tooltip>

            {onOpenDocuments && (
              <Tooltip content="Manage indexed documents library">
                <button
                  type="button"
                  onClick={onOpenDocuments}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-[11px]"
                >
                  <Database className="h-3.5 w-3.5 text-teal-400" />
                  <span className="hidden sm:inline">Docs</span>
                  {documentCount > 0 && (
                    <span className="text-[10px] font-mono px-1 rounded bg-teal-500/20 text-teal-300">
                      {documentCount}
                    </span>
                  )}
                </button>
              </Tooltip>
            )}

            <Tooltip content="Voice Input (UI Mock)">
              <button
                type="button"
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Mic className="h-4 w-4" />
              </button>
            </Tooltip>

            <div className="hidden sm:flex items-center gap-1.5 ml-2 border-l border-white/10 pl-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                <Globe className="h-3 w-3 text-emerald-400" /> Web Search
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                <Code2 className="h-3 w-3 text-teal-400" /> Generative UI
              </span>
              {activeDocument ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30 truncate max-w-[180px] animate-in fade-in">
                  <FileText className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{activeDocument.filename}</span>
                </span>
              ) : (documentCount > 0 || attachedFile?.status === "ready") ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 animate-in fade-in">
                  <FileText className="h-3 w-3 text-emerald-400" /> RAG Active
                </span>
              ) : null}
            </div>
          </div>

          {/* Submit / Stop button */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all cursor-pointer"
                aria-label="Stop generating"
              >
                <Square className="h-3.5 w-3.5 fill-rose-300" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all cursor-pointer ${
                  input.trim()
                    ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-950/50"
                    : "bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </form>
      <p className="mt-2 text-center text-[11px] text-slate-500 font-sans">
        Nexora AI • Powered by LangGraph Agentic RAG • 50 MB max per document (zero permanent storage).
      </p>
    </div>
  )
}
