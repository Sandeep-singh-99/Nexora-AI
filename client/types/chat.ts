export type GenerativeUIResponse = {
  type: string;
  props: Record<string, unknown>;
};

export type SearchResultItem = {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string | Date;
  ui?: GenerativeUIResponse;
  thinkingTime?: string;
  thinkingText?: string;
  statusLabel?: string;
  isSearching?: boolean;
  searchQuery?: string;
  searchResults?: SearchResultItem[];
  toolsUsed?: string[];
};

export type ConversationSession = {
  id: string;
  title: string;
  updatedAt: string;
  preview: string;
  model: string;
  category: "Today" | "Yesterday" | "Previous 7 Days";
  isPinned?: boolean;
  isArchived?: boolean;
};

export type AIModelOption = {
  id: string;
  name: string;
  provider: string;
  badge?: string;
  description: string;
  icon?: string;
};

export interface ApiMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  tokens_used?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ApiConversation {
  id: string;
  user_id: string;
  title: string;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  messages?: ApiMessage[];
}

export interface ApiConversationListResponse {
  conversations: ApiConversation[];
}
