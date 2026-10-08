"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"

interface ArtifactMarkdownPreviewProps {
  content: string
}

export function ArtifactMarkdownPreview({ content }: ArtifactMarkdownPreviewProps) {
  return (
    <div className="h-full w-full overflow-y-auto bg-slate-900/40 p-6 md:p-8 text-slate-100 select-text scrollbar-thin scrollbar-thumb-white/10">
      <div className="max-w-3xl mx-auto prose dark:prose-invert prose-emerald leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-6 mb-3 border-b border-white/10 pb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-semibold text-white mt-5 mb-2.5">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-100 mt-4 mb-2">{children}</h3>,
            p: ({ children }) => <p className="mb-3 leading-relaxed text-slate-300 text-sm">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1 text-sm text-slate-300">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-sm text-slate-300">{children}</ol>,
            table: ({ children }) => (
              <div className="overflow-x-auto my-4 rounded-xl border border-white/10 shadow-lg">
                <table className="w-full text-xs text-slate-200 border-collapse">{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-white/[0.06] border-b border-white/10 font-semibold">{children}</thead>,
            tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
            th: ({ children }) => <th className="p-2.5 text-left font-semibold text-white">{children}</th>,
            td: ({ children }) => <td className="p-2.5 text-slate-300">{children}</td>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-emerald-500 pl-4 py-1 italic bg-white/[0.02] rounded-r text-slate-400 my-3 text-sm">
                {children}
              </blockquote>
            ),
            code({ className, children, ...props }: any) {
              return (
                <code className="bg-white/10 font-mono text-xs px-1.5 py-0.5 rounded text-emerald-300" {...props}>
                  {children}
                </code>
              )
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
