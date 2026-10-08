import { Artifact, ArtifactType } from "@/types/artifact"

/**
 * Normalizes input type string or MIME type to standard ArtifactType.
 */
export function normalizeArtifactType(rawType?: string, rawLanguage?: string): ArtifactType {
  const typeLower = (rawType || "").toLowerCase().trim()
  const langLower = (rawLanguage || "").toLowerCase().trim()

  if (
    typeLower.includes("html") ||
    typeLower === "text/html" ||
    langLower === "html" ||
    langLower === "htm"
  ) {
    return "html"
  }

  if (
    typeLower.includes("svg") ||
    typeLower === "image/svg+xml" ||
    langLower === "svg"
  ) {
    return "svg"
  }

  if (
    typeLower.includes("mermaid") ||
    langLower === "mermaid"
  ) {
    return "mermaid"
  }

  if (
    typeLower.includes("markdown") ||
    typeLower === "text/markdown" ||
    typeLower === "application/vnd.ant.markdown" ||
    langLower === "markdown" ||
    langLower === "md"
  ) {
    return "markdown"
  }

  return "code"
}

/**
 * Determine a safe, clean file download name with correct extension.
 */
export function getArtifactFileName(artifact: Artifact): string {
  const cleanTitle = (artifact.title || artifact.identifier || "artifact")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")

  const lang = (artifact.language || "").toLowerCase().trim()

  switch (artifact.type) {
    case "html":
      return `${cleanTitle || "preview"}.html`
    case "svg":
      return `${cleanTitle || "vector"}.svg`
    case "mermaid":
      return `${cleanTitle || "diagram"}.mmd`
    case "markdown":
      return `${cleanTitle || "document"}.md`
    case "code":
    default: {
      const extMap: Record<string, string> = {
        python: "py",
        py: "py",
        javascript: "js",
        js: "js",
        typescript: "ts",
        ts: "ts",
        tsx: "tsx",
        jsx: "jsx",
        json: "json",
        html: "html",
        css: "css",
        scss: "scss",
        sql: "sql",
        rust: "rs",
        rs: "rs",
        go: "go",
        golang: "go",
        java: "java",
        c: "c",
        cpp: "cpp",
        "c++": "cpp",
        csharp: "cs",
        cs: "cs",
        shell: "sh",
        bash: "sh",
        sh: "sh",
        zsh: "sh",
        yaml: "yaml",
        yml: "yaml",
        dockerfile: "dockerfile",
      }
      const ext = extMap[lang] || "txt"
      return `${cleanTitle || "code"}.${ext}`
    }
  }
}

/**
 * Helper to generate human-readable language or type label.
 */
export function getArtifactDisplayType(artifact: Artifact): string {
  switch (artifact.type) {
    case "html":
      return "HTML App"
    case "svg":
      return "SVG Vector"
    case "mermaid":
      return "Mermaid Diagram"
    case "markdown":
      return "Markdown Doc"
    case "code":
      return (artifact.language ? artifact.language.toUpperCase() : "Code")
    default:
      return "Artifact"
  }
}

/**
 * Parses XML/HTML attribute style string: identifier="..." title="..." type="..." language="..."
 */
function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const regex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(attrString)) !== null) {
    const key = match[1].toLowerCase()
    const value = match[2] ?? match[3] ?? match[4] ?? ""
    attrs[key] = value
  }
  return attrs
}

/**
 * Strips markdown code block fences (e.g. ```python ... ```) if present.
 */
export function stripMarkdownCodeFences(rawCode: string): string {
  if (!rawCode) return ""
  let code = rawCode.trim()

  if (code.startsWith("```")) {
    const lines = code.split("\n")
    if (lines.length > 0 && lines[0].trim().startsWith("```")) {
      lines.shift()
    }
    if (lines.length > 0 && lines[lines.length - 1].trim().startsWith("```")) {
      lines.pop()
    }
    code = lines.join("\n").trim()
  }

  return code
}

/**
 * Extracts artifact tags (<antArtifact ...>...</antArtifact> or <artifact ...>...</artifact>)
 * from assistant markdown responses, returning extracted artifacts and clean content.
 */
export function extractArtifactsFromContent(
  rawContent: string,
  messageId?: string
): { cleanContent: string; artifacts: Artifact[] } {
  if (!rawContent) {
    return { cleanContent: "", artifacts: [] }
  }

  const artifacts: Artifact[] = []
  let cleanContent = rawContent

  // Regex matching <antArtifact ...>...</antArtifact> or <artifact ...>...</artifact>
  const tagRegex = /<(antArtifact|artifact)([\s\S]*?)>([\s\S]*?)<\/\1>/gi

  let match: RegExpExecArray | null
  let matchIndex = 0

  while ((match = tagRegex.exec(rawContent)) !== null) {
    matchIndex++
    const attrString = match[2] || ""
    const rawInner = (match[3] || "").trim()
    const innerContent = stripMarkdownCodeFences(rawInner)
    const attrs = parseAttributes(attrString)

    const identifier = attrs["identifier"] || attrs["id"] || `artifact-${matchIndex}`
    const rawType = attrs["type"] || "code"
    const language = attrs["language"] || attrs["lang"] || (rawType.includes("html") ? "html" : "plaintext")
    const title = attrs["title"] || attrs["name"] || (attrs["identifier"] ? attrs["identifier"] : `Artifact ${matchIndex}`)
    const normalizedType = normalizeArtifactType(rawType, language)

    const artifact: Artifact = {
      id: `${messageId || "msg"}-${identifier}-${matchIndex}`,
      identifier,
      title,
      type: normalizedType,
      language,
      content: innerContent,
      messageId,
      createdAt: new Date(),
    }

    artifacts.push(artifact)
  }

  // Remove the raw tags from cleanContent, or replace them with a marker if needed
  if (artifacts.length > 0) {
    cleanContent = cleanContent.replace(tagRegex, "").trim()
  }

  return { cleanContent, artifacts }
}

/**
 * Instantly constructs an Artifact from a standard code block.
 */
export function createArtifactFromCode(
  code: string,
  language: string,
  title?: string,
  messageId?: string
): Artifact {
  const normType = normalizeArtifactType(undefined, language)
  const cleanCode = stripMarkdownCodeFences(code)
  const defaultTitle =
    title ||
    (normType === "html"
      ? "HTML App Preview"
      : normType === "mermaid"
      ? "System Flow Diagram"
      : normType === "svg"
      ? "SVG Graphic"
      : normType === "markdown"
      ? "Document Note"
      : `${language.toUpperCase()} Snippet`)

  return {
    id: `custom-art-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    identifier: defaultTitle.toLowerCase().replace(/\s+/g, "-"),
    title: defaultTitle,
    type: normType,
    language: language || "plaintext",
    content: cleanCode,
    messageId,
    createdAt: new Date(),
  }
}

/**
 * Formats HTML content for sandboxed iframe preview, ensuring responsive viewport
 * and optional Tailwind styling support if not already present.
 */
export function prepareHtmlForSandboxedPreview(htmlContent: string): string {
  const trimmed = htmlContent.trim()
  const hasHtmlTag = /<html[\s>]/i.test(trimmed)
  const hasBodyTag = /<body[\s>]/i.test(trimmed)
  const hasTailwind = /tailwindcss|cdn\.tailwindcss\.com/i.test(trimmed)

  if (hasHtmlTag && hasBodyTag) {
    // If it's a full document, ensure viewport & charset exist
    let result = trimmed
    if (!/<meta\s+name=["']viewport["']/i.test(result)) {
      result = result.replace(
        /<head[\s>]/i,
        `<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />`
      )
    }
    // Inject Tailwind CDN if not present and Tailwind classes are likely used
    if (!hasTailwind && /(?:class="[^"]*(?:flex|grid|p-|m-|text-|bg-|rounded|border)[^"]*")/i.test(result)) {
      result = result.replace(
        /<\/head>/i,
        `  <script src="https://cdn.tailwindcss.com"></script>\n</head>`
      )
    }
    return result
  }

  // Wrap partial HTML snippet inside a full modern HTML5 template
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 1.5rem;
      color: #1e293b;
      background-color: #f8fafc;
      min-height: 100vh;
    }
    @media (prefers-color-scheme: dark) {
      body {
        color: #f1f5f9;
        background-color: #0b0f19;
      }
    }
  </style>
</head>
<body>
${trimmed}
</body>
</html>`
}
