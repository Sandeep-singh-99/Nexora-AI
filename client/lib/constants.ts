import {
  MessageSquare,
  Brain,
  Search,
  Bot,
  Plug,
  LayoutDashboard,
  Globe,
  Users,
  Tv,
  FileText,
  Calculator,
  ShieldCheck,
  Database,
  Sparkles,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Features", href: "#features" },
  { label: "Research", href: "#features" },
  { label: "Knowledge", href: "#features" },
  { label: "Agents", href: "#features" },
];

export interface FeatureItem {
  id: string;
  iconName: string;
  icon: typeof MessageSquare;
  title: string;
  description: string;
  badge?: string;
  category: "all" | "rag" | "agents" | "ui" | "security";
  tags: string[];
  highlight?: boolean;
}

export const FEATURE_CATEGORIES = [
  { id: "all", label: "All Capabilities" },
  { id: "rag", label: "Agentic RAG & Video" },
  { id: "agents", label: "Multi-Agent System" },
  { id: "ui", label: "Generative UI" },
  { id: "security", label: "Safety & Privacy" },
] as const;

export const FEATURES: FeatureItem[] = [
  {
    id: "youtube-rag",
    iconName: "Tv",
    icon: Tv,
    title: "Interactive YouTube Video RAG",
    description:
      "Type /youtube <URL> to transcribe any YouTube video in seconds. Indexed into pgvector with clickable timestamps so you can jump straight to relevant moments in playback.",
    badge: "New Feature",
    category: "rag",
    tags: ["/youtube Command", "Auto-Transcribe", "Click-to-Seek"],
    highlight: true,
  },
  {
    id: "document-rag",
    iconName: "FileText",
    icon: FileText,
    title: "Private In-Memory Document RAG",
    description:
      "Upload PDF and Word (.docx) files with zero permanent storage. Documents are parsed in-memory, chunked, and stored in pgvector (768-dim embeddings) for grounded retrieval.",
    badge: "Zero Disk Storage",
    category: "rag",
    tags: ["pgvector 768-dim", "HNSW Cosine", "Grounded Citations"],
    highlight: true,
  },
  {
    id: "multi-agent",
    iconName: "Bot",
    icon: Bot,
    title: "LangGraph Multi-Agent Architecture",
    description:
      "An intelligent stateful graph orchestrator that evaluates intent and routes dynamically to specialized Chat, Coding, Math, and Research agents with memory checkpointers.",
    badge: "LangGraph 1.2",
    category: "agents",
    tags: ["Dynamic Router", "Coding Agent", "Math Agent", "Checkpointer"],
    highlight: true,
  },
  {
    id: "web-research",
    iconName: "Globe",
    icon: Globe,
    title: "Live Web Grounding (Tavily)",
    description:
      "Integrated web search brings fresh information, recent events, and documentation directly into conversations with Perplexity-style favicon-backed domain sources.",
    badge: "Real-time Search",
    category: "agents",
    tags: ["Tavily Engine", "Live Web", "Source Attribution"],
  },
  {
    id: "generative-ui",
    iconName: "LayoutDashboard",
    icon: LayoutDashboard,
    title: "Dynamic Generative UI",
    description:
      "Responses stream beyond static text into interactive UI cards: interactive charts, sortable data tables, math cards with KaTeX display, time widgets, and video players.",
    badge: "Generative UI",
    category: "ui",
    tags: ["Interactive Charts", "Data Tables", "KaTeX Math", "Video Player"],
  },
  {
    id: "math-engine",
    iconName: "Calculator",
    icon: Calculator,
    title: "Symbolic Mathematics Engine",
    description:
      "Powered by SymPy and SciPy to solve complex calculus, linear algebra, and algebraic systems with verified step-by-step reasoning and formatted LaTeX rendering.",
    badge: "SymPy + SciPy",
    category: "agents",
    tags: ["Exact Calculus", "Algebra Solver", "LaTeX Display"],
  },
  {
    id: "safety-guardrails",
    iconName: "ShieldCheck",
    icon: ShieldCheck,
    title: "Dual-Layer Safety & PII Guardrails",
    description:
      "Real-time input and output abuse filters prevent prompt injections, while automated PII scanning with Human-in-the-Loop dialogs safeguards your confidential data.",
    badge: "Enterprise Grade",
    category: "security",
    tags: ["Abuse Filter", "PII Scanning", "HITL Confirmation"],
  },
  {
    id: "memory-sessions",
    iconName: "Database",
    icon: Database,
    title: "Thread Memory & Scoped Focus",
    description:
      "Persistent multi-conversation history with automated ChatGPT-style title generation, message pinning, draft states, and strict document focus scoping.",
    badge: "Stateful Chat",
    category: "ui",
    tags: ["Auto-Titles", "Message Pinning", "Document Scoping"],
  },
];

export interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  avatarBg: string;
}

export const TESTIMONIALS: TestimonialItem[] = [
  {
    quote:
      "Nexora brings research, context, and AI assistance into one place. It feels less like another chatbot and more like a workspace built around how we actually think.",
    name: "Alex Morgan",
    role: "Product Lead",
    company: "Northstar Labs",
    initials: "AM",
    avatarBg: "from-emerald-500 to-teal-600",
  },
  {
    quote:
      "The ability to connect our own knowledge with AI tools changes the workflow completely. We spend less time searching and more time making decisions.",
    name: "Sarah Chen",
    role: "Head of Research",
    company: "Vertex Systems",
    initials: "SC",
    avatarBg: "from-teal-500 to-emerald-400",
  },
  {
    quote:
      "Nexora gives our team a much better way to work with large amounts of information without losing the context behind it.",
    name: "Daniel Brooks",
    role: "Engineering Lead",
    company: "Orbit Labs",
    initials: "DB",
    avatarBg: "from-emerald-600 to-teal-500",
  },
];

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Knowledge", href: "#features" },
      { label: "Research", href: "#features" },
      { label: "Agents", href: "#features" },
      { label: "MCP", href: "#features" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Guides", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Community", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];
