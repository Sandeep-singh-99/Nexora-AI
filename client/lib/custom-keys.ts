"use client"

import { useState, useEffect } from "react"

export interface ModelOption {
  id: string
  name: string
  description?: string
}

export interface ProviderOption {
  id: string
  name: string
  description: string
  keyPrefixPlaceholder: string
  keyDocsUrl: string
  defaultModel: string
  models: ModelOption[]
}

export const CHAT_PROVIDERS: Record<string, ProviderOption> = {
  groq: {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast low-latency inference (Prebuilt Default)",
    keyPrefixPlaceholder: "gsk_... (Groq API Key)",
    keyDocsUrl: "https://console.groq.com/keys",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", description: "Best for reasoning, tools, and coding" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", description: "Lightning-fast lightweight model" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B 32k", description: "High-capacity mixture of experts" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B IT", description: "Google compact high-quality model" },
    ],
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    description: "Multimodal frontier reasoning & huge context",
    keyPrefixPlaceholder: "AIzaSy... (Google AI Studio Key)",
    keyDocsUrl: "https://aistudio.google.com/app/apikey",
    defaultModel: "gemini-2.0-flash",
    models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Fast next-gen multimodal reasoning" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "High-speed and cost-efficient" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Deep analysis & complex coding" },
    ],
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    description: "Frontier GPT-4o and reasoning models",
    keyPrefixPlaceholder: "sk-proj-... or sk-... (OpenAI Key)",
    keyDocsUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o-mini",
    models: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast, affordable, intelligent" },
      { id: "gpt-4o", name: "GPT-4o", description: "Omni multimodal flagship intelligence" },
      { id: "o3-mini", name: "o3-Mini", description: "Specialized math and STEM reasoning" },
    ],
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access 100+ open-source and proprietary models",
    keyPrefixPlaceholder: "sk-or-v1-... (OpenRouter Key)",
    keyDocsUrl: "https://openrouter.ai/keys",
    defaultModel: "deepseek/deepseek-r1",
    models: [
      { id: "deepseek/deepseek-r1", name: "DeepSeek R1", description: "Top open-source reasoning model" },
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", description: "Meta open-weights flagship" },
      { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", description: "Industry-leading reasoning & code" },
      { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B", description: "Excellent multilingual intelligence" },
    ],
  },
  other: {
    id: "other",
    name: "Other / Custom",
    description: "Custom OpenAI-compatible provider",
    keyPrefixPlaceholder: "api-key-... (Custom Key)",
    keyDocsUrl: "",
    defaultModel: "custom-model",
    models: [],
  },
}

export const EMBEDDING_PROVIDERS: Record<string, ProviderOption> = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    description: "Native 768-dimensional embeddings (Prebuilt Default)",
    keyPrefixPlaceholder: "AIzaSy... (Google Gemini Embeddings Key)",
    keyDocsUrl: "https://aistudio.google.com/app/apikey",
    defaultModel: "text-embedding-004",
    models: [
      { id: "text-embedding-004", name: "text-embedding-004", description: "Standard 768-dim vector embedding model" },
    ],
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    description: "High-precision vector embeddings (768 dimensions)",
    keyPrefixPlaceholder: "sk-proj-... or sk-... (OpenAI Key)",
    keyDocsUrl: "https://platform.openai.com/api-keys",
    defaultModel: "text-embedding-3-small",
    models: [
      { id: "text-embedding-3-small", name: "text-embedding-3-small", description: "Fast, cost-efficient 768-dim embeddings" },
      { id: "text-embedding-3-large", name: "text-embedding-3-large", description: "Highest precision embeddings" },
    ],
  },
  other: {
    id: "other",
    name: "Other / Custom",
    description: "Custom vector embedding provider",
    keyPrefixPlaceholder: "api-key-...",
    keyDocsUrl: "",
    defaultModel: "custom-embedding",
    models: [],
  },
}

export interface CustomApiKeys {
  chatProvider?: string
  chatModel?: string
  chatApiKey: string

  embeddingProvider?: string
  embeddingModel?: string
  embeddingApiKey: string
}

const STORAGE_KEY = "nexora_encrypted_custom_keys_v1"
const SALT_KEY = "nexora_enc_salt_v1"

// In-memory cache for fast synchronous access by fetch/axios interceptors
let inMemoryKeys: CustomApiKeys = {
  chatProvider: "groq",
  chatModel: "llama-3.3-70b-versatile",
  chatApiKey: "",
  embeddingProvider: "gemini",
  embeddingModel: "text-embedding-004",
  embeddingApiKey: "",
}
let isInitialized = false

/**
 * Returns or generates a persistent device salt for client-side PBKDF2 key derivation.
 */
function getOrCreateSalt(): Uint8Array {
  if (typeof window === "undefined") return new Uint8Array(16)
  let stored = window.localStorage.getItem(SALT_KEY)
  if (!stored) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    stored = Array.from(salt)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
    try {
      window.localStorage.setItem(SALT_KEY, stored)
    } catch {
      // ignore localstorage quota error
    }
  }
  const match = stored.match(/.{1,2}/g) || []
  return new Uint8Array(match.map((byte) => parseInt(byte, 16)))
}

/**
 * Derives a CryptoKey using PBKDF2 and AES-GCM.
 */
async function deriveEncryptionKey(salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode("nexora_byok_client_vault_key_" + (window.location.host || "localhost")),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

/**
 * Encrypts a JSON payload using AES-GCM.
 */
async function encryptPayload(data: CustomApiKeys): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return JSON.stringify(data)
  }

  const salt = getOrCreateSalt()
  const key = await deriveEncryptionKey(salt)
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const encoded = enc.encode(JSON.stringify(data))

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  )

  const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join("")
  const cipherHex = Array.from(new Uint8Array(ciphertext))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  return JSON.stringify({ v: 1, iv: ivHex, d: cipherHex })
}

/**
 * Decrypts an encrypted payload from localStorage.
 */
async function decryptPayload(raw: string): Promise<CustomApiKeys> {
  const defaultKeys: CustomApiKeys = {
    chatProvider: "groq",
    chatModel: "llama-3.3-70b-versatile",
    chatApiKey: "",
    embeddingProvider: "gemini",
    embeddingModel: "text-embedding-004",
    embeddingApiKey: "",
  }
  if (!raw || typeof window === "undefined" || !window.crypto?.subtle) {
    return defaultKeys
  }

  try {
    const parsed = JSON.parse(raw)
    // Backward compatibility if plaintext was ever saved
    if (parsed.chatApiKey !== undefined || parsed.embeddingApiKey !== undefined) {
      return {
        chatProvider: parsed.chatProvider || "groq",
        chatModel: parsed.chatModel || "llama-3.3-70b-versatile",
        chatApiKey: parsed.chatApiKey || "",
        embeddingProvider: parsed.embeddingProvider || "gemini",
        embeddingModel: parsed.embeddingModel || "text-embedding-004",
        embeddingApiKey: parsed.embeddingApiKey || "",
      }
    }

    if (!parsed.iv || !parsed.d) return defaultKeys

    const salt = getOrCreateSalt()
    const key = await deriveEncryptionKey(salt)
    const iv = new Uint8Array(
      (parsed.iv.match(/.{1,2}/g) || []).map((b: string) => parseInt(b, 16))
    )
    const cipherBytes = new Uint8Array(
      (parsed.d.match(/.{1,2}/g) || []).map((b: string) => parseInt(b, 16))
    )

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherBytes
    )

    const dec = new TextDecoder()
    const jsonStr = dec.decode(decrypted)
    const res = JSON.parse(jsonStr)
    return {
      chatProvider: res.chatProvider || "groq",
      chatModel: res.chatModel || "llama-3.3-70b-versatile",
      chatApiKey: res.chatApiKey || "",
      embeddingProvider: res.embeddingProvider || "gemini",
      embeddingModel: res.embeddingModel || "text-embedding-004",
      embeddingApiKey: res.embeddingApiKey || "",
    }
  } catch (err) {
    console.warn("Failed to decrypt custom API keys vault:", err)
    return defaultKeys
  }
}

/**
 * Eagerly initializes and loads custom keys from encrypted localStorage into memory.
 */
export async function initCustomKeys(): Promise<CustomApiKeys> {
  if (typeof window === "undefined") return inMemoryKeys
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      inMemoryKeys = await decryptPayload(stored)
    }
  } catch (e) {
    console.warn("Error initializing custom keys:", e)
  }
  isInitialized = true
  return inMemoryKeys
}

/**
 * Synchronously retrieves custom keys from in-memory cache.
 */
export function getCustomApiKeys(): CustomApiKeys {
  if (!isInitialized && typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        decryptPayload(stored).then((keys) => {
          inMemoryKeys = keys
          isInitialized = true
        })
      }
    } catch {
      // ignore
    }
  }
  return inMemoryKeys
}

/**
 * Encrypts and persists custom API keys to localStorage.
 */
export async function saveCustomApiKeys(
  updates: Partial<CustomApiKeys>
): Promise<CustomApiKeys> {
  const current = inMemoryKeys
  const next: CustomApiKeys = {
    chatProvider: updates.chatProvider !== undefined ? updates.chatProvider : (current.chatProvider || "groq"),
    chatModel: updates.chatModel !== undefined ? updates.chatModel : (current.chatModel || "llama-3.3-70b-versatile"),
    chatApiKey: updates.chatApiKey !== undefined ? updates.chatApiKey.trim() : current.chatApiKey,

    embeddingProvider: updates.embeddingProvider !== undefined ? updates.embeddingProvider : (current.embeddingProvider || "gemini"),
    embeddingModel: updates.embeddingModel !== undefined ? updates.embeddingModel : (current.embeddingModel || "text-embedding-004"),
    embeddingApiKey: updates.embeddingApiKey !== undefined ? updates.embeddingApiKey.trim() : current.embeddingApiKey,
  }

  inMemoryKeys = next
  isInitialized = true

  if (typeof window !== "undefined") {
    try {
      const encrypted = await encryptPayload(next)
      window.localStorage.setItem(STORAGE_KEY, encrypted)
      window.dispatchEvent(new CustomEvent("nexora:custom-keys-changed", { detail: next }))
    } catch (err) {
      console.error("Failed to save encrypted custom keys:", err)
    }
  }

  return next
}

/**
 * Deletes the custom chat API key and reverts chat tasks to prebuilt keys.
 */
export async function deleteCustomChatKey(): Promise<CustomApiKeys> {
  return saveCustomApiKeys({ chatApiKey: "" })
}

/**
 * Deletes the custom embedding API key and reverts embeddings to prebuilt keys.
 */
export async function deleteCustomEmbeddingKey(): Promise<CustomApiKeys> {
  return saveCustomApiKeys({ embeddingApiKey: "" })
}

/**
 * Clears all custom API keys, completely reverting workspace to prebuilt keys.
 */
export async function clearAllCustomKeys(): Promise<CustomApiKeys> {
  inMemoryKeys = {
    chatProvider: "groq",
    chatModel: "llama-3.3-70b-versatile",
    chatApiKey: "",
    embeddingProvider: "gemini",
    embeddingModel: "text-embedding-004",
    embeddingApiKey: "",
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
      window.dispatchEvent(
        new CustomEvent("nexora:custom-keys-changed", { detail: inMemoryKeys })
      )
    } catch {
      // ignore
    }
  }
  return inMemoryKeys
}

/**
 * Returns HTTP headers containing custom API keys for requests.
 */
export function getCustomKeyHeaders(): Record<string, string> {
  const keys = getCustomApiKeys()
  const headers: Record<string, string> = {}
  if (keys.chatApiKey) {
    headers["x-custom-chat-key"] = keys.chatApiKey
    if (keys.chatProvider) headers["x-custom-chat-provider"] = keys.chatProvider
    if (keys.chatModel) headers["x-custom-chat-model"] = keys.chatModel
  }
  if (keys.embeddingApiKey) {
    headers["x-custom-embedding-key"] = keys.embeddingApiKey
    if (keys.embeddingProvider) headers["x-custom-embedding-provider"] = keys.embeddingProvider
    if (keys.embeddingModel) headers["x-custom-embedding-model"] = keys.embeddingModel
  }
  if (keys.chatModel) {
    headers["x-custom-model"] = keys.chatModel
  }
  return headers
}

/**
 * React hook for reacting to custom API keys state and changes in UI.
 */
export function useCustomApiKeys() {
  const [keys, setKeys] = useState<CustomApiKeys>(inMemoryKeys)
  const [isLoaded, setIsLoaded] = useState(isInitialized)

  useEffect(() => {
    initCustomKeys().then((loaded) => {
      setKeys(loaded)
      setIsLoaded(true)
    })

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setKeys(e.detail)
      } else {
        setKeys(getCustomApiKeys())
      }
    }

    window.addEventListener("nexora:custom-keys-changed", handleUpdate)
    return () => window.removeEventListener("nexora:custom-keys-changed", handleUpdate)
  }, [])

  return {
    keys,
    isLoaded,
    hasChatKey: Boolean(keys.chatApiKey),
    hasEmbeddingKey: Boolean(keys.embeddingApiKey),
    saveKeys: saveCustomApiKeys,
    deleteChatKey: deleteCustomChatKey,
    deleteEmbeddingKey: deleteCustomEmbeddingKey,
    clearAllKeys: clearAllCustomKeys,
  }
}
