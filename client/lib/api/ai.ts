import { api, getCookie } from "./axios";
import { GenerativeUIResponse } from "@/types/chat";
import { isGeminiQuotaError, showGeminiQuotaToast } from "@/lib/gemini-quota";
import { getCustomKeyHeaders, getCustomApiKeys } from "@/lib/custom-keys";

export interface ChatRequest {
  message: string;
  thread_id?: string;
  document_id?: string;
  model?: string;
  custom_chat_key?: string;
  custom_chat_provider?: string;
  custom_chat_model?: string;
  custom_embedding_key?: string;
  custom_embedding_provider?: string;
  custom_embedding_model?: string;
}

export interface ChatResponse {
  response: string;
  thread_id?: string;
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
}

export type SSEEvent =
  | { type: "status"; label: string; node?: string; agent?: string }
  | {
      type: "search";
      status: "searching" | "completed";
      query?: string;
      results?: SearchResultItem[];
    }
  | { type: "thinking"; content: string }
  | { type: "token"; content: string }
  | { type: "ui"; ui: GenerativeUIResponse }
  | { type: "end" }
  | { type: "custom_key_meta"; is_custom_key: boolean; provider?: string; model?: string }
  | { type: "error"; message: string; code?: string };

export interface DeleteAiConversationResponse {
  success: boolean;
  message: string;
  thread_id: string;
}

export function extractSafeString(content: any): string {
  if (content === null || content === undefined) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (!item) return "";
        if (typeof item === "string") return item;
        if (typeof item === "object") {
          return item.text || item.content || item.value || "";
        }
        return String(item);
      })
      .join("");
  }
  if (typeof content === "object") {
    return content.text || content.content || content.value || "";
  }
  return String(content);
}

export const sendChatMessageApi = async (
  data: ChatRequest
): Promise<ChatResponse> => {
  const keys = getCustomApiKeys();
  const enriched: ChatRequest = {
    ...data,
    custom_chat_key: data.custom_chat_key || keys.chatApiKey || undefined,
    custom_chat_provider: data.custom_chat_provider || keys.chatProvider || undefined,
    custom_chat_model: data.custom_chat_model || keys.chatModel || undefined,
    custom_embedding_key: data.custom_embedding_key || keys.embeddingApiKey || undefined,
    custom_embedding_provider: data.custom_embedding_provider || keys.embeddingProvider || undefined,
    custom_embedding_model: data.custom_embedding_model || keys.embeddingModel || undefined,
    model: data.model || keys.chatModel || "groq",
  };
  const response = await api.post<ChatResponse>("/ai/chat", enriched);
  if (response.data && response.data.response) {
    response.data.response = extractSafeString(response.data.response);
  }
  return response.data;
};

export const deleteAiChatConversationApi = async (
  threadId: string
): Promise<DeleteAiConversationResponse> => {
  const response = await api.delete<DeleteAiConversationResponse>(`/ai/chat/${threadId}`);
  return response.data;
};

export async function sendStreamingChatMessageApi(
  payload: ChatRequest,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const customKeys = getCustomApiKeys();

  const enrichedPayload: ChatRequest = {
    ...payload,
    custom_chat_key: payload.custom_chat_key || customKeys.chatApiKey || undefined,
    custom_chat_provider: payload.custom_chat_provider || customKeys.chatProvider || undefined,
    custom_chat_model: payload.custom_chat_model || customKeys.chatModel || undefined,
    custom_embedding_key: payload.custom_embedding_key || customKeys.embeddingApiKey || undefined,
    custom_embedding_provider: payload.custom_embedding_provider || customKeys.embeddingProvider || undefined,
    custom_embedding_model: payload.custom_embedding_model || customKeys.embeddingModel || undefined,
    model: payload.model || customKeys.chatModel || "groq",
  };

  const getHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...getCustomKeyHeaders(),
    };
    const csrfToken = getCookie("csrf_token");
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
    return headers;
  };

  let response = await fetch(`${baseUrl}/ai/chat/stream`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(enrichedPayload),
    signal,
  });

  // If token expired (401), attempt refreshing tokens once and retry
  if (response.status === 401) {
    try {
      await api.post("/auth/refresh");
      response = await fetch(`${baseUrl}/ai/chat/stream`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
        signal,
      });
    } catch {
      // Refresh failed; proceed with original response handling
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 429 || isGeminiQuotaError(errorData)) {
      showGeminiQuotaToast();
    }
    throw errorData;
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder("utf-8");

  if (!reader) return;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.replace("data: ", "").trim();
        if (!jsonStr) continue;

        try {
          const event: any = JSON.parse(jsonStr);
          if (event.type === "token" || event.type === "thinking") {
            event.content = extractSafeString(event.content);
          }
          if (event.type === "error" && (event.code === "GEMINI_QUOTA_EXCEEDED" || isGeminiQuotaError(event.message))) {
            showGeminiQuotaToast(event.message);
          }
          onEvent(event);
        } catch (e) {
          console.error("Error parsing SSE line:", e);
        }
      }
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.log("Stream manually stopped by user.");
      return;
    }
    throw err;
  } finally {
    reader.releaseLock();
  }
}
