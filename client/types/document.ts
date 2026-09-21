export interface UserDocument {
  id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  total_pages: number;
  total_chunks: number;
  created_at: string;
}

export interface DocumentListResponse {
  documents: UserDocument[];
}

export interface DocumentSourceItem {
  filename: string;
  page_number?: number;
  chunk_index?: number;
  similarity_score?: number;
}

export interface DocumentQueryRequest {
  query: string;
  document_id?: string;
}

export interface DocumentQueryResponse {
  query: string;
  answer: string;
  is_grounded: boolean;
  sources: DocumentSourceItem[];
}
