import { api } from "./axios";
import { UserMemory, UserMemoryListResponse, UserMemoryCreate } from "@/types/memory";

export async function fetchMemoriesApi(limit = 100): Promise<UserMemory[]> {
  const response = await api.get<UserMemoryListResponse>("/memory", {
    params: { limit },
  });
  return response.data.memories;
}

export async function addMemoryApi(payload: UserMemoryCreate): Promise<UserMemory> {
  const response = await api.post<UserMemory>("/memory", payload);
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
