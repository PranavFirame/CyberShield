import type { Metadata } from "next";
import "./globals.css";
import GlobalFooter from "@/components/GlobalFooter";
import SupportChatbot from "@/components/SupportChatbot";

export const metadata: Metadata = {
  title: "CyberShield — Defensive Code Security & Vulnerability Scanner",
  description: "Enterprise Code Security Analysis, AST Novel Bug Discovery & Worst-Case Disaster Risk Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-sky-500/20 selection:text-sky-700 min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col">{children}</div>
        <GlobalFooter />
        <SupportChatbot />
      </body>
    </html>
  );
}
