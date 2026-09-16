import { api } from "./axios";
import { GenerativeUIResponse } from "@/types/chat";

export interface ChatRequest {
  message: string;
  thread_id?: string;
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
  | { type: "status"; label: string; node?: string }
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
  | { type: "error"; message: string };

export const sendChatMessageApi = async (
  data: ChatRequest
): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>("/ai/chat", data);
  return response.data;
};

export async function sendStreamingChatMessageApi(
  payload: ChatRequest,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch("http://localhost:8000/api/v1/ai/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
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
          const event: SSEEvent = JSON.parse(jsonStr);
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
