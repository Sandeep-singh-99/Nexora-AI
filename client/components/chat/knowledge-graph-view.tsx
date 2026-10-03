"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  ReactFlow,
  MiniMap,
  Controls,
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
  File,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { KnowledgeGraphResponse, KnowledgeGraphNode as KGNode } from "@/types/memory"
import { fetchKnowledgeGraphApi } from "@/lib/api/memory"
import { useAppearance } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

// --- CATEGORY STYLING UTILITIES ---
export function getCategoryBadgeConfig(category?: string) {
  const cat = (category || "").toLowerCase()
  if (cat.includes("tech")) {
    return {
      label: "Tech Preference",
      icon: Code2,
      border: "border-emerald-500/30 dark:border-emerald-500/40",
      bg: "bg-emerald-500/10 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-300",
      dot: "bg-emerald-500",
      glow: "shadow-emerald-500/20",
    }
  }
  if (cat.includes("convention") || cat.includes("coding")) {
    return {
      label: "Coding Convention",
      icon: Layers,
      border: "border-purple-500/30 dark:border-purple-500/40",
      bg: "bg-purple-500/10 dark:bg-purple-950/40",
      text: "text-purple-700 dark:text-purple-300",
      dot: "bg-purple-500",
      glow: "shadow-purple-500/20",
    }
  }
  if (cat.includes("project")) {
    return {
      label: "Project",
      icon: FolderGit2,
      border: "border-blue-500/30 dark:border-blue-500/40",
      bg: "bg-blue-500/10 dark:bg-blue-950/40",
      text: "text-blue-700 dark:text-blue-300",
      dot: "bg-blue-500",
      glow: "shadow-blue-500/20",
    }
  }
  if (cat.includes("interest")) {
    return {
      label: "Interest",
      icon: Bookmark,
      border: "border-amber-500/30 dark:border-amber-500/40",
      bg: "bg-amber-500/10 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-300",
      dot: "bg-amber-500",
      glow: "shadow-amber-500/20",
    }
  }
  return {
    label: "General Fact",
    icon: Sparkles,
    border: "border-slate-500/30 dark:border-slate-500/40",
    bg: "bg-slate-500/10 dark:bg-slate-900/40",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-400",
    glow: "shadow-slate-500/20",
  }
}

// --- CUSTOM REACT FLOW NODES ---

// 1. Central User Node
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
        "relative rounded-2xl p-4 border bg-white/95 dark:bg-[#080d1a]/95 backdrop-blur-md shadow-xl transition-all min-w-[210px]",
        selected ? "ring-2 ring-indigo-500 border-indigo-400 shadow-indigo-500/30" : "border-indigo-500/40"
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-indigo-500" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-indigo-500" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-indigo-500" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-indigo-500" />

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br",
            accentConfig.gradient
          )}
        >
          <UserIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{name}</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{email || "Digital Brain Hub"}</p>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 grid grid-cols-3 gap-1 text-center">
        <div className="p-1 rounded-lg bg-slate-50 dark:bg-white/[0.03]">
          <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">{memoriesCount}</span>
          <span className="block text-[8px] uppercase tracking-wider text-slate-400">Facts</span>
        </div>
        <div className="p-1 rounded-lg bg-slate-50 dark:bg-white/[0.03]">
          <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">{docsCount}</span>
          <span className="block text-[8px] uppercase tracking-wider text-slate-400">Docs</span>
        </div>
        <div className="p-1 rounded-lg bg-slate-50 dark:bg-white/[0.03]">
          <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">{threadsCount}</span>
          <span className="block text-[8px] uppercase tracking-wider text-slate-400">Chats</span>
        </div>
      </div>
    </div>
  )
}

// 2. Memory / Concept Node
function CustomConceptNode({ data, selected }: NodeProps) {
  const catConfig = getCategoryBadgeConfig(String(data.category || ""))
  const Icon = catConfig.icon
  const fullText = String(data.full_text || "")
  const confidence = typeof data.confidence === "number" ? Math.round(data.confidence * 100) : 100

  return (
    <div
      className={cn(
        "relative rounded-xl p-3 border bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-md shadow-md transition-all max-w-[240px]",
        catConfig.border,
        selected ? "ring-2 ring-indigo-500 shadow-lg scale-105" : "hover:border-slate-400 dark:hover:border-white/30"
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-400" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-400" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-slate-400" />

      <div className="flex items-center justify-between gap-1 mb-1.5">
        <Badge
          variant="outline"
          className={cn(
            "text-[9px] px-1.5 py-0 flex items-center gap-1 border",
            catConfig.bg,
            catConfig.border,
            catConfig.text
          )}
        >
          <Icon className="h-2.5 w-2.5" />
          <span>{catConfig.label}</span>
        </Badge>
        <span className="text-[9px] font-mono text-slate-400 flex items-center">
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
        "relative rounded-xl p-3 border bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-md shadow-md transition-all max-w-[220px] border-amber-500/30 dark:border-amber-500/40",
        selected ? "ring-2 ring-amber-500 shadow-lg scale-105" : "hover:border-amber-500/60"
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-amber-400" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-amber-400" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-amber-400" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-amber-400" />

      <div className="flex items-center gap-2 mb-1.5">
        <div className="h-6 w-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <DocIcon className="h-3.5 w-3.5" />
        </div>
        <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 border-amber-500/30 text-amber-600 dark:text-amber-300">
          {fileType}
        </Badge>
      </div>

      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={filename}>
        {filename}
      </p>

      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
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
        "relative rounded-xl p-3 border bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-md shadow-md transition-all max-w-[220px] border-sky-500/30 dark:border-sky-500/40",
        selected ? "ring-2 ring-sky-500 shadow-lg scale-105" : "hover:border-sky-500/60"
      )}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-sky-400" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-sky-400" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-sky-400" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-sky-400" />

      <div className="flex items-center justify-between gap-1 mb-1.5">
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 flex items-center gap-1 border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300">
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

// --- NODE TYPES REGISTRATION ---
const nodeTypes = {
  user: CustomUserNode,
  concept: CustomConceptNode,
  document: CustomDocumentNode,
  thread: CustomThreadNode,
}

// --- COMPONENT PROPS ---
interface KnowledgeGraphViewProps {
  onSelectConcept?: (conceptId: string) => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export function KnowledgeGraphView({
  onSelectConcept,
  isFullscreen = false,
  onToggleFullscreen,
}: KnowledgeGraphViewProps) {
  const { accentConfig } = useAppearance()
  const [graphData, setGraphData] = useState<KnowledgeGraphResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<"all" | "concept" | "document" | "thread">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const loadGraph = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchKnowledgeGraphApi()
      setGraphData(data)
    } catch (err) {
      console.error("Failed to load knowledge graph data:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGraph()
  }, [loadGraph])

  // --- POSITIONING & LAYOUT ALGORITHM ---
  useEffect(() => {
    if (!graphData) return

    const { nodes: rawNodes, edges: rawEdges } = graphData

    // Filter nodes if user selected a filter
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

    // Position calculation
    const concepts = activeNodes.filter((n) => n.type === "concept")
    const documents = activeNodes.filter((n) => n.type === "document")
    const threads = activeNodes.filter((n) => n.type === "thread")

    const centerX = 480
    const centerY = 360

    const flowNodes = activeNodes.map((node) => {
      let x = centerX
      let y = centerY

      if (node.type === "user") {
        x = centerX - 105
        y = centerY - 65
      } else if (node.type === "concept") {
        // Distribute concepts in right & upper right fan (angles -70deg to 110deg)
        const idx = concepts.findIndex((c) => c.id === node.id)
        const total = Math.max(concepts.length, 1)
        const radius = 340 + (idx % 2) * 90
        const angle = -Math.PI / 3 + (idx / total) * (Math.PI * 1.1)
        x = centerX + Math.cos(angle) * radius - 120
        y = centerY + Math.sin(angle) * radius - 50
      } else if (node.type === "document") {
        // Distribute documents in bottom-left sector
        const idx = documents.findIndex((d) => d.id === node.id)
        const total = Math.max(documents.length, 1)
        const radius = 320 + (idx % 2) * 70
        const angle = Math.PI * 0.7 + (idx / total) * (Math.PI * 0.4)
        x = centerX + Math.cos(angle) * radius - 110
        y = centerY + Math.sin(angle) * radius - 40
      } else if (node.type === "thread") {
        // Distribute threads in top-left sector
        const idx = threads.findIndex((t) => t.id === node.id)
        const total = Math.max(threads.length, 1)
        const radius = 330 + (idx % 2) * 80
        const angle = Math.PI * 1.15 + (idx / total) * (Math.PI * 0.45)
        x = centerX + Math.cos(angle) * radius - 110
        y = centerY + Math.sin(angle) * radius - 40
      }

      return {
        id: node.id,
        type: node.type,
        data: node.data,
        position: { x, y },
      }
    })

    // Filter edges linking to visible nodes only
    const flowEdges = rawEdges
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
          strokeDash = "4 4"
        }

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: e.relationship?.includes("concept") || false,
          style: {
            stroke: strokeColor,
            strokeWidth: 1.5,
            strokeDasharray: strokeDash,
            opacity: 0.65,
          },
          labelStyle: {
            fontSize: 9,
            fill: "#64748b",
            fontWeight: 500,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 12,
            height: 12,
            color: strokeColor,
          },
        }
      })

    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [graphData, filterType, searchQuery, setNodes, setEdges])

  const onNodeClick = (_: any, node: any) => {
    if (!graphData) return
    const raw = graphData.nodes.find((n) => n.id === node.id)
    if (raw) {
      setSelectedNode(raw)
      if (raw.type === "concept" && raw.data.id && onSelectConcept) {
        onSelectConcept(raw.data.id)
      }
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#04070D]">
      {/* Top Controls Header */}
      <div className="shrink-0 p-3 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#070B14]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Brain className={cn("h-4 w-4", accentConfig.activeText)} />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Personal Knowledge Graph
            </h3>
          </div>

          {graphData?.stats && (
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <Badge variant="secondary" className="text-[10px] py-0 px-2 font-mono">
                {graphData.stats.total_memories} Concepts
              </Badge>
              <Badge variant="secondary" className="text-[10px] py-0 px-2 font-mono">
                {graphData.stats.documents} Docs
              </Badge>
              <Badge variant="secondary" className="text-[10px] py-0 px-2 font-mono">
                {graphData.stats.threads} Chats
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search in Graph */}
          <div className="relative w-40 sm:w-48">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find in network..."
              className="h-8 pl-8 pr-2 text-xs bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/10"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-slate-100 dark:bg-white/[0.03]">
            <button
              onClick={() => setFilterType("all")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer",
                filterType === "all"
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("concept")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer",
                filterType === "concept"
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              Concepts
            </button>
            <button
              onClick={() => setFilterType("document")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer",
                filterType === "document"
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              Docs
            </button>
            <button
              onClick={() => setFilterType("thread")}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer",
                filterType === "thread"
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              Chats
            </button>
          </div>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            onClick={loadGraph}
            disabled={isLoading}
            className="h-8 w-8 rounded-lg cursor-pointer"
            title="Refresh network graph"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </Button>

          {/* Fullscreen Toggle */}
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              className="h-8 w-8 rounded-lg cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Network Canvas */}
      <div className="flex-1 w-full h-full relative">
        {isLoading && !graphData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 bg-slate-50/80 dark:bg-[#04070D]/80 backdrop-blur-xs">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
            <p className="text-xs text-slate-500 font-medium">Synthesizing personal knowledge graph...</p>
          </div>
        ) : null}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.8}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#475569" className="opacity-30" />
          <Controls className="!bg-white dark:!bg-[#0A0F18] !border-slate-200 dark:!border-white/10 !rounded-xl !shadow-lg" />
          <MiniMap
            zoomable
            pannable
            className="!bg-white/80 dark:!bg-[#080d1a]/80 !border-slate-200 dark:!border-white/10 !rounded-xl overflow-hidden shadow-md"
            nodeColor={(n) => {
              if (n.type === "user") return "#6366f1"
              if (n.type === "document") return "#f59e0b"
              if (n.type === "thread") return "#0284c7"
              return "#10b981"
            }}
          />
        </ReactFlow>

        {/* Selected Node Inspector Drawer / Card */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 z-20 w-80 rounded-2xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-md shadow-2xl p-4 animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {selectedNode.type} Details
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              {selectedNode.type === "concept" && (
                <>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {selectedNode.data.category || "General"}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-500">
                      Confidence: {Math.round((selectedNode.data.confidence || 1) * 100)}%
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium break-words">
                    {selectedNode.data.full_text || selectedNode.label}
                  </p>
                  {selectedNode.data.created_at && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span>Learned: {new Date(selectedNode.data.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              )}

              {selectedNode.type === "document" && (
                <>
                  <p className="font-bold text-slate-900 dark:text-white break-words">
                    {selectedNode.data.filename || selectedNode.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                    <div>Format: <span className="font-semibold uppercase">{selectedNode.data.file_type}</span></div>
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
                  <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                    <div>Pinned: {selectedNode.data.is_pinned ? "Yes" : "No"}</div>
                    {selectedNode.data.updated_at && (
                      <div>Last active: {new Date(selectedNode.data.updated_at).toLocaleDateString()}</div>
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
                  <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-400">
                    Central entity linking all learned preferences, ingested documents, and conversations.
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
