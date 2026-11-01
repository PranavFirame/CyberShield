"use client";

import { useState } from "react";
import { Shield, Lock, User, Github, AlertCircle, X, ArrowRight, ExternalLink } from "lucide-react";

interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  role: "USER" | "ADMIN";
  githubUsername?: string | null;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"LOGIN" | "REGISTER" | "GITHUB">("LOGIN");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      onSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email: email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      onSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleInitiateGithubOAuth() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/github/status");
      const data = await res.json();
      if (!data.configured) {
        setError(
          "GitHub OAuth requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.local. Register an OAuth App in GitHub Developer Settings with callback URL: " +
            data.callbackUrl
        );
        setLoading(false);
        return;
      }

      // Redirect directly to official GitHub OAuth 2.0 authorization
      window.location.href = "/api/auth/github";
    } catch {
      window.location.href = "/api/auth/github";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">CyberShield Access</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500">Sign in to track reports & locate previous scans</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="grid grid-cols-3 border-b border-slate-200 text-[11px] sm:text-xs font-semibold text-center">
          <button
            onClick={() => { setTab("LOGIN"); setError(null); }}
            className={`py-2.5 sm:py-3 transition cursor-pointer border-b-2 ${
              tab === "LOGIN"
                ? "border-sky-600 text-sky-700 bg-sky-50/30"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("REGISTER"); setError(null); }}
            className={`py-2.5 sm:py-3 transition cursor-pointer border-b-2 ${
              tab === "REGISTER"
                ? "border-sky-600 text-sky-700 bg-sky-50/30"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setTab("GITHUB"); setError(null); }}
            className={`py-2.5 sm:py-3 transition cursor-pointer border-b-2 ${
              tab === "GITHUB"
                ? "border-sky-600 text-sky-700 bg-sky-50/30"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            GitHub OAuth
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-1">
                <span>{error}</span>
                {tab === "GITHUB" && (
                  <div className="pt-1">
                    <a
                      href="https://github.com/settings/developers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-700 font-semibold hover:underline inline-flex items-center gap-1 text-[11px]"
                    >
                      <span>Open GitHub Developer Settings</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "LOGIN" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Username or Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username or email address"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold text-xs text-white shadow-md shadow-sky-600/20 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Authenticating..." : "Sign In to CyberShield"}
              </button>
            </form>
          )}

          {tab === "REGISTER" && (
            <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose your username"
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dev@example.com"
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold text-xs text-white shadow-md shadow-sky-600/20 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Creating Profile..." : "Create Account"}
              </button>
            </form>
          )}

          {tab === "GITHUB" && (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-3 shadow-md">
                <Github className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">GitHub Single Sign-On</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                Authenticate securely using official GitHub OAuth 2.0. CyberShield verifies your identity directly with GitHub to sync and 1-click audit your repositories.
              </p>

              <button
                type="button"
                onClick={handleInitiateGithubOAuth}
                disabled={loading}
                className="mt-6 w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 font-semibold text-xs text-white shadow-md shadow-slate-900/20 transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <Github className="h-4 w-4" />
                <span>{loading ? "Connecting to GitHub..." : "Sign in with GitHub"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <p className="text-[11px] text-slate-400 mt-4 max-w-xs leading-normal">
                You will be redirected to GitHub to authorize CyberShield. We request read-only access to your public repositories.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
