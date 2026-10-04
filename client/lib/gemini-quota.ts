import { toast } from "@/components/ui/sonner"

/**
 * Checks whether an error object, string, or HTTP response corresponds to a
 * Google Gemini token/quota limit exhaustion (HTTP 429 / RESOURCE_EXHAUSTED).
 */
export function isGeminiQuotaError(err: any): boolean {
  if (!err) return false

  // Direct error code check
  if (err.error_code === "GEMINI_QUOTA_EXCEEDED" || err.code === "GEMINI_QUOTA_EXCEEDED") {
    return true
  }

  // Axios response status 429
  if (err.response?.status === 429) {
    return true
  }

  // Axios response payload check
  const detail = err.response?.data?.detail
  if (detail) {
    if (typeof detail === "object") {
      if (detail.error_code === "GEMINI_QUOTA_EXCEEDED") return true
      if (typeof detail.message === "string" && isQuotaString(detail.message)) return true
    } else if (typeof detail === "string" && isQuotaString(detail)) {
      return true
    }
  }

  // Check error message or string representation
  const message = err.message || (typeof err === "string" ? err : "")
  if (isQuotaString(message)) {
    return true
  }

  return false
}

function isQuotaString(str: string): boolean {
  const lower = str.toLowerCase()
  return (
    lower.includes("gemini_quota_exceeded") ||
    lower.includes("resource_exhausted") ||
    (lower.includes("gemini") && (lower.includes("quota") || lower.includes("rate limit") || lower.includes("token limit"))) ||
    (lower.includes("token quota") && lower.includes("exceed"))
  )
}

/**
 * Renders a Shadcn/Sonner toast alert notifying the user of Google Gemini quota exhaustion.
 */
export function showGeminiQuotaToast(customMessage?: string): void {
  toast.error("Google Gemini Token Quota Exceeded", {
    description:
      customMessage ||
      "Google Gemini embedding token quota has been exceeded. Please wait a moment or check your API quota limits.",
    duration: 6000,
    action: {
      label: "Dismiss",
      onClick: () => {},
    },
  })
}
