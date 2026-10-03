import { api } from "./axios";
import {
  UserMemory,
  UserMemoryListResponse,
  UserMemoryCreate,
  UserMemoryUpdate,
  KnowledgeGraphResponse,
} from "@/types/memory";

export async function fetchMemoriesApi(params?: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<UserMemory[]> {
  const response = await api.get<UserMemoryListResponse>("/memory", {
    params: {
      category: params?.category && params.category !== "all" ? params.category : undefined,
      search: params?.search ? params.search.trim() : undefined,
      limit: params?.limit || 100,
    },
  });
  return response.data.memories;
}

export async function addMemoryApi(payload: UserMemoryCreate): Promise<UserMemory> {
  const response = await api.post<UserMemory>("/memory", payload);
  return response.data;
}

export async function updateMemoryApi(id: string, payload: UserMemoryUpdate): Promise<UserMemory> {
  const response = await api.put<UserMemory>(`/memory/${id}`, payload);
  return response.data;
}

export async function searchMemoriesApi(q: string, limit = 5): Promise<UserMemory[]> {
  const response = await api.get<UserMemory[]>("/memory/search", {
    params: { q, limit },
  });
  return response.data;
}

export async function deleteMemoryApi(id: string): Promise<void> {
  await api.delete(`/memory/${id}`);
}

export async function fetchKnowledgeGraphApi(): Promise<KnowledgeGraphResponse> {
  const response = await api.get<KnowledgeGraphResponse>("/memory/graph");
  return response.data;
}

