export interface UserMemory {
  id: string;
  user_id: string;
  memory_text: string;
  category: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface UserMemoryListResponse {
  memories: UserMemory[];
}

export interface UserMemoryCreate {
  memory_text: string;
  category?: string;
}
