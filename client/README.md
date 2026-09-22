# ⚡ Nexora Frontend Client

> **High-Performance Next.js 16 Web Application for Nexora Multi-Agent AI**

The client application for Nexora is built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Motion**. It provides real-time Server-Sent Events (SSE) streaming, interactive Generative UI widgets (including YouTube playback with clickable timestamp seeking and KaTeX-rendered math), thread management, message pinning, and responsive multi-device design.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.3.4](https://nextjs.org/) (App Router, Server & Client Components)
- **UI & State**: [React 19.2.8](https://react.dev/), [@tanstack/react-query 5](https://tanstack.com/query)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [Base UI](https://base-ui.com/), [shadcn](https://ui.shadcn.com/)
- **Animations**: [Motion 13.2](https://motion.dev/)
- **Icons**: [Lucide React 1.43](https://lucide.dev/)
- **Rich Rendering**: [KaTeX](https://katex.org/), `react-markdown`, `remark-math`, `rehype-katex`, `remark-gfm`
- **Package Manager**: [pnpm 11](https://pnpm.io/)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (`corepack enable` or `npm install -g pnpm`)

### 2. Environment Configuration
Create a `.env.local` file in the `client/` root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Project Architecture

```plaintext
client/
├── app/
│   ├── (main)/               # Landing page with interactive feature mockups
│   ├── chat/                 # Real-time multi-agent chat interface & video player
│   ├── reset-password/       # Password recovery and reset forms
│   ├── globals.css           # Tailwind CSS v4 design tokens and theme configuration
│   └── layout.tsx            # Global layout with ThemeProvider and QueryClient
│
├── components/
│   ├── auth/                 # Authentication modals (Login, Signup, User Profile)
│   ├── chat/                 # Chat interface components
│   │   ├── assistant-message.tsx # Assistant response renderer with markdown & math
│   │   ├── chat-input.tsx        # Auto-resizing input, attachments, & slash commands
│   │   ├── chat-sidebar.tsx      # Conversation list, search, pinning, & history
│   │   ├── documents-dialog.tsx  # Modal for uploading files & entering YouTube URLs
│   │   ├── guardrails-dialog.tsx # Sensitive PII Human-in-the-Loop alert modal
│   │   ├── generative-ui.tsx     # Dynamic component registry dispatcher
│   │   └── generative/           # Generative UI widget components
│   │       ├── chart-card.tsx    # Interactive charts
│   │       ├── data-table.tsx    # Sortable data tables
│   │       ├── info-card.tsx     # Information highlight cards
│   │       ├── math-card.tsx     # KaTeX step-by-step calculus & algebra cards
│   │       ├── project-card.tsx  # Project summary cards
│   │       ├── search-results.tsx# Live web search citation cards
│   │       ├── time-card.tsx     # Interactive world clocks
│   │       └── youtube-card.tsx  # YouTube video player with timestamp seek
│   ├── landing/              # Landing page components (Hero, Features, Showcase)
│   └── ui/                   # Reusable UI primitives
│
├── hooks/
│   ├── use-auth.ts           # Authentication state and cookie handling
│   ├── use-chat-stream.ts    # SSE streaming engine with abort controller
│   └── use-mobile.ts         # Responsive viewport detection
│
├── lib/
│   ├── api/                  # Axios API clients (auth, chat, documents, memory, pins)
│   ├── constants.ts          # Landing page navigation, feature tags, and mockups
│   └── utils.ts              # Styling helpers and class merging (clsx + twMerge)
│
└── types/                    # TypeScript interfaces for chats, documents, and messages
```

---

## 🎨 Generative UI Components

When the backend streams a `ui` SSE event, `generative-ui.tsx` dynamically renders the matching component from the registry:

- **`YouTubeCard`** (`/youtube <URL>`): Plays YouTube videos inline, displays timestamped transcripts with clickable seekers, and provides instantaneous follow-up prompts.
- **`MathCard`**: Displays exact algebraic solutions, derivations, and formulas using KaTeX with a copyable LaTeX button.
- **`TimeCard`**: Renders live clocks with timezone offsets and country flags.
- **`SearchResults`**: Presents web sources with domain icons, titles, and hyperlinks.
- **`ChartCard` & `DataTable`**: Displays structured analytical data visually or in sortable rows.

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Starts development server on port 3000 |
| `pnpm build` | Compiles production-optimized build |
| `pnpm start` | Runs the compiled Next.js production build |
| `pnpm lint` | Runs ESLint 9 checks across the codebase |

---

## 📄 License

Licensed under the [MIT License](../README.md#license).
