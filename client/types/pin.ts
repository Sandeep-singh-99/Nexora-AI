import { ApiMessage } from "./chat";

export interface PinItem {
  id: string;
  user_id: string;
  conversation_id: string;
  message_id: string;
  note?: string | null;
  created_at: string;
  message?: ApiMessage | null;
}

export interface PinListResponse {
  pins: PinItem[];
}
