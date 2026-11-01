"use client";

import { useState } from "react";
import { Shield, Lock, User, Github, AlertCircle, X, Check, ArrowRight } from "lucide-react";

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
  const [githubHandle, setGithubHandle] = useState("pranavfirame");
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

  async function handleGithubAuth(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const handle = githubHandle.trim().replace(/^@/, "");
    if (!handle) {
      setError("Please enter your GitHub username");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUsername: handle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "GitHub authentication failed");

      onSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "GitHub authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">CyberShield Access</h3>
              <p className="text-[11px] text-slate-500">Sign in to track reports & locate previous scans</p>
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
        <div className="grid grid-cols-3 border-b border-slate-200 text-xs font-semibold text-center">
          <button
            onClick={() => { setTab("LOGIN"); setError(null); }}
            className={`py-3 transition cursor-pointer border-b-2 ${
              tab === "LOGIN"
                ? "border-sky-600 text-sky-700 bg-sky-50/30"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("REGISTER"); setError(null); }}
            className={`py-3 transition cursor-pointer border-b-2 ${
              tab === "REGISTER"
                ? "border-sky-600 text-sky-700 bg-sky-50/30"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setTab("GITHUB"); setError(null); }}
            className={`py-3 transition cursor-pointer border-b-2 ${
              tab === "GITHUB"
                ? "border-sky-600 text-sky-700 bg-sky-50/30"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            GitHub OAuth
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
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
            <form onSubmit={handleGithubAuth} className="flex flex-col py-2">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-2 shadow-md">
                  <Github className="h-7 w-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">GitHub Single Sign-On</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Authenticate with your GitHub handle to sync all your public repositories and run 1-click defensive audits.
                </p>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-700 mb-1 block">GitHub Handle / Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                    @
                  </div>
                  <input
                    type="text"
                    required
                    value={githubHandle}
                    onChange={(e) => setGithubHandle(e.target.value)}
                    placeholder="e.g. pranavfirame or octocat"
                    className="w-full pl-8 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600 font-mono"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-400">Quick handles:</span>
                  <button
                    type="button"
                    onClick={() => setGithubHandle("pranavfirame")}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  >
                    pranavfirame
                  </button>
                  <button
                    type="button"
                    onClick={() => setGithubHandle("octocat")}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  >
                    octocat
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !githubHandle.trim()}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 font-semibold text-xs text-white shadow-md shadow-slate-900/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Github className="h-4 w-4" />
                {loading ? "Connecting to GitHub..." : "Continue with GitHub"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
