import { api } from "./axios";
import {
  UserDocument,
  DocumentListResponse,
  DocumentQueryRequest,
  DocumentQueryResponse,
} from "@/types/document";

export const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const ALLOWED_DOCUMENT_EXTENSIONS = [".pdf", ".docx"];

export function validateDocumentFile(file: File): { isValid: boolean; error?: string } {
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `Unsupported file format. Please upload a PDF (.pdf) or Word (.docx) file.`,
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: `File '${file.name}' is empty.`,
    };
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File '${file.name}' (${sizeInMb} MB) exceeds the maximum allowed size of 50 MB.`,
    };
  }

  return { isValid: true };
}

export interface SensitiveDataFinding {
  category: string;
  count: number;
  sample: string;
  pages: number[];
}

export interface SensitiveDataErrorPayload {
  error_code: "SENSITIVE_DATA_DETECTED";
  message: string;
  filename: string;
  findings: SensitiveDataFinding[];
}

export class SensitiveDataError extends Error {
  payload: SensitiveDataErrorPayload;
  constructor(payload: SensitiveDataErrorPayload) {
    super(payload.message || "Sensitive data detected by safety guardrails.");
    this.name = "SensitiveDataError";
    this.payload = payload;
  }
}

export async function uploadDocumentApi(
  file: File,
  confirmSensitive: boolean = false
): Promise<UserDocument> {
  const validation = validateDocumentFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error || "Invalid file for upload");
  }

  const formData = new FormData();
  formData.append("file", file);
  if (confirmSensitive) {
    formData.append("confirm_sensitive", "true");
  }

  try {
    const response = await api.post<UserDocument>("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (err: any) {
    const detail = err.response?.data?.detail;
    if (
      err.response?.status === 409 &&
      detail &&
      typeof detail === "object" &&
      detail.error_code === "SENSITIVE_DATA_DETECTED"
    ) {
      throw new SensitiveDataError(detail as SensitiveDataErrorPayload);
    }
    throw err;
  }
}

export async function fetchDocumentsApi(): Promise<UserDocument[]> {
  const response = await api.get<DocumentListResponse>("/documents");
  return response.data.documents || [];
}

export async function fetchDocumentByIdApi(documentId: string): Promise<UserDocument> {
  const response = await api.get<UserDocument>(`/documents/${documentId}`);
  return response.data;
}

export async function deleteDocumentApi(documentId: string): Promise<void> {
  await api.delete(`/documents/${documentId}`);
}

export async function queryDocumentsApi(
  query: string,
  documentId?: string
): Promise<DocumentQueryResponse> {
  const payload: DocumentQueryRequest = {
    query,
    document_id: documentId,
  };
  const response = await api.post<DocumentQueryResponse>("/documents/query", payload);
  return response.data;
}
