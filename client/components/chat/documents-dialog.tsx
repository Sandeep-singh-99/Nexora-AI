"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  X,
  FileText,
  UploadCloud,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Database,
  Shield,
  Layers,
  FileCode,
  MessageSquareText,
  Check,
  Tv,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserDocument } from "@/types/document"
import {
  fetchDocumentsApi,
  uploadDocumentApi,
  deleteDocumentApi,
  ingestYouTubeVideoApi,
  validateDocumentFile,
  MAX_DOCUMENT_SIZE_BYTES,
  SensitiveDataFinding,
  SensitiveDataError,
} from "@/lib/api/documents"
import { GuardrailsDialog } from "./guardrails-dialog"

interface DocumentsDialogProps {
  isOpen: boolean
  onClose: () => void
  onDocumentUploaded?: (doc: UserDocument) => void
  activeDocumentId?: string
  onSelectDocument?: (doc: UserDocument) => void
  onUnselectDocument?: () => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export function DocumentsDialog({
  isOpen,
  onClose,
  onDocumentUploaded,
  activeDocumentId,
  onSelectDocument,
  onUnselectDocument,
}: DocumentsDialogProps) {
  const [documents, setDocuments] = useState<UserDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [isImportingYouTube, setIsImportingYouTube] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [justUploadedDoc, setJustUploadedDoc] = useState<UserDocument | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [sensitivePrompt, setSensitivePrompt] = useState<{
    file: File
    findings: SensitiveDataFinding[]
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadDocuments()
      setErrorMsg(null)
      setSuccessMsg(null)
      setJustUploadedDoc(null)
      setSensitivePrompt(null)
    }
  }, [isOpen])

  const loadDocuments = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const docs = await fetchDocumentsApi()
      setDocuments(docs)
    } catch (err: any) {
      console.error("Failed to load documents:", err)
      setErrorMsg("Failed to load your documents. Please ensure you are logged in.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File, confirmSensitive: boolean = false) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setJustUploadedDoc(null)

    const validation = validateDocumentFile(file)
    if (!validation.isValid) {
      setErrorMsg(validation.error || "Invalid file")
      return
    }

    setIsUploading(true)
    try {
      const doc = await uploadDocumentApi(file, confirmSensitive)
      setDocuments((prev) => [doc, ...prev])
      setJustUploadedDoc(doc)
      setSuccessMsg(`"${file.name}" indexed successfully (${doc.total_chunks} chunks).`)
      onDocumentUploaded?.(doc)
    } catch (err: any) {
      if (err instanceof SensitiveDataError) {
        setSensitivePrompt({
          file,
          findings: err.payload.findings,
        })
        return
      }
      console.error("Upload error:", err)
      const detail = err.response?.data?.detail || err.message || "Failed to upload document."
      setErrorMsg(detail)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCancelSensitive = () => {
    setSensitivePrompt(null)
    setErrorMsg("Upload task cancelled by user. No document data was saved.")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleProceedSensitive = async () => {
    if (!sensitivePrompt) return
    const fileToUpload = sensitivePrompt.file
    setSensitivePrompt(null)
    await handleFileUpload(fileToUpload, true)
  }

  const handleImportYouTube = async () => {
    if (!youtubeUrl.trim() || isImportingYouTube) return
    setErrorMsg(null)
    setSuccessMsg(null)
    setIsImportingYouTube(true)
    try {
      const doc = await ingestYouTubeVideoApi(youtubeUrl.trim())
      setDocuments((prev) => [doc, ...prev])
      setJustUploadedDoc(doc)
      setSuccessMsg(`YouTube video "${doc.filename}" transcribed and indexed successfully (${doc.total_chunks} chunks).`)
      setYoutubeUrl("")
      onDocumentUploaded?.(doc)
    } catch (err: any) {
      console.error("YouTube import error:", err)
      const detail = err.response?.data?.detail || err.message || "Failed to transcribe YouTube video."
      setErrorMsg(detail)
    } finally {
      setIsImportingYouTube(false)
    }
  }

  const handleDelete = async (docId: string, filename: string) => {
    if (deletingId) return
    setDeletingId(docId)
    setErrorMsg(null)
    try {
      await deleteDocumentApi(docId)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      if (activeDocumentId === docId) {
        onUnselectDocument?.()
      }
      setSuccessMsg(`Deleted "${filename}" and its vector embeddings.`)
    } catch (err: any) {
      console.error("Delete error:", err)
      setErrorMsg("Failed to delete document. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleSelectToChat = (doc: UserDocument) => {
    onSelectDocument?.(doc)
    onClose()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const activeDoc = documents.find((d) => d.id === activeDocumentId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#0B0F17]/95 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Document Knowledge Base</h2>
              <p className="text-xs text-slate-400">
                Upload PDFs & DOCX files for private Agentic RAG retrieval
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Active Document Scope Banner */}
          {activeDoc && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="truncate">
                  Active Chat Focus: <strong className="text-white font-medium">{activeDoc.filename}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={onUnselectDocument}
                className="px-2 py-1 rounded-md text-[11px] font-mono text-emerald-300 hover:text-white hover:bg-emerald-500/20 transition-colors shrink-0 cursor-pointer"
              >
                Clear Focus
              </button>
            </div>
          )}

          {/* Notifications */}
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center justify-between gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="truncate">{successMsg}</span>
              </div>
              {justUploadedDoc && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleSelectToChat(justUploadedDoc)}
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold h-7 text-xs px-2.5 shrink-0 cursor-pointer"
                >
                  <MessageSquareText className="h-3.5 w-3.5 mr-1" />
                  Chat with this Doc
                </Button>
              )}
            </div>
          )}

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
              isDragging
                ? "border-emerald-500 bg-emerald-500/10 scale-[0.99]"
                : "border-white/15 bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/40"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx"
              hidden
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0])
                }
              }}
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-center py-2">
                <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                <p className="text-sm font-semibold text-white">Indexing Document...</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Parsing in memory, chunking text, and computing 768-dim embeddings
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Click to upload or drag & drop documents here
                </p>
                <p className="text-xs text-slate-400">
                  Supported: <span className="text-emerald-400 font-mono">.PDF</span>,{" "}
                  <span className="text-teal-400 font-mono">.DOCX</span> (Max 50 MB per file)
                </p>
              </div>
            )}
          </div>

          {/* YouTube Video URL Import */}
          <div className="p-3.5 rounded-2xl border border-red-500/20 bg-red-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Tv className="h-4 w-4 text-red-400" />
              <span className="text-xs font-semibold text-white">Import YouTube Video</span>
              <span className="text-[10px] text-slate-400 font-mono ml-auto">Automatic Transcription</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleImportYouTube()
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className="flex-1 bg-[#070A0F] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500/50"
              />
              <Button
                size="sm"
                type="button"
                disabled={!youtubeUrl.trim() || isImportingYouTube}
                onClick={handleImportYouTube}
                className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 h-8 shrink-0 cursor-pointer"
              >
                {isImportingYouTube ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Tv className="h-3.5 w-3.5 mr-1.5" />
                    Transcribe & Index
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Privacy Banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
            <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-300">Zero Permanent Storage:</strong> Original files are
              never saved to disk. Extracted text chunks and HuggingFace embeddings are stored in your
              isolated vector space and discarded immediately upon deletion.
            </p>
          </div>

          {/* Document List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Indexed Documents ({documents.length})
              </h3>
              {isLoading && <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-spin" />}
            </div>

            {documents.length === 0 && !isLoading ? (
              <div className="p-8 rounded-xl border border-white/5 bg-white/[0.01] text-center">
                <FileCode className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No documents uploaded yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Upload a PDF, Word document or transcribe a YouTube video to ask questions with Agentic RAG.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const isYouTube = doc.file_type.toLowerCase() === "youtube"
                  const isPdf = doc.file_type.toLowerCase() === "pdf"
                  const isDeleting = deletingId === doc.id
                  const isCurrentlyActive = activeDocumentId === doc.id

                  return (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all group ${
                        isCurrentlyActive
                          ? "border-emerald-500/50 bg-emerald-500/[0.08]"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg font-mono text-[10px] font-bold shrink-0 ${
                            isYouTube
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : isPdf
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                          }`}
                        >
                          {isYouTube ? <Tv className="h-4 w-4" /> : isPdf ? "PDF" : "DOCX"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-emerald-300 transition-colors">
                              {doc.filename}
                            </p>
                            {isCurrentlyActive && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                <Check className="h-3 w-3" /> Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>{formatBytes(doc.file_size_bytes)}</span>
                            <span>•</span>
                            <span>{doc.total_pages} {doc.total_pages === 1 ? "page" : "pages"}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Layers className="h-3 w-3" />
                              {doc.total_chunks} chunks
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        {isCurrentlyActive ? (
                          <button
                            type="button"
                            onClick={onUnselectDocument}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            Unscope
                          </button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectToChat(doc)}
                            className="h-8 text-xs px-2.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-white cursor-pointer"
                          >
                            <MessageSquareText className="h-3.5 w-3.5 mr-1" />
                            Chat with this Doc
                          </Button>
                        )}

                        <button
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          disabled={isDeleting}
                          title="Delete document and vector embeddings"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>PostgreSQL + pgvector (768-dim)</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="border-white/10 hover:bg-white/10 cursor-pointer">
            Close
          </Button>
        </div>
      </div>

      {/* Sensitive Data Guardrails Confirmation Dialog */}
      <GuardrailsDialog
        isOpen={!!sensitivePrompt}
        filename={sensitivePrompt?.file.name || ""}
        findings={sensitivePrompt?.findings || []}
        onProceed={handleProceedSensitive}
        onCancel={handleCancelSensitive}
        isProcessing={isUploading}
      />
    </div>
  )
}
