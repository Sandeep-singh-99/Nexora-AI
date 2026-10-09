import { api } from "./axios";
import { ApiConversation, ApiConversationListResponse, ApiMessage, TokenAnalyticsData } from "@/types/chat";

export async function fetchConversationsApi(limit = 50, offset = 0): Promise<ApiConversation[]> {
  const response = await api.get<ApiConversationListResponse>("/chat/conversations", {
    params: { limit, offset },
  });
  return response.data.conversations;
}

export async function createConversationApi(
  title?: string,
  message?: string,
  documentName?: string,
  model?: string
): Promise<ApiConversation> {
  const response = await api.post<ApiConversation>("/chat/conversations", {
    title: title || "New Chat",
    message,
    document_name: documentName,
    model: model || "groq",
  });
  return response.data;
}

export async function generateConversationTitleApi(
  conversationId: string,
  message: string,
  documentName?: string,
  assistantResponse?: string
): Promise<ApiConversation> {
  const response = await api.post<ApiConversation>(
    `/chat/conversations/${conversationId}/generate-title`,
    {
      message,
      document_name: documentName,
      assistant_response: assistantResponse,
    }
  );
  return response.data;
}

export async function getConversationApi(id: string): Promise<ApiConversation> {
  const response = await api.get<ApiConversation>(`/chat/conversations/${id}`);
  return response.data;
}

export async function updateConversationApi(
  id: string,
  payload: { title?: string; is_pinned?: boolean; is_archived?: boolean; model?: string }
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
  role = "user",
  metadata?: Record<string, unknown>
): Promise<ApiMessage> {
  const response = await api.post<ApiMessage>(
    `/chat/conversations/${conversationId}/messages`,
    { content, metadata },
    {
      params: { role },
    }
  );
  return response.data;
}

export async function fetchTokenAnalyticsApi(
  timeframe: "day" | "week" | "month" | "year" | "all" = "week"
): Promise<TokenAnalyticsData> {
  const response = await api.get<TokenAnalyticsData>("/chat/analytics", {
    params: { timeframe },
  });
  return response.data;
}
