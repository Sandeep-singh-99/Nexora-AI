import { api } from "./axios";
import { ApiConversation, ApiConversationListResponse, ApiMessage } from "@/types/chat";

export async function fetchConversationsApi(limit = 50, offset = 0): Promise<ApiConversation[]> {
  const response = await api.get<ApiConversationListResponse>("/chat/conversations", {
    params: { limit, offset },
  });
  return response.data.conversations;
}

export async function createConversationApi(title = "New Chat"): Promise<ApiConversation> {
  const response = await api.post<ApiConversation>("/chat/conversations", { title });
  return response.data;
}

export async function getConversationApi(id: string): Promise<ApiConversation> {
  const response = await api.get<ApiConversation>(`/chat/conversations/${id}`);
  return response.data;
}

export async function updateConversationApi(
  id: string,
  payload: { title?: string; is_pinned?: boolean; is_archived?: boolean }
): Promise<ApiConversation> {
  const response = await api.patch<ApiConversation>(`/chat/conversations/${id}`, payload);
  return response.data;
}

export async function deleteConversationApi(id: string): Promise<void> {
  await api.delete(`/chat/conversations/${id}`);
}

export async function deleteAllConversationsApi(): Promise<{ message: string; count: number }> {
  const response = await api.delete<{ message: string; count: number }>("/chat/conversations");
  return response.data;
}

export async function fetchConversationMessagesApi(id: string, limit = 100): Promise<ApiMessage[]> {
  const response = await api.get<ApiMessage[]>(`/chat/conversations/${id}/messages`, {
    params: { limit },
  });
  return response.data;
}

export async function addMessageApi(
  conversationId: string,
  content: string,
  role = "user"
): Promise<ApiMessage> {
  const response = await api.post<ApiMessage>(`/chat/conversations/${conversationId}/messages`, { content }, {
    params: { role },
  });
  return response.data;
}
