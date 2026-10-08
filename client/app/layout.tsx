import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ArtifactProvider } from "@/components/providers/artifact-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Nexora AI — Your Knowledge. Your Research. One Intelligent Workspace.",
  description:
    "Nexora AI brings your knowledge, research, AI agents, and intelligent workflows together in one powerful workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen bg-slate-50 dark:bg-[#05070B] text-slate-900 dark:text-[#F5F7FA] font-sans antialiased flex flex-col transition-colors duration-150">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <ArtifactProvider>{children}</ArtifactProvider>
            </AuthProvider>
          </QueryProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
