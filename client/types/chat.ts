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
  activeAgent?: string;
  activeNode?: string;
  isSearching?: boolean;
  searchQuery?: string;
  searchResults?: SearchResultItem[];
  toolsUsed?: string[];
  isCustomKey?: boolean;
  customProvider?: string;
  customModel?: string;
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
  model?: string;
  created_at: string;
  updated_at: string;
  messages?: ApiMessage[];
}

export interface ApiConversationListResponse {
  conversations: ApiConversation[];
}

export interface TimelinePoint {
  label: string;
  date: string;
  prebuilt_tokens: number;
  custom_tokens: number;
  total_tokens: number;
  requests: number;
}

export interface ProviderStat {
  provider: string;
  tokens: number;
  requests: number;
  percentage: number;
  models: Record<string, number>;
}

export interface ModelStat {
  model: string;
  provider: string;
  tokens: number;
  requests: number;
  percentage: number;
}

export interface TokenActivityItem {
  id: string;
  conversation_id: string;
  conversation_title?: string;
  role: string;
  provider: string;
  model: string;
  is_custom_key: boolean;
  tokens_used: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  created_at: string;
}

export interface TokenAnalyticsData {
  timeframe: "day" | "week" | "month" | "year" | "all";
  total_tokens: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  prebuilt_tokens: number;
  custom_tokens: number;
  prebuilt_percentage: number;
  custom_percentage: number;
  total_requests: number;
  prebuilt_requests: number;
  custom_requests: number;
  estimated_cost_usd?: number;
  avg_tokens_per_request?: number;
  top_provider?: string;
  top_model?: string;
  providers: ProviderStat[];
  models: ModelStat[];
  timeline: TimelinePoint[];
  recent_activity?: TokenActivityItem[];
}

