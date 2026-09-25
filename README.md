# ⚡ Nexora

> **Enterprise-Grade Autonomous Multi-Agent AI Platform & Cognitive Assistant**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=flat&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141.1-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.2.11-FF6F00?style=flat&logo=langchain)](https://github.com/langchain-ai/langgraph)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=flat&logo=postgresql)](https://github.com/pgvector/pgvector)
[![Redis](https://img.shields.io/badge/Redis-Cache%20%26%20Rate%20Limit-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Nexora is an enterprise-grade artificial intelligence platform powered by **LangGraph**, **FastAPI**, **Next.js 16**, **PostgreSQL with pgvector**, and **Redis**. It unites autonomous multi-agent intent routing, real-time Server-Sent Events (SSE) streaming, zero-disk in-memory Document RAG, interactive YouTube Video RAG with click-to-seek playback, hybrid symbolic mathematics with SymPy, distributed sliding-window rate limiting, double-submit cookie CSRF defense, Redis search and conversation caching, dual-stage security guardrails, ChatGPT-style automatic conversation titling, pinned messages, dynamic Generative UI, deep health telemetry, and end-to-end observability via LangSmith.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Multi-Agent LangGraph Workflow](#-multi-agent-langgraph-workflow)
- [Agentic RAG & Knowledge Ingestion Pipelines](#-agentic-rag--knowledge-ingestion-pipelines)
  - [1. Private In-Memory Document RAG (Zero Disk Storage)](#1-private-in-memory-document-rag-zero-disk-storage)
  - [2. Interactive YouTube Video RAG with Click-to-Seek](#2-interactive-youtube-video-rag-with-click-to-seek)
- [Security Middleware & Guardrails Architecture](#-security-middleware--guardrails-architecture)
  - [1. Distributed Sliding-Window Rate Limiting](#1-distributed-sliding-window-rate-limiting)
  - [2. Double-Submit Cookie CSRF Protection](#2-double-submit-cookie-csrf-protection)
  - [3. Session Revocation & Token Blacklisting](#3-session-revocation--token-blacklisting)
  - [4. Hardened Security Headers & IDOR Prevention](#4-hardened-security-headers--idor-prevention)
  - [5. Pre- and Post-Execution Guardrails](#5-pre--and-post-execution-guardrails)
- [High-Performance Redis Caching & System Health](#-high-performance-redis-caching--system-health)
  - [1. Tavily Search Result Caching](#1-tavily-search-result-caching)
  - [2. Chat & Message History Caching](#2-chat--message-history-caching)
  - [3. Deep Health Check & Latency Probing](#3-deep-health-check--latency-probing)
- [Key Features](#-key-features)
- [Dynamic Generative UI Registry](#-dynamic-generative-ui-registry)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Running with Docker Compose (Recommended)](#running-with-docker-compose-recommended)
  - [Manual Local Setup](#manual-local-setup)
- [API Reference & Streaming Protocol](#-api-reference--streaming-protocol)
  - [REST Endpoints](#rest-endpoints)
  - [SSE Streaming Events Protocol](#sse-streaming-events-protocol)
- [Testing](#-testing)
- [License](#-license)

---

## 🏛️ Architectural Overview

Nexora is built as a unified, high-throughput monorepo decoupling an ultra-responsive **Next.js 16** frontend (with Tailwind CSS v4 and Motion) from an asynchronous **FastAPI** backend, a stateful **LangGraph** orchestration graph, a distributed **Redis** caching & rate-limiting tier, and **PostgreSQL with pgvector**.

```mermaid
flowchart TD
    subgraph Client ["Client Application (Next.js 16 / React 19)"]
        UI["Modern Web Interface\nTailwind CSS v4 & Motion"]
        GenUI["Dynamic Generative UI\nYouTube Player, Math, Clocks, Charts & Tables"]
        ChatHook["SSE Streaming Engine\nAbort & Disconnect Control"]
        AxiosClient["Axios API Client\nCSRF Token Header & 401 Auto-Refresh"]
    end

    subgraph Gateway ["API & Application Gateway (FastAPI)"]
        FastAPI["FastAPI Asynchronous Gateway\nUvicorn / Python 3.11"]
        SecHeaders["Security Headers Middleware\nX-Frame-Options, CSP, HSTS, nosniff"]
        RateLimitMid["Sliding-Window Rate Limiter\nRedis ZSET (In-Memory Fallback)"]
        CSRFMid["Double-Submit Cookie CSRF\nx-csrf-token validation"]
        AuthMid["Security & Auth Middleware\nArgon2id, HTTP-only JWT & Redis Token Blacklist"]
        HealthEndpoint["/api/v1/health Probe\nDB & Redis Latency Check"]
    end

    subgraph AI_Engine ["LangGraph Multi-Agent Engine"]
        InGuard["Dual-Stage Input Guardrail\nLength, Abuse, Injection & PII Filter"]
        Router["Intent Classifier & Router\nStructured Output Classifier"]
        ChatAgent["General Assistant\nWeb Search & Temporal Tools"]
        CodingAgent["Software Engineering Specialist\nArchitecture & Code Generation"]
        MathAgent["Hybrid Math Engine\nSymPy, SciPy & LaTeX"]
        OutGuard["Output Sanitization Guardrail\nSecret Masking & Leak Prevention"]
    end

    subgraph Data_RAG ["Data, Caching & Knowledge Layer"]
        Postgres[("PostgreSQL Database\nSQLAlchemy 2.0 Async")]
        PGVector[("pgvector Extension\n768-dim Semantic Vector Store")]
        RedisCache[("Redis 8.1 / 7+\nSearch Cache, Chat Cache & Blacklist")]
        DocIngest["In-Memory Document Parser\nPDF, DOCX, Scanned OCR Fallback"]
        YTIngest["YouTube Video Ingester\nyoutube-transcript-api & oEmbed"]
        MemorySaver["LangGraph Checkpointer\nThread State Persistence"]
    end

    subgraph External_Services ["External Services & Observability"]
        Groq["Groq Llama-3 Fast Inference"]
        Gemini["Google Gemini GenAI"]
        Tavily["Tavily Web Search API"]
        HF["HuggingFace Embeddings\nsentence-transformers"]
        LangSmith["LangSmith Tracing & Telemetry"]
    end

    UI --> ChatHook
    UI --> AxiosClient
    ChatHook <-->|HTTP / SSE Stream| FastAPI
    AxiosClient <-->|REST API| FastAPI
    FastAPI --> SecHeaders
    SecHeaders --> RateLimitMid
    RateLimitMid --> CSRFMid
    CSRFMid --> AuthMid
    AuthMid --> InGuard
    InGuard --> Router
    Router --> ChatAgent
    Router --> CodingAgent
    Router --> MathAgent
    ChatAgent --> OutGuard
    CodingAgent --> OutGuard
    MathAgent --> OutGuard
    OutGuard --> FastAPI
    
    RateLimitMid <--> RedisCache
    AuthMid <--> RedisCache
    FastAPI <--> HealthEndpoint
    HealthEndpoint -.-> Postgres
    HealthEndpoint -.-> RedisCache

    ChatAgent <--> RedisCache
    ChatAgent <--> Tavily
    Router & ChatAgent & CodingAgent & MathAgent <--> Groq
    ChatAgent <--> Gemini
    AI_Engine <--> MemorySaver
    AI_Engine <--> LangSmith
    
    ChatAgent <--> PGVector
    DocIngest --> HF --> PGVector
    YTIngest --> HF --> PGVector
    FastAPI <--> Postgres
    FastAPI <--> RedisCache
    GenUI <--> UI
```

---

## 🤖 Multi-Agent LangGraph Workflow

User queries enter an asynchronous state machine managed by **LangGraph**. Requests pass through automated safety validation before dynamic dispatching to specialized agents based on structured classification:

```mermaid
stateDiagram-v2
    [*] --> InputGuardrail: User Query Received

    state InputGuardrail {
        [*] --> CheckPolicy: Evaluate Prompt Length, Injection & Abuse
        CheckPolicy --> Flagged: Policy Violation / Malicious Input
        CheckPolicy --> Approved: Safe & Valid Input
    }

    InputGuardrail --> BlockedResponse: Flagged
    BlockedResponse --> [*]: Direct Safety Notice (0 LLM Tokens Spent)

    InputGuardrail --> IntentRouter: Approved

    state IntentRouter {
        [*] --> ClassifyIntent: LLM Structured Output
        ClassifyIntent --> ChatRoute: General / Search / Documents / YouTube / Time
        ClassifyIntent --> CodingRoute: Development / Refactor / Debugging
        ClassifyIntent --> MathRoute: Equations / Calculus / Linear Algebra
    }

    state "General Chat Agent" as ChatAgentNode {
        [*] --> CheckTools
        CheckTools --> CheckRedisCache: Check Cached Search Query
        CheckRedisCache --> TavilySearch: Cache Miss -> Live Search
        CheckRedisCache --> SynthesizeChat: Cache Hit -> Return Cached Results
        CheckTools --> TimeTool: Current Time / Timezone Request?
        CheckTools --> DocRAGTool: Document Scoped Query?
        CheckTools --> YouTubeRAGTool: YouTube Video Scoped Query?
        CheckTools --> DirectChat: Conversational / Reasoning
        TavilySearch --> CacheResult: Store in Redis (1h TTL)
        CacheResult --> SynthesizeChat
        TimeTool --> SynthesizeChat
        DocRAGTool --> SynthesizeChat
        YouTubeRAGTool --> SynthesizeChat
        DirectChat --> SynthesizeChat
    }

    state "Coding Agent" as CodingAgentNode {
        [*] --> CodeSynthesis: Modular, Type-Safe, Performant Implementation
    }

    state "Math Agent" as MathAgentNode {
        [*] --> SympyEngine: Parse Symbolic Expression
        SympyEngine --> ExactCompute: SymPy / SciPy / NumPy
        ExactCompute --> FormatLaTeX: Step-by-Step & KaTeX Output
    }

    IntentRouter --> ChatAgentNode: ChatRoute
    IntentRouter --> CodingAgentNode: CodingRoute
    IntentRouter --> MathAgentNode: MathRoute

    ChatAgentNode --> OutputGuardrail
    CodingAgentNode --> OutputGuardrail
    MathAgentNode --> OutputGuardrail

    state OutputGuardrail {
        [*] --> ValidateOutput: Mask Secrets & Prevent Prompt Disclosure
        ValidateOutput --> Ready
    }

    OutputGuardrail --> StreamToClient: Push SSE Event (Tokens & Generative UI)
    StreamToClient --> [*]: Stream Completed
```

---

## 📄 Agentic RAG & Knowledge Ingestion Pipelines

Nexora features a zero-disk, multimodal Knowledge Ingestion and Retrieval-Augmented Generation (RAG) architecture supporting both uploaded documents and interactive YouTube videos.

```mermaid
flowchart LR
    subgraph Ingestion ["1. Knowledge Ingestion Sources"]
        A1["PDF Upload\n(pypdf in-memory)"]
        A2["Word Document\n(python-docx in-memory)"]
        A3["Scanned PDFs\n(Tesseract OCR Fallback)"]
        A4["YouTube Videos\n(/youtube <url> or dialog)"]
    end

    subgraph Processing ["2. Extraction & Chunking"]
        B1["Text Normalization\n& Sensitive Data Scanning"]
        B2["Document Chunker\nRecursive Semantic Splits"]
        B3["YouTube Transcript Chunker\nGrouped Timestamp Windows"]
    end

    subgraph Embedding_Store ["3. Vector Storage"]
        C1["HuggingFace Embeddings\nsentence-transformers (768-dim)"]
        C2[("PostgreSQL\npgvector HNSW Index")]
    end

    subgraph Retrieval ["4. Scoped Search & Context Injection"]
        D1["Active Context Scope\n[Document ID / Video ID]"]
        D2["Cosine Similarity Search\nStrict User & Resource Isolation"]
        D3["Context Injector\nTo LangGraph Agents"]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B3
    B1 --> B2
    B2 --> C1
    B3 --> C1
    C1 --> C2
    D1 --> D2
    C2 -.-> D2
    D2 --> D3
```

### 1. Private In-Memory Document RAG (Zero Disk Storage)
- **Zero Permanent Disk Storage**: Uploaded PDF and DOCX files are streamed directly into memory buffers (`io.BytesIO`) and discarded immediately after chunking and vector embedding.
- **Smart OCR Fallback**: For scanned PDFs containing insufficient native text, the pipeline dynamically extracts embedded page images and runs OCR via Tesseract and Pillow.
- **Document-Level Security Scanning**: In-memory inspection detects credit card numbers, SSNs, and API keys prior to vectorization, presenting an interactive Human-in-the-Loop (HITL) confirmation dialog (`guardrails-dialog.tsx`) if sensitive patterns are detected.
- **Scoped Document Chat**: Conversations can be locked to a specific document ID so vector queries retrieve context strictly within the active file.

### 2. Interactive YouTube Video RAG with Click-to-Seek
- **One-Command Video Ingestion**: Simply trigger `/youtube <url>` in chat or use the Documents modal.
- **Automatic Transcript & Metadata Ingestion**: Uses `youtube-transcript-api` to pull full timestamped video captions and retrieves title, author, and high-res thumbnails via oEmbed.
- **Time-Window Chunking**: Groups adjacent transcript captions into cohesive semantic chunks with exact `start_time` and `end_time` bounds and formatted timestamp strings (`mm:ss` / `hh:mm:ss`).
- **Conditional Auto-Titling**: Ingesting a YouTube video into a brand new or untitled conversation automatically triggers AI title generation derived from the video title and prompt context.
- **Interactive `YouTubeCard` Generative UI**: Emits an interactive video player widget with:
  - Synchronized embedded YouTube player with regex-safe URL and ID parsing.
  - Interactive transcript panel with clickable timestamps that immediately seek playback to the exact moment.
  - Keyword search filter across video captions.
  - "Ask about this part" action buttons to ask targeted questions about specific video segments.

---

## 🛡️ Security Middleware & Guardrails Architecture

Nexora enforces a defense-in-depth security model across HTTP transport, agent graph execution, document vectorization, and token lifecycles.

```mermaid
flowchart TD
    subgraph Client_Transport ["1. Transport & Gateway Security"]
        Req["User Request\n(Web or Mobile)"]
        SecHead["Security Headers Applied\nX-Content-Type-Options, X-Frame-Options, HSTS"]
        RateLimit{"Rate Limiter Check\n(Redis ZSET Sliding Window)"}
        RateLimitExceeded["HTTP 429 Too Many Requests\nRetry-After Header"]
        ClientType{"Detect Client Type\n(Header vs Cookie)"}
        CSRF["CSRF Verification Middleware\nDouble-Submit Cookie (x-csrf-token)"]
        AuthVal["JWT Authentication Middleware\nDecode Access Token / Argon2id Session"]
        BlacklistCheck{"Token Blacklisted in Redis?\n(blacklist:jti:<id>)"}
        RevokedError["HTTP 401 Unauthorized\nToken Revoked"]
    end

    subgraph Input_Defense ["2. LangGraph Input Guardrails (Pre-Execution)"]
        InNode["Input Guardrail Node"]
        TokenCheck{"Token & Length Check\n(<= 12,000 chars)"}
        InjectCheck{"Prompt Injection Check\n(Jailbreaks, DAN & Roleplays)"}
        AbuseCheck{"Abuse & Profanity Check\n(Word Boundary Regex)"}
        PIICheck{"PII Leakage Check\n(SSN, Emails, Phones)"}
        BlockedNode["Blocked Response Node\nDirect Policy Refusal (0 LLM Tokens)"]
    end

    subgraph Agent_Core ["3. Execution & Tool Middleware"]
        AgentCore["Specialized Agents\n(Chat, Coding, Math)"]
        ToolRetry["Tool Retry Middleware\n(Exponential Backoff & Fallback)"]
    end

    subgraph Output_Defense ["4. Output Guardrails (Post-Execution)"]
        OutNode["Output Guardrail Node"]
        SecretMask["Secret Redaction Engine\nReplaces Groq, OpenAI, Google, AWS Keys & DB URIs\nwith [REDACTED_SECRET]"]
        PromptMask["System Leak Sanitizer\nPrevents Internal Instruction Disclosure"]
    end

    subgraph Doc_Defense ["5. Knowledge Ingestion Guardrails"]
        DocFile["Uploaded PDF / DOCX / Image"]
        MemScan["In-Memory PII & Credential Scanner\n(Credit Cards, SSN, API Keys, Passwords)"]
        ClientModal["Interactive Confirmation Dialog\nMasked Previews (e.g., ****-1234)"]
        DBStore[("Vector Store\npgvector")]
    end

    Req --> SecHead
    SecHead --> RateLimit
    RateLimit -->|Exceeded| RateLimitExceeded
    RateLimit -->|Allowed| ClientType
    ClientType -->|Web Client| CSRF
    ClientType -->|Mobile Client| AuthVal
    CSRF --> AuthVal
    AuthVal --> BlacklistCheck
    BlacklistCheck -->|Blacklisted| RevokedError
    BlacklistCheck -->|Valid| InNode

    InNode --> TokenCheck
    TokenCheck -->|Pass| InjectCheck
    InjectCheck -->|Pass| AbuseCheck
    AbuseCheck -->|Pass| PIICheck

    TokenCheck -->|Fail| BlockedNode
    InjectCheck -->|Flagged| BlockedNode
    AbuseCheck -->|Flagged| BlockedNode
    PIICheck -->|Flagged| BlockedNode
    BlockedNode --> ReturnEnd["Stream Safety Notice & Terminate"]

    PIICheck -->|Safe| AgentCore
    AgentCore <--> ToolRetry
    AgentCore --> OutNode
    OutNode --> SecretMask
    SecretMask --> PromptMask
    PromptMask --> SSEStream["Stream Safe Response to User"]

    DocFile --> MemScan
    MemScan -->|Sensitive Data Found| ClientModal
    ClientModal -->|User Confirms| DBStore
    MemScan -->|No Findings| DBStore
```

### 1. Distributed Sliding-Window Rate Limiting
- **Redis ZSET Sliding Window**: Implemented in `rate_limit.py`, user requests are tracked inside atomic Redis sorted sets by timestamp, calculating exact sliding windows rather than naive fixed buckets.
- **Tiered Endpoint Protection**:
  - `rate_limit_auth`: **10 requests / 60 seconds** on `/auth/login` and `/auth/register`.
  - `rate_limit_email`: **5 requests / 60 seconds** on `/auth/forgot-password`.
  - `rate_limit_ai`: **30 requests / 60 seconds** on `/ai/chat/stream`, `/ai/chat`, and title generation.
- **Reverse-Proxy Aware**: Accurately resolves client IP addresses through the `X-Forwarded-For` header.
- **Resilient Fallback**: Automatically degrades to a synchronized `InMemorySlidingWindowRateLimiter` with auto-sweeping to prevent memory leaks if Redis connectivity drops.
- **HTTP 429 & Retry-After**: Emits standard `429 Too Many Requests` responses with dynamic `Retry-After` headers indicating quota reset seconds.

### 2. Double-Submit Cookie CSRF Protection
- **Double-Submit Pattern**: Web clients sending state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) with session cookies must present a matching `x-csrf-token` or `x-xsrf-token` header verified against the `csrf_token` cookie.
- **Safe Route Exemptions**: Public entrypoints (`/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`) are strictly whitelisted.
- **Client Synchronization**: Next.js client utilities (`axios.ts`, `ai.ts`) read the `csrf_token` cookie via `getCookie()` and transparently attach it to REST calls and SSE streaming connections.
- **Silent 401 Re-Authentication**: If an access token expires during an SSE stream, the client automatically requests `/auth/refresh` and seamlessly re-attempts the stream without interrupting the user.

### 3. Session Revocation & Token Blacklisting
- **Instant Logout Invalidation**: When a user logs out (`/api/v1/auth/logout`), the access token's unique `jti` is stored in Redis (`blacklist:jti:<jti>`) with a TTL matching its expiration time.
- **Zero Stale Windows**: Subsequent requests bearing that token are rejected immediately with `401 Unauthorized`, neutralizing replay attacks even before the JWT natively expires.
- **Database Refresh Revocation**: The corresponding refresh session in PostgreSQL is marked revoked.

### 4. Hardened Security Headers & IDOR Prevention
- **Defensive HTTP Headers**: FastAPI middleware injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security` in production.
- **Next.js Security Headers**: Configured in `next.config.ts` with strict frame and permissions policies (`camera=(), microphone=(), geolocation=()`).
- **IDOR Defense**: All chat message appending (`POST /conversations/{id}/messages`), message fetching, conversation updates, and deletions enforce strict database-level user ownership verification.

### 5. Pre- and Post-Execution Guardrails
- **Pre-Execution Input Guardrails (`input_filter.py`, `abuse_filter.py`)**: Rejects prompts exceeding 12,000 characters, blocks jailbreaks (e.g. DAN, roleplay bypasses), filters profanity, and prevents prompt injection without consuming LLM inference tokens.
- **Post-Execution Output Guardrails (`output_filter.py`)**: Redacts secrets and credentials (`[REDACTED_SECRET]`) including Groq, OpenAI, Google Gemini, GitHub, and AWS keys, private RSA keys, and database connection strings. Prevents disclosure of internal system prompts.
- **Document Ingestion Guardrails (`document_guardrails.py`)**: Scans document text in-memory for Credit Cards (Luhn algorithm), SSNs, API keys, and passwords before chunks are embedded into pgvector.

---

## ⚡ High-Performance Redis Caching & System Health

Nexora integrates an asynchronous Redis 8.1 / 7+ layer (`redis_client.py`, `redis_cache.py`) designed for high-concurrency throughput, reduced database load, and robust failure isolation.

### 1. Tavily Search Result Caching
- **Deterministic SHA256 Hashing**: Web search queries are normalized and hashed (`cache:tavily:<sha256>`).
- **1-Hour TTL**: Repeated or identical agent queries across sessions return cached search citations instantly, preserving Tavily API quota and reducing latency by up to 90%.
- **Automatic Fallback**: If Redis is offline, searches execute transparently via live HTTP calls.

### 2. Chat & Message History Caching
- **User Conversation Lists**: Cached under `cache:user_convs:<user_id>:<limit>:<offset>` with a 5-minute TTL.
- **Conversation Metadata**: Cached under `cache:conversation:<conv_id>:<user_id>` with a 10-minute TTL.
- **Message Histories**: Cached under `cache:messages:<conv_id>:<user_id>:<limit>` with a 10-minute TTL.
- **Intelligent Invalidation**: Any mutating operation (adding a message, updating a title, pinning, or deleting a thread) invokes `invalidate_chat_cache` to instantly purge stale user and conversation keys.

### 3. Deep Health Check & Latency Probing
- **`/api/v1/health` Endpoint**: A dedicated health check endpoint provides live operational telemetry:
  - **PostgreSQL**: Executes a lightweight `SELECT 1` query to verify database connection pool viability.
  - **Redis**: Sends an asynchronous `ping()` and measures round-trip latency in milliseconds (`redis_latency_ms`).
  - **Status Classification**: Returns `{"status": "healthy", ...}` with HTTP 200, or `{"status": "degraded", ...}` with HTTP 503 if any dependency is unreachable.

---

## ✨ Key Features

- 🤖 **Autonomous Multi-Agent Routing**: Automatically classifies queries to dispatch to specialized Chat, Coding, or Math agents without requiring manual prompt prefixes.
- ⚡ **High-Performance Redis Caching**: Caches Tavily web search results and conversation histories with intelligent multi-key invalidation.
- 🚦 **Sliding-Window Rate Limiting**: Distributed Redis ZSET sliding-window rate limiting protects auth, email, and AI endpoints with graceful in-memory fallbacks.
- 🛡️ **Hardened CSRF & Session Security**: Double-submit cookie CSRF validation on all state-changing endpoints and Redis-backed JWT token revocation on logout.
- 📺 **Interactive YouTube Video RAG**: Ingest any YouTube video using `/youtube <URL>`, extract timestamped transcripts, and interact using an embedded player with clickable timestamp seeking and caption filtering.
- 📄 **Private In-Memory Document RAG**: Zero permanent disk storage; processes PDFs and Word documents in memory with optional OCR fallback and strict document focus scoping.
- 🧮 **Hybrid Symbolic Math Engine**: Evaluates complex calculus (derivatives, integrals, limits), algebra, and matrices via SymPy and SciPy, generating KaTeX-formatted step-by-step solutions.
- 🏷️ **ChatGPT-Style Automated Title Generation**: Automatically derives concise 3–5 word conversation titles dynamically from user prompts and document context.
- 📌 **Pinned Messages & Thread Organization**: Pin vital responses within any conversation thread for quick reference; filter, archive, and manage conversations effortlessly.
- 🌐 **Real-Time Web Search Grounding**: Live search integration via Tavily provides up-to-date facts, current events, and source citations with domain attribution.
- 🛡️ **Dual-Layer Guardrails & HITL**: Pre- and post-execution security guardrails filter prompt injections and redact production secrets, complemented by Human-in-the-Loop sensitive data confirmation.
- 📊 **Dynamic Generative UI**: The assistant emits typed UI payloads over SSE to render rich, interactive widgets inline.
- 🏥 **Deep Health Telemetry**: Live `/health` endpoint monitors database and Redis responsiveness with sub-millisecond precision.
- 🔭 **End-to-End Observability**: Native integration with LangSmith for comprehensive tracing of agent nodes, tool invocations, token streams, and latency metrics.

---

## 🎨 Dynamic Generative UI Registry

Nexora's backend emits structured `ui` events over the SSE stream that the Next.js client renders dynamically:

| Component Type | Component File | Description & Capabilities |
| :--- | :--- | :--- |
| `youtube` / `youtube_card` | `youtube-card.tsx` | Embedded video player, searchable captions, and interactive click-to-seek timestamp navigation. |
| `math` / `math_card` | `math-card.tsx` | Symbolic math card with verified step breakdown, copyable LaTeX, and KaTeX rendering. |
| `time` / `time_card` | `time-card.tsx` | Interactive world clock card displaying live regional time, timezones, and country flags. |
| `search_results` | `search-results.tsx` | Source attribution cards linking directly to live web sources with domain favicons. |
| `chart` | `chart-card.tsx` | Visual data representations (bar, line, analytical charts) rendered dynamically. |
| `table` | `data-table.tsx` | Formatted tabular data display with sorting and structured column formatting. |
| `card` | `info-card.tsx` | Highlighted key takeaway and structured information summary card. |
| `project` | `project-card.tsx` | Multi-step software project and architecture plan card. |

---

## 🛠️ Technology Stack

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16.3.4](https://nextjs.org/) (App Router), [React 19.2.8](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling & Animation** | [Tailwind CSS v4](https://tailwindcss.com/), [Motion 13.2](https://motion.dev/), [Lucide React](https://lucide.dev/), [Base UI](https://base-ui.com/) |
| **Markdown & Math Rendering** | [KaTeX 0.18.7](https://katex.org/), `react-markdown`, `remark-math`, `rehype-katex`, `remark-gfm` |
| **Backend API** | [FastAPI 0.141.1](https://fastapi.tiangolo.com/), [Uvicorn 0.52.4](https://www.uvicorn.org/), [Python 3.11](https://www.python.org/) |
| **Agent Orchestration** | [LangGraph 1.2.11](https://github.com/langchain-ai/langgraph), [LangChain Core 1.6.2](https://github.com/langchain-ai/langchain) |
| **LLM & Inference** | [Groq](https://groq.com/) (Llama-3 via `langchain-groq`), [Google Gemini](https://ai.google.dev/) (`langchain-google-genai`) |
| **Web Search & Caching** | [Tavily Search API](https://tavily.com/) (`langchain-tavily 0.2.18`) with [Redis 8.1.0](https://redis.io/) TTL cache |
| **Caching & Rate Limiting** | [Redis](https://redis.io/) (`redis>=8.1.0`), Redis ZSET Sliding-Window Rate Limiter & Token Blacklisting |
| **Media & Transcripts** | [youtube-transcript-api 0.6.0](https://pypi.org/project/youtube-transcript-api/) |
| **Document Processing & OCR** | `pypdf 6.19.0`, `python-docx 1.2.0`, `pytesseract 0.3.13`, `Pillow 12.3.0` |
| **Math & Symbolic Engine** | [SymPy 1.13.0](https://www.sympy.org/), [SciPy 1.12.0](https://scipy.org/), [NumPy](https://numpy.org/) |
| **Database & Vector Store** | [PostgreSQL](https://www.postgresql.org/) with [pgvector 0.5.0](https://github.com/pgvector/pgvector), [SQLAlchemy 2.0.52 Async](https://www.sqlalchemy.org/), [Alembic 1.19.2](https://alembic.sqlalchemy.org/) |
| **Vector Embeddings** | `sentence-transformers 6.0.1`, `langchain-huggingface 1.2.2` (768-dimensional embeddings) |
| **Security & Cryptography** | `argon2-cffi 23.1.0`, `pyjwt 2.8.0`, Double-Submit CSRF, Secure HTTP-only Cookies |
| **Observability** | [LangSmith](https://smith.langchain.com/) (`langsmith 0.1.0`) |
| **Package & Dev Tooling** | [`uv`](https://github.com/astral-sh/uv), [`pnpm 11.21.0`](https://pnpm.io/), [Docker](https://www.docker.com/) & Docker Compose |

---

## 📁 Repository Structure

```plaintext
Nexora/
├── client/                               # Next.js 16.3 Frontend Application
│   ├── app/                              # App Router pages and layouts
│   │   ├── (main)/                       # Landing page with interactive feature mockups
│   │   ├── chat/                         # Real-time multi-agent chat workspace & YouTube player
│   │   └── reset-password/               # Password recovery and reset flows
│   ├── components/                       # Reusable React components
│   │   ├── auth/                         # Login, registration, & modal dialogs
│   │   ├── chat/                         # Chat stream views, sidebar, chat input, & message items
│   │   │   ├── generative/               # Generative UI cards (YouTube, Math, Time, Search, Tables)
│   │   │   │   ├── chart-card.tsx        # Dynamic chart rendering
│   │   │   │   ├── data-table.tsx        # Tabular data display
│   │   │   │   ├── info-card.tsx         # Structured info cards
│   │   │   │   ├── math-card.tsx         # KaTeX-rendered symbolic math cards
│   │   │   │   ├── project-card.tsx      # Project summary cards
│   │   │   │   ├── search-results.tsx    # Web search citation cards
│   │   │   │   ├── time-card.tsx         # World clock cards
│   │   │   │   └── youtube-card.tsx      # Interactive YouTube video player with timestamp seek
│   │   │   ├── documents-dialog.tsx      # In-memory document and YouTube URL ingestion modal
│   │   │   └── guardrails-dialog.tsx     # Sensitive data PII confirmation dialog
│   │   ├── landing/                      # Landing page hero, showcase, and feature cards
│   │   └── ui/                           # Base UI primitives
│   ├── hooks/                            # Custom hooks (SSE streaming, auth, responsive layout)
│   ├── lib/                              # API clients, constants, and utilities
│   │   ├── api/                          # Axios instance, CSRF injection, and SSE stream reader
│   │   └── utils.ts
│   ├── next.config.ts                    # Next.js config with hardened security headers & permissions
│   └── package.json
│
├── server/                               # FastAPI Asynchronous Backend & Agentic AI
│   ├── alembic/                          # Database schema migration scripts
│   ├── app/
│   │   ├── ai/                           # LangGraph Multi-Agent Architecture
│   │   │   ├── agents/                   # Router, Chat, Coding, & Math agent implementations
│   │   │   ├── core/                     # Agent state definitions, LLM factories, & memory saver
│   │   │   ├── guardrails/               # Input filters, abuse detectors, output sanitizers, & doc PII scanner
│   │   │   ├── middleware/               # Tool retry policies & exception handlers
│   │   │   ├── rag/                      # In-memory loaders, YouTube ingester, chunkers, & vector store
│   │   │   │   ├── loaders.py            # In-memory PDF, DOCX, & OCR loader
│   │   │   │   ├── youtube_loader.py     # YouTube transcript extractor & chunking pipeline
│   │   │   │   ├── chunking.py           # Recursive semantic text chunker
│   │   │   │   └── vector_store.py       # pgvector similarity search & persistence
│   │   │   ├── tool/                     # SymPy math tool, Tavily search tool (Redis cached), world time tool
│   │   │   ├── title_generator.py        # ChatGPT-style dynamic thread title generator
│   │   │   └── graph.py                  # Master LangGraph StateGraph compilation
│   │   ├── api/v1/                       # REST Endpoints
│   │   │   ├── endpoints/
│   │   │   │   ├── health.py             # Database & Redis connectivity and latency probe
│   │   │   │   ├── auth.py               # Authentication, registration, logout & CSRF handling
│   │   │   │   ├── ai.py                 # Real-time SSE streaming & chat execution endpoints
│   │   │   │   ├── chat.py               # Conversation threads, message histories & Redis caching
│   │   │   │   ├── pin.py                # Pinned message management
│   │   │   │   ├── documents.py          # Document upload, query & YouTube video ingestion
│   │   │   │   └── memory.py             # Long-term user memories & semantic search
│   │   │   └── api.py                    # API v1 router registry
│   │   ├── core/                         # Configuration settings, Redis client, caching & rate limiting
│   │   │   ├── config.py                 # Pydantic environment configuration
│   │   │   ├── database.py               # Async SQLAlchemy engine & session factory
│   │   │   ├── redis_client.py           # Async Redis connection pool & ping health
│   │   │   ├── redis_cache.py            # Redis JSON caching & invalidation helpers
│   │   │   ├── rate_limit.py             # Sliding-window rate limiting (Redis ZSET + Memory Fallback)
│   │   │   └── security.py               # Argon2 password hashing & JWT token encoding/decoding
│   │   ├── dependencies/                 # FastAPI dependency injection (Auth, CSRF verification)
│   │   ├── models/                       # SQLAlchemy ORM models (User, Chat, Message, Pin, Document, Memory)
│   │   ├── schemas/                      # Pydantic data validation schemas
│   │   ├── services/                     # Business logic and database operations
│   │   └── main.py                       # FastAPI application entrypoint, security headers & middleware
│   ├── tests/                            # Automated Pytest suite (70 unit & integration tests)
│   │   ├── test_auth.py                  # User authentication and token validation tests
│   │   ├── test_chat_delete.py           # Conversation deletion and cascade tests
│   │   ├── test_chat_memory.py           # Thread state and memory checkpointer tests
│   │   ├── test_document_guardrails.py   # Document PII scanner and card validation tests
│   │   ├── test_guardrails.py            # Prompt injection and secret redaction tests
│   │   ├── test_langsmith.py             # LangSmith tracing status tests
│   │   ├── test_math_tool.py             # SymPy calculus, algebra, and LaTeX formatting tests
│   │   ├── test_rag_agent.py             # RAG retrieval and context injection tests
│   │   ├── test_rag_chunking.py          # Semantic text splitters tests
│   │   ├── test_rag_endpoints.py         # Document upload, query, and deletion API tests
│   │   ├── test_rag_isolation.py         # Multi-tenant vector store isolation tests
│   │   ├── test_rag_loaders.py           # In-memory PDF, DOCX, and OCR loader tests
│   │   ├── test_rag_tool.py              # Scoped document search tool tests
│   │   ├── test_redis.py                 # Redis connection, caching, and rate limiting tests
│   │   ├── test_security_fixes.py        # CSRF enforcement, IDOR prevention, and blacklist tests
│   │   └── test_youtube_ingest.py        # YouTube transcript extraction and chunking tests
│   ├── Dockerfile                        # Production multi-stage Dockerfile (non-root appuser)
│   ├── Dockerfile.dev                    # Fast development Dockerfile with hot reloading
│   └── pyproject.toml
│
├── docker-compose.yml                    # Container orchestration for development server
└── README.md                             # Comprehensive project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following tools installed:
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (v20+ recommended) and [pnpm](https://pnpm.io/) (`>= 10`)
- [Python 3.11](https://www.python.org/) and [`uv`](https://github.com/astral-sh/uv)
- [PostgreSQL](https://www.postgresql.org/) with the `pgvector` extension installed
- [Redis](https://redis.io/) (v7+ or v8+) running locally or via cloud
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) (optional, for scanned document OCR)

---

### Environment Configuration

#### 1. Backend Configuration (`server/.env`)
Create a `.env` file in the `server/` directory:

```env
# Application Settings
PROJECT_NAME=Nexora
VERSION=1.0.0
FRONTEND_URL=http://localhost:3000

# PostgreSQL with pgvector
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/nexora_db

# Redis Caching & Rate Limiting
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USER=
REDIS_PASSWORD=
REDIS_SSL=false

# Security & Authentication
JWT_SECRET_KEY=your_super_secret_jwt_key_here_minimum_32_characters
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=30

# Cookie Configuration
COOKIE_SECURE=false
COOKIE_DOMAIN=
COOKIE_SAMESITE=lax

# LLM Providers
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama3-70b-8192

GOOGLE_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-1.5-flash

# Embeddings & Web Search
HUGGINGFACE_API_KEY=hf_...
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
TAVILY_API_KEY=tvly-...

# Observability (Optional)
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=lsv2_...
LANGSMITH_PROJECT=nexora-development
```

#### 2. Frontend Configuration (`client/.env.local`)
Create a `.env.local` file in the `client/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

### Running with Docker Compose (Recommended)

Start the backend container in development mode with live code reloading:

```bash
docker compose up --build
```

The server container maps to port `8000` and automatically mounts your local code volume for immediate hot-reloads via `WATCHFILES_FORCE_POLLING`.

In a separate terminal, launch the frontend development server:

```bash
cd client
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Manual Local Setup

#### Backend Setup (`server`)

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies with `uv`:
   ```bash
   uv sync
   ```
3. Apply database migrations:
   ```bash
   uv run alembic upgrade head
   ```
4. Start the FastAPI development server:
   ```bash
   uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   Interactive Swagger documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

#### Frontend Setup (`client`)

1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Launch the Next.js development server:
   ```bash
   pnpm dev
   ```
4. Access the web interface at [http://localhost:3000](http://localhost:3000).

---

## 📡 API Reference & Streaming Protocol

### REST Endpoints

Nexora exposes a clean, modular REST interface versioned under `/api/v1`:

| Endpoint | Method | Tag | Description |
| :--- | :---: | :--- | :--- |
| `/api/v1/health` | `GET` | Health | Deep health check probing PostgreSQL & Redis latency with status |
| `/api/v1/auth/register` | `POST` | Authentication | Register a new user account (rate-limited) |
| `/api/v1/auth/login` | `POST` | Authentication | Authenticate user, issue HTTP-only cookies and CSRF token (rate-limited) |
| `/api/v1/auth/refresh` | `POST` | Authentication | Rotate refresh token and issue new access token |
| `/api/v1/auth/logout` | `POST` | Authentication | Revoke session, blacklist access token in Redis, and clear cookies |
| `/api/v1/auth/me` | `GET` | Authentication | Retrieve profile of currently authenticated user |
| `/api/v1/auth/forgot-password` | `POST` | Authentication | Generate secure password reset token (rate-limited) |
| `/api/v1/auth/reset-password` | `POST` | Authentication | Reset account password using token |
| `/api/v1/ai/chat/stream` | `POST` | AI Execution | **SSE Stream**: Execute query across LangGraph multi-agent network (rate-limited) |
| `/api/v1/ai/chat` | `POST` | AI Execution | Synchronous non-streaming query execution (rate-limited) |
| `/api/v1/ai/chat/conversation/{id}` | `DELETE` | AI Execution | Clear thread LangGraph checkpointer memory state |
| `/api/v1/ai/langsmith/status` | `GET` | AI Execution | Check active LangSmith telemetry and tracing status |
| `/api/v1/chat/conversations` | `GET` | Chat Storage | List all conversations for authenticated user (Redis cached) |
| `/api/v1/chat/conversations` | `POST` | Chat Storage | Create conversation with automatic ChatGPT-style title generation |
| `/api/v1/chat/conversations/{id}` | `GET` | Chat Storage | Fetch conversation details along with full message history (Redis cached) |
| `/api/v1/chat/conversations/{id}` | `PATCH` | Chat Storage | Update conversation title, pinned status, or archive state |
| `/api/v1/chat/conversations/{id}` | `DELETE` | Chat Storage | Delete a specific conversation thread and invalidate cache |
| `/api/v1/chat/conversations` | `DELETE` | Chat Storage | Delete all conversations for current user and invalidate caches |
| `/api/v1/chat/conversations/{id}/generate-title` | `POST` | Chat Storage | Conditionally generate ChatGPT-style AI title for untitled chats |
| `/api/v1/chat/generate-title` | `POST` | Chat Storage | Generate standalone dynamic AI title from prompt (rate-limited) |
| `/api/v1/chat/conversations/{id}/messages` | `GET` | Chat Storage | Fetch all messages for a specific conversation (Redis cached) |
| `/api/v1/chat/conversations/{id}/messages` | `POST` | Chat Storage | Append user or assistant message to conversation thread |
| `/api/v1/pins` | `POST` | Pinned Messages | Pin an important message within a conversation |
| `/api/v1/pins` | `GET` | Pinned Messages | List user's pinned messages (optionally filter by `conversation_id`) |
| `/api/v1/pins/{pin_id}` | `DELETE` | Pinned Messages | Unpin / delete a pinned message |
| `/api/v1/pins/message/{message_id}` | `DELETE` | Pinned Messages | Unpin a message by its message ID |
| `/api/v1/documents/upload` | `POST` | Documents & RAG | Ingest in-memory PDF or DOCX file with PII detection |
| `/api/v1/documents/youtube` | `POST` | Documents & RAG | Ingest YouTube video transcript & metadata into pgvector |
| `/api/v1/documents` | `GET` | Documents & RAG | List all ingested documents and videos owned by user |
| `/api/v1/documents/{id}` | `GET` | Documents & RAG | Retrieve metadata for an ingested document or video |
| `/api/v1/documents/{id}/youtube`| `GET` | Documents & RAG | Fetch detailed transcript snippets and timestamps for a video |
| `/api/v1/documents/{id}` | `DELETE` | Documents & RAG | Delete document or video and purge vector embeddings |
| `/api/v1/documents/query` | `POST` | Documents & RAG | Scoped semantic similarity query across document chunks |
| `/api/v1/memory` | `GET` | Long-Term Memory | List stored long-term facts and user preferences |
| `/api/v1/memory` | `POST` | Long-Term Memory | Manually store a persistent fact or preference |
| `/api/v1/memory/search` | `GET` | Long-Term Memory | Semantic vector search across user memories |
| `/api/v1/memory/{id}` | `DELETE` | Long-Term Memory | Delete a specific memory item |

### SSE Streaming Events Protocol

The `/api/v1/ai/chat/stream` endpoint streams real-time Server-Sent Events with structured JSON payloads:

- **`status`**: Agent node progress updates (e.g. `{"step": "Evaluating safety policies..."}`, `{"step": "Routing to Math Agent..."}`).
- **`search`**: Metadata for live web searches or document vector queries (e.g. query terms and retrieved domain sources).
- **`ui`**: Typed payloads for Generative UI cards:
  - `youtube`: Video ID, title, channel name, thumbnail, and timestamped transcript snippets.
  - `math`: Expression, LaTeX string, and step-by-step mathematical derivation.
  - `time`: Current timezone, local time, and country metadata.
  - `search_results`: Citations, page titles, and destination URLs.
  - `chart` / `table`: Analytical datasets and visualization specifications.
- **`token`**: Incremental LLM text tokens streamed directly to Markdown and KaTeX renderers.
- **`done`**: Emitted upon successful completion of graph execution.
- **`error`**: Dispatched if any stage encounters an unrecoverable exception.

---

## 🧪 Testing

The backend includes a comprehensive suite of **70 automated unit and integration tests** covering guardrails, isolation, Redis caching, rate limiting, security fixes, YouTube ingestion, and the symbolic math engine:

```bash
cd server
uv run pytest
```

### Targeted Test Suites

```bash
# Test Redis connection, JSON caching, sliding-window rate limiting, and fallback
uv run pytest tests/test_redis.py

# Test CSRF protection, IDOR prevention on message endpoints, and token blacklisting
uv run pytest tests/test_security_fixes.py

# Test YouTube video transcript ingestion and chunking
uv run pytest tests/test_youtube_ingest.py

# Test in-memory document PII scanning and guardrails
uv run pytest tests/test_document_guardrails.py

# Test prompt injection and output secret redaction guardrails
uv run pytest tests/test_guardrails.py

# Test RAG document isolation across users
uv run pytest tests/test_rag_isolation.py

# Test SymPy symbolic math computation and LaTeX formatting
uv run pytest tests/test_math_tool.py

# Test authentication, session cookies, and JWT token rotation
uv run pytest tests/test_auth.py

# Test conversation storage, auto-titling, and memory retrieval
uv run pytest tests/test_chat_memory.py

# Test conversation deletion cascade and cache invalidation
uv run pytest tests/test_chat_delete.py

# Test RAG document endpoints (upload, query, delete)
uv run pytest tests/test_rag_endpoints.py

# Test LangSmith telemetry and status reporting
uv run pytest tests/test_langsmith.py
```

---
