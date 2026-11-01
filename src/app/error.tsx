"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, MessageSquare } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error without exposing to client DOM
    console.error("Application error boundary triggered:", error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white border border-rose-200 rounded-3xl p-8 sm:p-10 shadow-lg">
        {/* Warning Icon Badge */}
        <div className="h-16 w-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-mono text-xs font-bold uppercase tracking-wider mb-3 inline-block">
          Internal Exception Handled
        </span>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          System Temporarily Unavailable
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
          An unexpected error interrupted processing. Our defensive telemetry has logged the issue securely without leaking internal infrastructure details.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Return Home</span>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Error Reference: {error.digest || "SEC-ERR-500"}</span>
          <a
            href="mailto:support@cybershield.dev"
            className="text-sky-600 hover:underline flex items-center gap-1"
          >
            <MessageSquare className="h-3 w-3" />
            <span>Report Issue</span>
          </a>
        </div>
      </div>
    </div>
  );
}
