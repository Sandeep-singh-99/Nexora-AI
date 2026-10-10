"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  NodeProps,
  BackgroundVariant,
  Node,
  Edge,
  useReactFlow,
  useOnViewportChange,
  ReactFlowProvider,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import {
  Brain,
  FileText,
  MessageSquare,
  User as UserIcon,
  Sparkles,
  Maximize2,
  Minimize2,
  Search,
  RefreshCw,
  Layers,
  Code2,
  FolderGit2,
  Bookmark,
  Calendar,
  Percent,
  X,
  FileSpreadsheet,
  Video,
  Orbit,
  LayoutGrid,
  Info,
  Copy,
  Check,
  Compass,
  Eye,
  Sliders,
  Share2,
  Plus,
  Minus,
  RotateCcw,
  Lock,
  Unlock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tooltip } from "@/components/ui/tooltip"
import { KnowledgeGraphResponse, KnowledgeGraphNode as KGNode } from "@/types/memory"
import { fetchKnowledgeGraphApi } from "@/lib/api/memory"
import { useAppearance } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

// --- SAMPLE DEMO GRAPH DATA (Used when user has few or no nodes) ---
const SAMPLE_DEMO_GRAPH: KnowledgeGraphResponse = {
  nodes: [
    {
      id: "user-demo",
      label: "You (Developer)",
      type: "user",
      category: "user",
      data: {
        name: "You",
        email: "developer@nexora.ai",
        memoriesCount: 5,
        documentsCount: 2,
        threadsCount: 3,
      },
    },
    {
      id: "mem-demo-1",
      label: "Prefers Next.js App Router & TypeScript",
      type: "concept",
      category: "tech_preference",
      data: {
        id: "mem-demo-1",
        full_text: "User prefers Next.js 15+ App Router with strict TypeScript and Tailwind CSS.",
        category: "tech_preference",
        confidence: 0.98,
        created_at: new Date().toISOString(),
      },
    },
    {
      id: "mem-demo-2",
      label: "Backend: FastAPI & PostgreSQL with pgvector",
      type: "concept",
      category: "tech_preference",
      data: {
        id: "mem-demo-2",
        full_text: "User builds high-performance backends using FastAPI, async SQLAlchemy, and pgvector for semantic search.",
        category: "tech_preference",
        confidence: 0.95,
        created_at: new Date().toISOString(),
      },
    },
    {
      id: "mem-demo-3",
      label: "Strict Clean Architecture & Separation of Concerns",
      type: "concept",
      category: "coding_convention",
      data: {
        id: "mem-demo-3",
        full_text: "Follows Clean Architecture: separates domain models, service layers, and API endpoints with typed schemas.",
        category: "coding_convention",
        confidence: 0.92,
        created_at: new Date().toISOString(),
      },
    },
    {
      id: "mem-demo-4",
      label: "Building Nexora AI Multi-Agent Studio",
      type: "concept",
      category: "project",
      data: {
        id: "mem-demo-4",
        full_text: "Lead project: Nexora AI studio with multimodal memory, vector RAG, and LangGraph workflow orchestration.",
        category: "project",
        confidence: 1.0,
        created_at: new Date().toISOString(),
      },
    },
    {
      id: "mem-demo-5",
      label: "Interested in Agentic RAG & Graph Networks",
      type: "concept",
      category: "interest",
      data: {
        id: "mem-demo-5",
        full_text: "Passionate about autonomous agentic RAG architectures, knowledge graph retrieval, and local LLM inference.",
        category: "interest",
        confidence: 0.89,
        created_at: new Date().toISOString(),
      },
    },
    {
      id: "doc-demo-1",
      label: "nexora_system_architecture.pdf",
      type: "document",
      category: "document",
      data: {
        id: "doc-demo-1",
        filename: "nexora_system_architecture.pdf",
        file_type: "pdf",
        file_size: 1420000,
        total_pages: 18,
        total_chunks: 54,
        created_at: new Date().toISOString(),
      },
    },
    {
      id: "doc-demo-2",
      label: "fastapi_pgvector_specs.docx",
      type: "document",
      category: "document",
      data: {
        id: "doc-demo-2",
        filename: "fastapi_pgvector_specs.docx",
        file_type: "docx",
        file_size: 450000,
        total_pages: 6,
        total_chunks: 19,
        created_at: new Date().toISOString(),
      },
    },
    {
      id: "thread-demo-1",
      label: "FastAPI & Vector Database Setup",
      type: "thread",
      category: "thread",
      data: {
        id: "thread-demo-1",
        title: "FastAPI & Vector Database Setup",
        is_pinned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      id: "thread-demo-2",
      label: "React Flow Knowledge Graph Architecture",
      type: "thread",
      category: "thread",
      data: {
        id: "thread-demo-2",
        title: "React Flow Knowledge Graph Architecture",
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
  ],
  edges: [
    { id: "e-u-m1", source: "user-demo", target: "mem-demo-1", label: "knows", relationship: "user_concept" },
    { id: "e-u-m2", source: "user-demo", target: "mem-demo-2", label: "knows", relationship: "user_concept" },
    { id: "e-u-m3", source: "user-demo", target: "mem-demo-3", label: "knows", relationship: "user_concept" },
    { id: "e-u-m4", source: "user-demo", target: "mem-demo-4", label: "knows", relationship: "user_concept" },
    { id: "e-u-m5", source: "user-demo", target: "mem-demo-5", label: "knows", relationship: "user_concept" },
    { id: "e-u-d1", source: "user-demo", target: "doc-demo-1", label: "uploaded", relationship: "user_doc" },
    { id: "e-u-d2", source: "user-demo", target: "doc-demo-2", label: "uploaded", relationship: "user_doc" },
    { id: "e-u-t1", source: "user-demo", target: "thread-demo-1", label: "chatted", relationship: "user_thread" },
    { id: "e-u-t2", source: "user-demo", target: "thread-demo-2", label: "chatted", relationship: "user_thread" },
    { id: "e-d2-m2", source: "doc-demo-2", target: "mem-demo-2", label: "references (fastapi, pgvector)", relationship: "doc_concept" },
    { id: "e-d1-m4", source: "doc-demo-1", target: "mem-demo-4", label: "relates (nexora, architecture)", relationship: "doc_concept" },
    { id: "e-t1-m2", source: "thread-demo-1", target: "mem-demo-2", label: "discussed (fastapi, vector)", relationship: "thread_concept" },
    { id: "e-t1-d2", source: "thread-demo-1", target: "doc-demo-2", label: "analyzed", relationship: "thread_doc" },
    { id: "e-t2-m1", source: "thread-demo-2", target: "mem-demo-1", label: "discussed (react, frontend)", relationship: "thread_concept" },
    { id: "e-m1-m2", source: "mem-demo-1", target: "mem-demo-2", label: "fullstack", relationship: "concept_concept" },
    { id: "e-m4-m5", source: "mem-demo-4", target: "mem-demo-5", label: "domain", relationship: "concept_concept" },
  ],
  stats: {
    total_memories: 5,
    tech_preferences: 2,
    coding_conventions: 1,
    projects: 1,
    interests: 1,
    documents: 2,
    threads: 2,
    total_nodes: 10,
    total_edges: 16,
  },
}

// --- CATEGORY BADGE & STYLING UTILITIES ---
export function getCategoryBadgeConfig(category?: string) {
  const cat = (category || "").toLowerCase()
  if (cat.includes("tech")) {
    return {
      label: "Tech Preference",
      icon: Code2,
      border: "border-emerald-500/40 dark:border-emerald-500/50",
      bg: "bg-emerald-500/10 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-300",
      dot: "bg-emerald-500",
      glow: "shadow-emerald-500/20",
      accent: "#10b981",
    }
  }
  if (cat.includes("convention") || cat.includes("coding")) {
    return {
      label: "Coding Convention",
      icon: Layers,
      border: "border-purple-500/40 dark:border-purple-500/50",
      bg: "bg-purple-500/10 dark:bg-purple-950/40",
      text: "text-purple-700 dark:text-purple-300",
      dot: "bg-purple-500",
      glow: "shadow-purple-500/20",
      accent: "#a855f7",
    }
  }
  if (cat.includes("project")) {
    return {
      label: "Project",
      icon: FolderGit2,
      border: "border-blue-500/40 dark:border-blue-500/50",
      bg: "bg-blue-500/10 dark:bg-blue-950/40",
      text: "text-blue-700 dark:text-blue-300",
      dot: "bg-blue-500",
      glow: "shadow-blue-500/20",
      accent: "#3b82f6",
    }
  }
  if (cat.includes("interest")) {
    return {
      label: "Interest",
      icon: Bookmark,
      border: "border-amber-500/40 dark:border-amber-500/50",
      bg: "bg-amber-500/10 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-300",
      dot: "bg-amber-500",
      glow: "shadow-amber-500/20",
      accent: "#f59e0b",
    }
  }
  return {
    label: "General Fact",
    icon: Sparkles,
    border: "border-slate-400/40 dark:border-slate-500/40",
    bg: "bg-slate-500/10 dark:bg-slate-900/40",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-400",
    glow: "shadow-slate-500/20",
    accent: "#64748b",
  }
}

// --- CUSTOM REACT FLOW NODES ---

// 1. Central User Node (Digital Brain Core)
function CustomUserNode({ data, selected }: NodeProps) {
  const { accentConfig } = useAppearance()
  const name = String(data.name || "You")
  const email = String(data.email || "")
  const memoriesCount = Number(data.memoriesCount || 0)
  const docsCount = Number(data.documentsCount || 0)
  const threadsCount = Number(data.threadsCount || 0)

  return (
    <div
      className={cn(
        "relative rounded-2xl p-4 border bg-white/95 dark:bg-[#070c18]/95 backdrop-blur-xl shadow-2xl transition-all min-w-[230px] group cursor-pointer",
        selected
          ? "ring-2 ring-indigo-500 border-indigo-400 shadow-indigo-500/40 scale-105"
          : "border-indigo-500/40 hover:border-indigo-400/80 hover:shadow-indigo-500/20"
      )}
    >
      {/* Invisible sleek handles */}
      <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !bg-indigo-500 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !bg-indigo-500 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !bg-indigo-500 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-indigo-500 !opacity-0 group-hover:!opacity-100 transition-opacity" />

      {/* Top line */}
      <div className="absolute inset-x-4 -top-px h-[2px] bg-indigo-500/50" />

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0",
            accentConfig.gradient
          )}
        >
          <Brain className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white dark:ring-[#070c18]" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{name}</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-indigo-500/30 text-indigo-500">
              Core
            </Badge>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{email || "Digital Brain Hub"}</p>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 grid grid-cols-3 gap-1.5 text-center">
        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.04]">
          <span className="block text-xs font-bold text-slate-900 dark:text-white">{memoriesCount}</span>
          <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-medium">Facts</span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.04]">
          <span className="block text-xs font-bold text-slate-900 dark:text-white">{docsCount}</span>
          <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-medium">Docs</span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.04]">
          <span className="block text-xs font-bold text-slate-900 dark:text-white">{threadsCount}</span>
          <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-medium">Chats</span>
        </div>
      </div>
    </div>
  )
}

// 2. Memory / Concept Node (Fact Node)
function CustomConceptNode({ data, selected }: NodeProps) {
  const catConfig = getCategoryBadgeConfig(String(data.category || ""))
  const Icon = catConfig.icon
  const fullText = String(data.full_text || "")
  const confidence = typeof data.confidence === "number" ? Math.round(data.confidence * 100) : 100

  return (
    <div
      className={cn(
        "relative rounded-xl p-3 border bg-white/95 dark:bg-[#070c18]/95 backdrop-blur-xl shadow-md transition-all max-w-[250px] group cursor-pointer",
        catConfig.border,
        selected
          ? "ring-2 ring-indigo-500 shadow-xl scale-105"
          : "hover:border-slate-400 dark:hover:border-white/40 hover:shadow-lg"
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !bg-slate-400 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !bg-slate-400 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !bg-slate-400 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-slate-400 !opacity-0 group-hover:!opacity-100 transition-opacity" />

      {/* Top category accent strip */}
      <div
        className="absolute inset-x-3 -top-px h-[2px] rounded-full"
        style={{ backgroundColor: catConfig.accent }}
      />

      <div className="flex items-center justify-between gap-1 mb-1.5">
        <Badge
          variant="outline"
          className={cn(
            "text-[9px] px-1.5 py-0 flex items-center gap-1 border font-semibold",
            catConfig.bg,
            catConfig.border,
            catConfig.text
          )}
        >
          <Icon className="h-2.5 w-2.5" />
          <span>{catConfig.label}</span>
        </Badge>
        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 flex items-center">
          <Percent className="h-2.5 w-2.5 mr-0.5" />
          {confidence}
        </span>
      </div>

      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-3 leading-snug break-words">
        {fullText}
      </p>
    </div>
  )
}

// 3. Document Node
function CustomDocumentNode({ data, selected }: NodeProps) {
  const filename = String(data.filename || "Document")
  const fileType = String(data.file_type || "pdf").toLowerCase()
  const totalPages = Number(data.total_pages || 1)
  const totalChunks = Number(data.total_chunks || 0)

  const isVideo = fileType.includes("youtube") || fileType.includes("video")
  const isSheet = fileType.includes("csv") || fileType.includes("xlsx")
  const DocIcon = isVideo ? Video : isSheet ? FileSpreadsheet : FileText

  return (
    <div
      className={cn(
        "relative rounded-xl p-3 border bg-white/95 dark:bg-[#070c18]/95 backdrop-blur-xl shadow-md transition-all max-w-[230px] border-amber-500/40 dark:border-amber-500/50 group cursor-pointer",
        selected
          ? "ring-2 ring-amber-500 shadow-xl scale-105"
          : "hover:border-amber-400 hover:shadow-lg"
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !bg-amber-400 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !bg-amber-400 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !bg-amber-400 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-amber-400 !opacity-0 group-hover:!opacity-100 transition-opacity" />

      {/* Top accent strip */}
      <div className="absolute inset-x-3 -top-px h-[2px] bg-amber-500 rounded-full" />

      <div className="flex items-center gap-2 mb-1.5">
        <div className="h-6 w-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <DocIcon className="h-3.5 w-3.5" />
        </div>
        <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 border-amber-500/30 text-amber-600 dark:text-amber-300 font-mono">
          {fileType}
        </Badge>
      </div>

      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={filename}>
        {filename}
      </p>

      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
        <span>{totalPages} page{totalPages !== 1 ? "s" : ""}</span>
        <span>{totalChunks} chunks</span>
      </div>
    </div>
  )
}

// 4. Chat Thread Node
function CustomThreadNode({ data, selected }: NodeProps) {
  const title = String(data.title || "Chat Conversation")
  const isPinned = Boolean(data.is_pinned)

  return (
    <div
      className={cn(
        "relative rounded-xl p-3 border bg-white/95 dark:bg-[#070c18]/95 backdrop-blur-xl shadow-md transition-all max-w-[230px] border-sky-500/40 dark:border-sky-500/50 group cursor-pointer",
        selected
          ? "ring-2 ring-sky-500 shadow-xl scale-105"
          : "hover:border-sky-400 hover:shadow-lg"
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !bg-sky-400 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !bg-sky-400 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left} className="!w-1.5 !h-1.5 !bg-sky-400 !opacity-0 group-hover:!opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} className="!w-1.5 !h-1.5 !bg-sky-400 !opacity-0 group-hover:!opacity-100 transition-opacity" />

      {/* Top accent strip */}
      <div className="absolute inset-x-3 -top-px h-[2px] bg-sky-500 rounded-full" />

      <div className="flex items-center justify-between gap-1 mb-1.5">
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 flex items-center gap-1 border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300 font-semibold">
          <MessageSquare className="h-2.5 w-2.5" />
          <span>Chat Thread</span>
        </Badge>
        {isPinned && (
          <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-500 font-semibold">Pinned</span>
        )}
      </div>

      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
        {title}
      </p>
    </div>
  )
}

// --- NODE TYPES ---
const nodeTypes = {
  user: CustomUserNode,
  concept: CustomConceptNode,
  document: CustomDocumentNode,
  thread: CustomThreadNode,
}

// --- INNER GRAPH CANVAS COMPONENT ---
interface KnowledgeGraphInnerProps {
  onSelectConcept?: (conceptId: string) => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

function KnowledgeGraphInner({
  onSelectConcept,
  isFullscreen = false,
  onToggleFullscreen,
}: KnowledgeGraphInnerProps) {
  const { accentConfig } = useAppearance()
  const { fitView, zoomIn, zoomOut, zoomTo } = useReactFlow()

  const [rawGraphData, setRawGraphData] = useState<KnowledgeGraphResponse | null>(null)
  const [useSampleData, setUseSampleData] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Layout mode: "orbital" (celestial planetary circles) vs "grid" (organized clustered columns)
  const [layoutMode, setLayoutMode] = useState<"orbital" | "grid">("orbital")

  // Filter & Search states
  const [filterType, setFilterType] = useState<"all" | "concept" | "document" | "thread">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null)
  const [showLegend, setShowLegend] = useState(true)
  const [copiedText, setCopiedText] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(100)
  const [isLocked, setIsLocked] = useState(false)

  // Track live viewport zoom changes
  useOnViewportChange({
    onChange: useCallback((viewport: { x: number; y: number; zoom: number }) => {
      setCurrentZoom(Math.round(viewport.zoom * 100))
    }, []),
  })

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Load real graph data
  const loadGraph = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchKnowledgeGraphApi()
      setRawGraphData(data)
      // If user has zero facts and docs, default to sample demo data so they see an active graph immediately
      if (data.nodes.length <= 1) {
        setUseSampleData(true)
      } else {
        setUseSampleData(false)
      }
    } catch (err) {
      console.error("Failed to load knowledge graph data:", err)
      setUseSampleData(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGraph()
  }, [loadGraph])

  // Active data source
  const currentData = useMemo(() => {
    if (useSampleData) return SAMPLE_DEMO_GRAPH
    return rawGraphData || SAMPLE_DEMO_GRAPH
  }, [useSampleData, rawGraphData])

  // Compute Layout Positions & Edges
  useEffect(() => {
    if (!currentData) return

    const { nodes: rawNodes, edges: rawEdges } = currentData

    // Filter nodes based on active pill and search query
    const activeNodes = rawNodes.filter((n) => {
      if (n.type === "user") return true
      if (filterType !== "all" && n.type !== filterType) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const text = (n.label || "") + " " + JSON.stringify(n.data || "")
        return text.toLowerCase().includes(query)
      }
      return true
    })

    const activeNodeIds = new Set(activeNodes.map((n) => n.id))

    const concepts = activeNodes.filter((n) => n.type === "concept")
    const documents = activeNodes.filter((n) => n.type === "document")
    const threads = activeNodes.filter((n) => n.type === "thread")

    const centerX = 400
    const centerY = 300

    const flowNodes: Node[] = activeNodes.map((node) => {
      let x = centerX
      let y = centerY

      if (node.type === "user") {
        x = centerX - 110
        y = centerY - 65
      } else if (layoutMode === "orbital") {
        // --- 🌌 ORBITAL CELESTIAL LAYOUT ---
        if (node.type === "concept") {
          // Concept fan from -45 deg to 125 deg
          const idx = concepts.findIndex((c) => c.id === node.id)
          const total = Math.max(concepts.length, 1)
          const orbitRadius = 280 + (idx % 2) * 65
          const angle = -Math.PI * 0.25 + (idx / total) * (Math.PI * 0.95)
          x = centerX + Math.cos(angle) * orbitRadius - 120
          y = centerY + Math.sin(angle) * orbitRadius - 45
        } else if (node.type === "document") {
          // Bottom-left orbit sector
          const idx = documents.findIndex((d) => d.id === node.id)
          const total = Math.max(documents.length, 1)
          const orbitRadius = 270 + (idx % 2) * 55
          const angle = Math.PI * 0.72 + (idx / total) * (Math.PI * 0.38)
          x = centerX + Math.cos(angle) * orbitRadius - 110
          y = centerY + Math.sin(angle) * orbitRadius - 40
        } else if (node.type === "thread") {
          // Top-left orbit sector
          const idx = threads.findIndex((t) => t.id === node.id)
          const total = Math.max(threads.length, 1)
          const orbitRadius = 275 + (idx % 2) * 55
          const angle = Math.PI * 1.15 + (idx / total) * (Math.PI * 0.42)
          x = centerX + Math.cos(angle) * orbitRadius - 110
          y = centerY + Math.sin(angle) * orbitRadius - 40
        }
      } else {
        // --- 🏛️ CLUSTER GRID LAYOUT ---
        if (node.type === "concept") {
          const idx = concepts.findIndex((c) => c.id === node.id)
          const col = idx % 2
          const row = Math.floor(idx / 2)
          x = centerX + 180 + col * 260
          y = centerY - 160 + row * 115
        } else if (node.type === "document") {
          const idx = documents.findIndex((d) => d.id === node.id)
          x = centerX - 360
          y = centerY + 50 + idx * 115
        } else if (node.type === "thread") {
          const idx = threads.findIndex((t) => t.id === node.id)
          x = centerX - 360
          y = centerY - 180 + idx * 105
        }
      }

      return {
        id: node.id,
        type: node.type,
        data: node.data,
        position: { x, y },
      }
    })

    // Construct edge styles
    const flowEdges: Edge[] = rawEdges
      .filter((e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target))
      .map((e) => {
        let strokeColor = "#94a3b8"
        let strokeDash = undefined

        if (e.relationship === "doc_concept") {
          strokeColor = "#f59e0b" // amber
        } else if (e.relationship === "thread_concept") {
          strokeColor = "#0284c7" // sky
        } else if (e.relationship === "thread_doc") {
          strokeColor = "#8b5cf6" // violet
        } else if (e.relationship === "concept_concept") {
          strokeColor = "#10b981" // emerald
          strokeDash = "5 5"
        }

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: e.relationship !== "user_concept" && e.relationship !== "user_doc" && e.relationship !== "user_thread",
          style: {
            stroke: strokeColor,
            strokeWidth: e.relationship?.includes("concept") ? 2 : 1.5,
            strokeDasharray: strokeDash,
            opacity: 0.7,
          },
          labelStyle: {
            fontSize: 9,
            fill: "#64748b",
            fontWeight: 600,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: strokeColor,
          },
        }
      })

    setNodes(flowNodes)
    setEdges(flowEdges)

    // Smooth dual-pass fitview ensuring stable layout inside animated dialogs
    const timer1 = setTimeout(() => {
      fitView({ padding: 0.18, duration: 300 })
    }, 120)
    const timer2 = setTimeout(() => {
      fitView({ padding: 0.18, duration: 300 })
    }, 350)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [currentData, filterType, searchQuery, layoutMode, setNodes, setEdges, fitView])

  const onNodeClick = (_: any, node: any) => {
    const raw = currentData.nodes.find((n) => n.id === node.id)
    if (raw) {
      setSelectedNode(raw)
      if (raw.type === "concept" && raw.data.id && onSelectConcept) {
        onSelectConcept(raw.data.id)
      }
    }
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#03060C]">
      {/* Sample Data Banner */}
      {useSampleData && (
        <div className="shrink-0 px-4 py-1.5 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Demo Graph: Showing sample concepts & relations to preview network capabilities.</span>
          </div>
          {rawGraphData && rawGraphData.nodes.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseSampleData(false)}
              className="h-6 text-[10px] px-2 border-indigo-500/30 text-indigo-600 dark:text-indigo-300"
            >
              Switch to My Data
            </Button>
          )}
        </div>
      )}

      {/* Top HUD Controls Bar */}
      <div className="shrink-0 px-4 py-2.5 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#070C18]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-white shadow-sm", accentConfig.gradient)}>
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Digital Brain Network
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {currentData.stats.total_nodes} nodes • {currentData.stats.total_edges} relational links
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Search Input */}
          <div className="relative w-36 sm:w-44">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search graph..."
              className="h-8 pl-8 pr-2 text-xs bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/10"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-slate-100 dark:bg-white/[0.03]">
            {(["all", "concept", "document", "thread"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer capitalize",
                  filterType === type
                    ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                {type === "all" ? "All" : type === "concept" ? "Facts" : type === "document" ? "Docs" : "Chats"}
              </button>
            ))}
          </div>

          {/* Layout Mode Toggle: Orbital vs Grid */}
          <div className="flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-slate-100 dark:bg-white/[0.03]">
            <button
              onClick={() => setLayoutMode("orbital")}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                layoutMode === "orbital"
                  ? "bg-white dark:bg-white/10 text-indigo-500 shadow-xs"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
              title="Orbital Celestial Layout"
            >
              <Orbit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                layoutMode === "grid"
                  ? "bg-white dark:bg-white/10 text-indigo-500 shadow-xs"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
              title="Structured Column Layout"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Toggle Legend */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLegend(!showLegend)}
            className={cn("h-8 w-8 rounded-lg cursor-pointer", showLegend && "text-indigo-500 bg-indigo-500/10")}
            title="Toggle Legend"
          >
            <Info className="h-3.5 w-3.5" />
          </Button>

          {/* Refresh Graph */}
          <Button
            variant="ghost"
            size="icon"
            onClick={loadGraph}
            disabled={isLoading}
            className="h-8 w-8 rounded-lg cursor-pointer"
            title="Refresh network"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </Button>

          {/* Fullscreen Expand */}
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              className="h-8 w-8 rounded-lg cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          nodesDraggable={!isLocked}
          nodesConnectable={false}
          elementsSelectable={true}
          fitView
          fitViewOptions={{ padding: 0.18, duration: 350 }}
          minZoom={0.2}
          maxZoom={2.2}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.2}
            color="#64748b"
            className="opacity-25"
          />

          <MiniMap
            zoomable
            pannable
            className="!bg-white/90 dark:!bg-[#070c18]/90 !border-slate-200 dark:!border-white/10 !rounded-xl overflow-hidden shadow-xl"
            nodeColor={(n) => {
              if (n.type === "user") return "#6366f1"
              if (n.type === "document") return "#f59e0b"
              if (n.type === "thread") return "#0284c7"
              const cat = String(n.data?.category || "")
              if (cat.includes("tech")) return "#10b981"
              if (cat.includes("convention")) return "#a855f7"
              if (cat.includes("project")) return "#3b82f6"
              return "#f59e0b"
            }}
          />
        </ReactFlow>

        {/* Custom High-Contrast Floating Controller HUD */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center rounded-2xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-[#070C18]/95 backdrop-blur-xl shadow-2xl p-1.5 gap-1 animate-in fade-in-0 duration-200 pointer-events-auto">
          {/* Zoom In (+) Button */}
          <Tooltip content="Zoom In (+)" side="top">
            <button
              type="button"
              onClick={() => zoomIn({ duration: 250 })}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 transition-all cursor-pointer shadow-xs border border-slate-200/50 dark:border-white/5"
              aria-label="Zoom In"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
            </button>
          </Tooltip>

          {/* Current Zoom Readout (Click to reset 100%) */}
          <Tooltip content="Reset Zoom to 100%" side="top">
            <button
              type="button"
              onClick={() => zoomTo(1, { duration: 250 })}
              className="px-2.5 h-8 rounded-xl text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-indigo-500 transition-colors cursor-pointer flex items-center justify-center min-w-[46px]"
            >
              {currentZoom}%
            </button>
          </Tooltip>

          {/* Zoom Out (-) Button */}
          <Tooltip content="Zoom Out (-)" side="top">
            <button
              type="button"
              onClick={() => zoomOut({ duration: 250 })}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-90 transition-all cursor-pointer shadow-xs border border-slate-200/50 dark:border-white/5"
              aria-label="Zoom Out"
            >
              <Minus className="h-4 w-4 stroke-[3]" />
            </button>
          </Tooltip>

          <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-0.5" />

          {/* Fit to Viewport Button */}
          <Tooltip content="Fit to Screen" side="top">
            <button
              type="button"
              onClick={() => fitView({ padding: 0.18, duration: 350 })}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition-all cursor-pointer"
              aria-label="Fit to Screen"
            >
              <Maximize2 className="h-3.5 w-3.5 stroke-[2.2]" />
            </button>
          </Tooltip>

          {/* Center Origin Network */}
          <Tooltip content="Center Network" side="top">
            <button
              type="button"
              onClick={() => fitView({ padding: 0.2, duration: 400 })}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition-all cursor-pointer"
              aria-label="Center Network"
            >
              <RotateCcw className="h-3.5 w-3.5 stroke-[2.2]" />
            </button>
          </Tooltip>

          {/* Lock / Unlock Toggle */}
          <Tooltip content={isLocked ? "Unlock Node Dragging" : "Lock Node Positions"} side="top">
            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer",
                isLocked
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
              )}
              aria-label={isLocked ? "Unlock" : "Lock"}
            >
              {isLocked ? <Lock className="h-3.5 w-3.5 stroke-[2.2]" /> : <Unlock className="h-3.5 w-3.5 stroke-[2.2]" />}
            </button>
          </Tooltip>
        </div>

        {/* Floating Legend Badge */}
        {showLegend && (
          <div className="absolute top-4 left-4 z-20 rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#070c18]/90 backdrop-blur-md p-3 shadow-xl space-y-2 text-xs animate-in fade-in-0 duration-200 pointer-events-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-100 dark:border-white/10">
              Network Legend
            </span>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-xs shadow-indigo-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">You (Brain Core)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Tech Stack</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-500 shadow-xs shadow-purple-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Conventions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 shadow-xs shadow-blue-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Projects</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 shadow-xs shadow-amber-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Documents</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500 shadow-xs shadow-sky-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Chat Threads</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 z-20 w-84 rounded-2xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-[#070c18]/95 backdrop-blur-xl shadow-2xl p-4 animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] capitalize font-bold">
                  {selectedNode.type}
                </Badge>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Node Inspector
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              {selectedNode.type === "concept" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Classification:</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {selectedNode.data.category?.replace("_", " ") || "General"}
                    </Badge>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                    <p className="text-slate-800 dark:text-slate-200 font-medium break-words leading-relaxed">
                      {selectedNode.data.full_text || selectedNode.label}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Confidence Score</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {Math.round((selectedNode.data.confidence || 1) * 100)}%
                    </span>
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyText(selectedNode.data.full_text || selectedNode.label)}
                      className="h-7 text-xs px-2.5 cursor-pointer"
                    >
                      {copiedText ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                      {copiedText ? "Copied" : "Copy Fact"}
                    </Button>
                  </div>
                </>
              )}

              {selectedNode.type === "document" && (
                <>
                  <p className="font-bold text-slate-900 dark:text-white break-words">
                    {selectedNode.data.filename || selectedNode.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                    <div>Type: <span className="font-semibold uppercase">{selectedNode.data.file_type}</span></div>
                    <div>Pages: <span className="font-semibold">{selectedNode.data.total_pages}</span></div>
                    <div>Chunks: <span className="font-semibold">{selectedNode.data.total_chunks}</span></div>
                    <div>Size: <span className="font-semibold">{Math.round((selectedNode.data.file_size || 0) / 1024)} KB</span></div>
                  </div>
                </>
              )}

              {selectedNode.type === "thread" && (
                <>
                  <p className="font-bold text-slate-900 dark:text-white break-words">
                    {selectedNode.data.title || selectedNode.label}
                  </p>
                  <div className="text-[11px] text-slate-500 space-y-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
                    <div>Status: {selectedNode.data.is_pinned ? "📌 Pinned Conversation" : "Recent Thread"}</div>
                    {selectedNode.data.updated_at && (
                      <div>Active: {new Date(selectedNode.data.updated_at).toLocaleDateString()}</div>
                    )}
                  </div>
                </>
              )}

              {selectedNode.type === "user" && (
                <>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {selectedNode.data.name}
                  </p>
                  <p className="text-slate-500 text-[11px]">{selectedNode.data.email}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                    Root entity of your digital brain. Connects all persistent preferences, uploaded documents, and chat threads.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- EXPORTED ROOT COMPONENT WITH REACTFLOWPROVIDER ---
export function KnowledgeGraphView(props: KnowledgeGraphInnerProps) {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphInner {...props} />
    </ReactFlowProvider>
  )
}
