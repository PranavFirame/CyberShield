import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CyberShield — Defensive Code Security & Vulnerability Scanner",
  description: "Enterprise Code Security Analysis, Vulnerability Auditing & Risk Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-sky-500/20 selection:text-sky-700">
        {children}
      </body>
    </html>
  );
}
