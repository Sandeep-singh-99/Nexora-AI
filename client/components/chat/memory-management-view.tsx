"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Brain,
  Search,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  Code2,
  Layers,
  FolderGit2,
  Bookmark,
  Sparkles,
  Network,
  ListFilter,
  CheckCircle2,
  Percent,
  Calendar,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { UserMemory, MemoryCategory } from "@/types/memory"
import {
  fetchMemoriesApi,
  addMemoryApi,
  updateMemoryApi,
  deleteMemoryApi,
} from "@/lib/api/memory"
import { KnowledgeGraphView, getCategoryBadgeConfig } from "./knowledge-graph-view"
import { useAppearance } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

interface MemoryManagementViewProps {
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
}

const CATEGORY_OPTIONS: { id: string; label: string; icon: any; placeholder: string }[] = [
  {
    id: "all",
    label: "All Facts",
    icon: Sparkles,
    placeholder: "Search all facts...",
  },
  {
    id: "tech_preference",
    label: "Tech Preferences",
    icon: Code2,
    placeholder: "e.g. Prefers Next.js App Router, Tailwind CSS...",
  },
  {
    id: "coding_convention",
    label: "Coding Conventions",
    icon: Layers,
    placeholder: "e.g. Enforce strict TypeScript types, atomic Git commits...",
  },
  {
    id: "project",
    label: "Projects",
    icon: FolderGit2,
    placeholder: "e.g. Building Nexora AI, a modern multi-agent studio...",
  },
  {
    id: "interest",
    label: "Interests",
    icon: Bookmark,
    placeholder: "e.g. Deep learning, agentic workflows, WebAssembly...",
  },
  {
    id: "general",
    label: "General",
    icon: Brain,
    placeholder: "e.g. Prefers concise bulleted answers...",
  },
]

export function MemoryManagementView({
  onToggleFullscreen,
  isFullscreen = false,
}: MemoryManagementViewProps) {
  const { accentConfig } = useAppearance()

  // Primary view mode: "list" (Dashboard) or "graph" (Knowledge Graph)
  const [viewMode, setViewMode] = useState<"list" | "graph">("list")

  // State
  const [memories, setMemories] = useState<UserMemory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Add memory state
  const [isAddingOpen, setIsAddingOpen] = useState(false)
  const [newText, setNewText] = useState("")
  const [newCategory, setNewCategory] = useState<string>("tech_preference")
  const [isAdding, setIsAdding] = useState(false)

  // Edit memory state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Load memories
  const loadMemories = async () => {
    setIsLoading(true)
    try {
      const data = await fetchMemoriesApi({ limit: 150 })
      setMemories(data)
    } catch (err) {
      console.error("Failed to load user memories:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMemories()
  }, [])

  // Filtered memories
  const filteredMemories = useMemo(() => {
    return memories.filter((mem) => {
      // Category match
      if (selectedCategory !== "all") {
        const norm = (mem.category || "general").toLowerCase().replace(" ", "_")
        const target = selectedCategory.toLowerCase().replace(" ", "_")
        if (!norm.includes(target) && !target.includes(norm)) {
          return false
        }
      }
      // Search text match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const text = mem.memory_text.toLowerCase()
        const cat = (mem.category || "").toLowerCase()
        return text.includes(q) || cat.includes(q)
      }
      return true
    })
  }, [memories, selectedCategory, searchQuery])

  // Category counts
  const counts = useMemo(() => {
    const stats: Record<string, number> = {
      all: memories.length,
      tech_preference: 0,
      coding_convention: 0,
      project: 0,
      interest: 0,
      general: 0,
    }

    for (const m of memories) {
      const cat = (m.category || "general").toLowerCase()
      if (cat.includes("tech")) stats.tech_preference++
      else if (cat.includes("convention") || cat.includes("coding")) stats.coding_convention++
      else if (cat.includes("project")) stats.project++
      else if (cat.includes("interest")) stats.interest++
      else stats.general++
    }

    return stats
  }, [memories])

  // Handle Add Memory
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newText.trim()) return
    setIsAdding(true)
    try {
      const created = await addMemoryApi({
        memory_text: newText.trim(),
        category: newCategory,
        confidence_score: 1.0,
      })
      setMemories((prev) => [created, ...prev])
      setNewText("")
      setIsAddingOpen(false)
    } catch (err) {
      console.error("Failed to add memory:", err)
    } finally {
      setIsAdding(false)
    }
  }

  // Handle Start Edit
  const handleStartEdit = (mem: UserMemory) => {
    setEditingId(mem.id)
    setEditText(mem.memory_text)
    setEditCategory(mem.category || "general")
  }

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText("")
    setEditCategory("")
  }

  // Handle Save Edit
  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) return
    setIsUpdating(true)
    try {
      const updated = await updateMemoryApi(id, {
        memory_text: editText.trim(),
        category: editCategory,
      })
      setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)))
      setEditingId(null)
    } catch (err) {
      console.error("Failed to update memory:", err)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle Delete Memory
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteMemoryApi(id)
      setMemories((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      console.error("Failed to delete memory:", err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* View Switcher & Title Bar */}
      <div className="shrink-0 pb-4 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Brain className={cn("h-5 w-5", accentConfig.activeText)} />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              AI Memory & Personal Knowledge Graph
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Learned facts, tech preferences, and connected context across chats and uploaded documents.
          </p>
        </div>

        {/* Mode Toggle: List vs Graph */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-xl border border-slate-200 dark:border-white/10 p-1 bg-slate-100 dark:bg-white/[0.03]">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "list"
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Facts Dashboard</span>
            </button>
            <button
              onClick={() => setViewMode("graph")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "graph"
                  ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Network className="h-3.5 w-3.5 text-indigo-500" />
              <span>Knowledge Graph</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: GRAPH */}
      {viewMode === "graph" ? (
        <div className="flex-1 min-h-[460px] w-full pt-3">
          <KnowledgeGraphView
            isFullscreen={isFullscreen}
            onToggleFullscreen={onToggleFullscreen}
            onSelectConcept={(conceptId) => {
              // When user clicks a concept in the graph, switch to list and focus it
              setViewMode("list")
              const target = memories.find((m) => m.id === conceptId)
              if (target) {
                setSearchQuery(target.memory_text)
              }
            }}
          />
        </div>
      ) : (
        /* VIEW: DASHBOARD / LIST */
        <div className="flex-1 overflow-y-auto pt-4 space-y-5 pr-1">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "p-3 rounded-xl border text-left transition-all cursor-pointer",
                selectedCategory === "all"
                  ? cn("ring-2", accentConfig.activeBg, accentConfig.activeBorder, accentConfig.ring)
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between text-slate-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white">
                  {counts.all}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1">Total Facts</p>
            </button>

            <button
              onClick={() => setSelectedCategory("tech_preference")}
              className={cn(
                "p-3 rounded-xl border text-left transition-all cursor-pointer",
                selectedCategory === "tech_preference"
                  ? "ring-2 ring-emerald-500 border-emerald-500/50 bg-emerald-500/10"
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between text-emerald-500">
                <Code2 className="h-3.5 w-3.5" />
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {counts.tech_preference}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1">Tech Stack</p>
            </button>

            <button
              onClick={() => setSelectedCategory("coding_convention")}
              className={cn(
                "p-3 rounded-xl border text-left transition-all cursor-pointer",
                selectedCategory === "coding_convention"
                  ? "ring-2 ring-purple-500 border-purple-500/50 bg-purple-500/10"
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between text-purple-500">
                <Layers className="h-3.5 w-3.5" />
                <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
                  {counts.coding_convention}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1">Conventions</p>
            </button>

            <button
              onClick={() => setSelectedCategory("project")}
              className={cn(
                "p-3 rounded-xl border text-left transition-all cursor-pointer",
                selectedCategory === "project"
                  ? "ring-2 ring-blue-500 border-blue-500/50 bg-blue-500/10"
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between text-blue-500">
                <FolderGit2 className="h-3.5 w-3.5" />
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                  {counts.project}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1">Projects</p>
            </button>

            <button
              onClick={() => setSelectedCategory("interest")}
              className={cn(
                "p-3 rounded-xl border text-left transition-all cursor-pointer",
                selectedCategory === "interest"
                  ? "ring-2 ring-amber-500 border-amber-500/50 bg-amber-500/10"
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between text-amber-500">
                <Bookmark className="h-3.5 w-3.5" />
                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                  {counts.interest}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1">Interests</p>
            </button>
          </div>

          {/* Search Bar & Action Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search learned facts (interests, tech preferences, projects)..."
                className="pl-9 pr-8 text-xs bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Button
              onClick={() => setIsAddingOpen(!isAddingOpen)}
              className={cn("text-white text-xs font-semibold cursor-pointer shrink-0 bg-gradient-to-r shadow-xs", accentConfig.gradient)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Add Fact</span>
            </Button>
          </div>

          {/* Expandable Add Fact Card */}
          {isAddingOpen && (
            <form
              onSubmit={handleAddMemory}
              className="p-4 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50/70 dark:bg-white/[0.03] space-y-3 animate-in fade-in-0 duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Teach Nexora a New Fact
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingOpen(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <Input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="e.g. 'User prefers using PostgreSQL with pgvector for semantic retrieval'..."
                className="text-xs bg-white dark:bg-[#070b14] border-slate-200 dark:border-white/15"
                autoFocus
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Category:</span>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="text-xs rounded-lg px-2.5 py-1 bg-white dark:bg-[#070b14] border border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="tech_preference">Tech Preference</option>
                    <option value="coding_convention">Coding Convention</option>
                    <option value="project">Project</option>
                    <option value="interest">Interest</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddingOpen(false)}
                    className="text-xs h-8 px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAdding || !newText.trim()}
                    className={cn("text-white text-xs h-8 px-4 font-semibold bg-gradient-to-r", accentConfig.gradient)}
                  >
                    {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                    Save Memory
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Facts List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Showing {filteredMemories.length} of {memories.length} facts
                {selectedCategory !== "all" && ` in ${selectedCategory.replace("_", " ")}`}
              </span>
              {filteredMemories.length > 0 && (
                <span className="text-[10px] font-mono text-slate-400">pgvector cosine indexed</span>
              )}
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 className={cn("h-5 w-5 animate-spin", accentConfig.activeText)} />
                <span>Querying neural memory store...</span>
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 p-8 text-center text-xs text-slate-400 space-y-2">
                <Brain className="h-6 w-6 mx-auto text-slate-400/60" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {searchQuery ? "No matching facts found." : "No memories in this category yet."}
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Nexora automatically extracts durable preferences during chats, or you can click "Add Fact" above to record one now.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredMemories.map((mem) => {
                  const isEditing = editingId === mem.id
                  const isDeleting = deletingId === mem.id
                  const catConfig = getCategoryBadgeConfig(mem.category)
                  const Icon = catConfig.icon

                  if (isEditing) {
                    return (
                      <div
                        key={mem.id}
                        className="rounded-xl border border-indigo-500/50 bg-indigo-500/5 p-3.5 space-y-3 animate-in fade-in-0 duration-150"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Edit3 className="h-3.5 w-3.5 text-indigo-500" />
                            Edit Fact
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">ID: {mem.id.slice(0, 8)}...</span>
                        </div>

                        <Input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="text-xs bg-white dark:bg-[#070b14]"
                          autoFocus
                        />

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400">Category:</span>
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="text-xs rounded-lg px-2.5 py-1 bg-white dark:bg-[#070b14] border border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-200"
                            >
                              <option value="tech_preference">Tech Preference</option>
                              <option value="coding_convention">Coding Convention</option>
                              <option value="project">Project</option>
                              <option value="interest">Interest</option>
                              <option value="general">General</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-7 text-xs px-2.5"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleSaveEdit(mem.id)}
                              disabled={isUpdating || !editText.trim()}
                              className={cn("h-7 text-xs px-3 text-white font-semibold bg-gradient-to-r", accentConfig.gradient)}
                            >
                              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={mem.id}
                      className={cn(
                        "group rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3 transition-all flex items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-white/25",
                        isDeleting && "opacity-50 pointer-events-none"
                      )}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-2 py-0.5 shrink-0 flex items-center gap-1 border mt-0.5",
                            catConfig.bg,
                            catConfig.border,
                            catConfig.text
                          )}
                        >
                          <Icon className="h-2.5 w-2.5" />
                          <span>{catConfig.label}</span>
                        </Badge>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed break-words">
                            {mem.memory_text}
                          </p>

                          <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                              Confidence: {Math.round(mem.confidence_score * 100)}%
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {new Date(mem.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons: Edit & Delete */}
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => handleStartEdit(mem)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                          title="Edit fact"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(mem.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Forget this fact"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
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
      )}
    </div>
  )
}
