"use client";

import { useState, useEffect } from "react";
import {
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Lock,
  ArrowRight,
  X,
  FileQuestion,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// 4. No Internet State Banner (Offline + Cached Content)
// ─────────────────────────────────────────────────────────────
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        setIsReconnecting(false);
      };
      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  if (isOnline) return null;

  function handleRetryConnection() {
    setIsReconnecting(true);
    setTimeout(() => {
      setIsOnline(navigator.onLine);
      setIsReconnecting(false);
    }, 1500);
  }

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-md sticky top-0 z-50 border-b border-amber-600">
      <div className="flex items-center gap-2 mx-auto sm:mx-0">
        <WifiOff className="h-4 w-4 shrink-0 animate-pulse text-amber-950" />
        <span>
          <strong>You are currently offline.</strong> Showing cached vulnerability data from your last visit.
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-3">
        <span className="text-[11px] font-mono text-amber-900 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-900 animate-ping" />
          Reconnecting in background…
        </span>
        <button
          onClick={handleRetryConnection}
          disabled={isReconnecting}
          className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isReconnecting ? "animate-spin" : ""}`} />
          {isReconnecting ? "Checking..." : "Retry"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. Session Expired State Modal
// ─────────────────────────────────────────────────────────────
export function SessionExpiredModal({
  isOpen,
  onSignIn,
  onDismiss,
}: {
  isOpen: boolean;
  onSignIn: () => void;
  onDismiss: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col items-center text-center animate-in zoom-in-95">
        <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
          <Clock className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Session Expired</h3>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed max-w-xs">
          You were signed out after 30 minutes of inactivity for security reasons.{" "}
          <strong className="text-emerald-700 block mt-1">
            ✓ Don’t worry: your current scan results and model sliders are safely preserved.
          </strong>
        </p>

        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onSignIn}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold text-xs text-white shadow-xs transition cursor-pointer"
          >
            Sign in and continue
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
          >
            Dismiss and stay as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. Permission Denied State Modal
// ─────────────────────────────────────────────────────────────
export function PermissionDeniedModal({
  isOpen,
  onClose,
  onAdminLogin,
  onTryPublic,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdminLogin: () => void;
  onTryPublic: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 animate-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Permission Required</h3>
              <p className="text-[11px] text-slate-500">Access to private target or elevated admin tool</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
          <p>
            <strong>Why was access denied?</strong> CyberShield operates under a strict defensive zero-execution sandbox. Scanning private organizations or accessing the Admin Console requires authenticated credentials.
          </p>
          <p className="text-slate-500 text-[11px]">
            We cannot read private code without an authorized GitHub OAuth grant or Administrator role.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => {
              onClose();
              onAdminLogin();
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="h-4 w-4" />
            Sign in as Admin
          </button>
          <button
            onClick={() => {
              onClose();
              onTryPublic();
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            Audit Public Repo Instead
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. Structured Error State Component
// ─────────────────────────────────────────────────────────────
export function StructuredErrorCard({
  errorMsg,
  onRetry,
  onFillSample,
}: {
  errorMsg: string;
  onRetry: () => void;
  onFillSample: (url: string) => void;
}) {
  const is404 = errorMsg.toLowerCase().includes("not found") || errorMsg.includes("404");
  const isSsrf = errorMsg.toLowerCase().includes("ssrf") || errorMsg.toLowerCase().includes("internal") || errorMsg.toLowerCase().includes("loopback");
  const isNetwork = errorMsg.toLowerCase().includes("fetch") || errorMsg.toLowerCase().includes("connect") || errorMsg.toLowerCase().includes("offline");

  const errorDiagnosis = isSsrf
    ? {
        title: "SSRF Security Filter Triggered",
        fault: "Client input targeted an internal, loopback (127.0.0.1), or private IP network.",
        fix: "Enter a publicly routable web domain (e.g. https://example.com) or public GitHub URL.",
      }
    : is404
    ? {
        title: "Repository Not Found or Access Denied",
        fault: "GitHub's API could not locate the repository specified. It is either private, misspelled, or deleted.",
        fix: "Check for typos in owner/repo or ensure repository visibility is set to Public on GitHub.",
      }
    : isNetwork
    ? {
        title: "Destination Network Unreachable",
        fault: "Connection timed out while resolving DNS or establishing HTTPS handshake with target host.",
        fix: "Verify your internet connection, test that the target URL loads in your browser, and retry.",
      }
    : {
        title: "Audit Analysis Error",
        fault: `The analysis engine encountered an unexpected condition: "${errorMsg}"`,
        fix: "Verify target syntax or try one of the verified sample repositories below.",
      };

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-xs max-w-3xl mx-auto flex flex-col gap-4 text-xs">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-rose-900">{errorDiagnosis.title}</h3>
          <p className="text-rose-700 mt-0.5 leading-relaxed">
            <strong>Whose fault / Cause:</strong> {errorDiagnosis.fault}
          </p>
          <p className="text-rose-800 mt-1 font-medium">
            <strong>How to fix it:</strong> {errorDiagnosis.fix}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-200/80">
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-xs text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Audit
        </button>
        <button
          onClick={() => onFillSample("https://github.com/expressjs/express")}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-100/70 border border-rose-300 font-semibold text-xs text-rose-800 transition cursor-pointer"
        >
          Try Sample: expressjs/express
        </button>
        <button
          onClick={() => onFillSample("https://example.com")}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-100/70 border border-rose-300 font-semibold text-xs text-rose-800 transition cursor-pointer"
        >
          Try Sample: example.com
        </button>
      </div>
    </div>
  );
}
