import { api } from "./axios";
import { PinItem, PinListResponse } from "@/types/pin";

export async function fetchPinsApi(conversationId?: string): Promise<PinItem[]> {
  const response = await api.get<PinListResponse>("/pins", {
    params: conversationId ? { conversation_id: conversationId } : {},
  });
  return response.data.pins;
}

export async function pinMessageApi(
  conversationId: string,
  messageId: string,
  note?: string
): Promise<PinItem> {
  const response = await api.post<PinItem>("/pins", {
    conversation_id: conversationId,
    message_id: messageId,
    note,
  });
  return response.data;
}

export async function unpinMessageApi(pinId: string): Promise<void> {
  await api.delete(`/pins/${pinId}`);
}

export async function unpinMessageByMessageIdApi(
  messageId: string,
  conversationId?: string
): Promise<void> {
  await api.delete(`/pins/message/${messageId}`, {
    params: conversationId ? { conversation_id: conversationId } : {},
  });
}
