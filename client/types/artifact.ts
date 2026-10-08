export type ArtifactType = "code" | "markdown" | "html" | "svg" | "mermaid"

export interface Artifact {
  id: string
  identifier?: string
  title: string
  type: ArtifactType
  language?: string
  content: string
  messageId?: string
  createdAt?: string | Date
  version?: number
}

export type ArtifactPreviewMode = "preview" | "code"
export type ArtifactDeviceViewport = "responsive" | "desktop" | "tablet" | "mobile"
