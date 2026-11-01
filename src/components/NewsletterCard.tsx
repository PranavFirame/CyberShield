"use client";

import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle, Shield, ArrowRight, Loader2 } from "lucide-react";

interface NewsletterCardProps {
  source?: string;
  variant?: "card" | "inline" | "footer";
  title?: string;
  description?: string;
}

export default function NewsletterCard({
  source = "general",
  variant = "card",
  title = "CyberShield Intelligence Digest",
  description = "Join 14,000+ engineers receiving curated zero-day analyses, AST vulnerability breakdowns, and open-source security alerts monthly. Zero spam.",
}: NewsletterCardProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    if (!consent) {
      setMessage({
        text: "Please check the box to confirm you agree to receive security digests.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consentGiven: consent ? 1 : 0, source }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setMessage({ text: data.message || "Subscribed successfully!", type: "success" });
      setEmail("");
      setConsent(false);
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  if (variant === "footer") {
    return (
      <div className="w-full">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
          {title}
        </h4>
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
          {description}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="security@company.com"
              className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-xs"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Subscribe"}
            </button>
          </div>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-3 w-3"
            />
            <span>I agree to receive monthly security digests. Unsubscribe anytime.</span>
          </label>
        </form>
        {message && (
          <p className={`mt-2 text-xs ${message.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
            {message.text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden vault-card p-6 sm:p-8 shadow-2xl border border-white/10 bg-[#0E111A]/90">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F09E4F]/10 text-[#F09E4F] border border-[#F09E4F]/30 text-[11px] font-semibold mb-2.5">
            <Shield className="h-3 w-3 text-[#F09E4F]" /> MONTHLY DEFENSIVE INTELLIGENCE
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full sm:max-w-sm">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@company.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/5 border border-white/10 rounded-full text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F09E4F] focus:ring-1 focus:ring-[#F09E4F] font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-full bg-[#F09E4F] hover:bg-[#E08E3F] text-xs font-bold text-slate-950 transition disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-md shadow-[rgba(240,158,79,0.25)] shrink-0"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-950" />
              ) : (
                <div className="flex items-center gap-1">
                  <span>Subscribe</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </button>
          </div>

          <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="rounded border-slate-700 bg-white/5 text-[#F09E4F] focus:ring-[#F09E4F] h-3.5 w-3.5"
            />
            <span>I agree to receive monthly security digests. Unsubscribe anytime.</span>
          </label>

          {message && (
            <p
              className={`text-xs mt-1 font-medium ${
                message.type === "success" ? "text-[#64D771]" : "text-rose-400"
              }`}
            >
              {message.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
