export type MemoryCategory =
  | "tech_preference"
  | "coding_convention"
  | "project"
  | "interest"
  | "general"

export interface UserMemory {
  id: string
  user_id: string
  memory_text: string
  category: string
  confidence_score: number
  created_at: string
  updated_at: string
}

export interface UserMemoryListResponse {
  memories: UserMemory[]
}

export interface UserMemoryCreate {
  memory_text: string
  category?: string
  confidence_score?: number
}

export interface UserMemoryUpdate {
  memory_text?: string
  category?: string
  confidence_score?: number
}

export interface KnowledgeGraphNode {
  id: string
  label: string
  type: "user" | "concept" | "document" | "thread"
  category?: string
  data: {
    id?: string
    name?: string
    email?: string
    full_text?: string
    category?: string
    confidence?: number
    filename?: string
    file_type?: string
    file_size?: number
    total_pages?: number
    total_chunks?: number
    title?: string
    is_pinned?: boolean
    created_at?: string
    updated_at?: string
    memoriesCount?: number
    documentsCount?: number
    threadsCount?: number
    [key: string]: any
  }
}

export interface KnowledgeGraphEdge {
  id: string
  source: string
  target: string
  label?: string
  relationship?: string
}

export interface KnowledgeGraphStats {
  total_memories: number
  tech_preferences: number
  coding_conventions: number
  projects: number
  interests: number
  documents: number
  threads: number
  total_nodes: number
  total_edges: number
}

export interface KnowledgeGraphResponse {
  nodes: KnowledgeGraphNode[]
  edges: KnowledgeGraphEdge[]
  stats: KnowledgeGraphStats
}
