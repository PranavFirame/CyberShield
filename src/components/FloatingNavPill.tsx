"use client";

import Link from "next/link";
import { Shield, BookOpen, HelpCircle, Clock, ShieldAlert, LogOut, Terminal } from "lucide-react";

export interface NavPillUser {
  id: string;
  username: string;
  email?: string | null;
  role: "USER" | "ADMIN";
  githubUsername?: string | null;
}

interface FloatingNavPillProps {
  user: NavPillUser | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenHistory: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onScrollToAudit?: () => void;
}

export default function FloatingNavPill({
  user,
  onOpenAuth,
  onOpenProfile,
  onOpenHistory,
  onOpenAdmin,
  onLogout,
  onScrollToAudit,
}: FloatingNavPillProps) {
  return (
    <header className="nav-pill">
      <div className="rounded-full backdrop-blur-xl bg-[#131620]/90 border border-white/10 shadow-2xl px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F09E4F]/30 via-[#F09E4F]/15 to-transparent border border-[#F09E4F]/40 flex items-center justify-center shadow-[0_0_12px_rgba(240,158,79,0.25)] group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4 text-[#F09E4F]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
              CYBER<span className="text-[#F09E4F]">SHIELD</span>
            </span>
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-[#64D771]/10 text-[#64D771] border border-[#64D771]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64D771] animate-pulse" />
              ZERO-EXEC ACTIVE
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300">
          <a
            href="#features"
            className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition"
          >
            Features
          </a>
          <a
            href="#audit-terminal"
            className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition flex items-center gap-1 text-[#F09E4F]"
          >
            <Terminal className="w-3 h-3 text-[#F09E4F]" />
            <span>Live Audit</span>
          </a>
          <Link
            href="/blog"
            className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3 text-slate-400" />
            <span>Blog</span>
          </Link>
          <Link
            href="/faq"
            className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>FAQ</span>
          </Link>

          {/* Scan History: strictly conditionally rendered only when user is logged in */}
          {user ? (
            <button
              onClick={onOpenHistory}
              className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition flex items-center gap-1 text-slate-300 cursor-pointer"
            >
              <Clock className="w-3 h-3 text-[#F09E4F]" />
              <span>Scan History</span>
            </button>
          ) : null}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {user?.role === "ADMIN" && (
            <button
              onClick={onOpenAdmin}
              className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#F09E4F]/15 text-[#F09E4F] border border-[#F09E4F]/40 hover:bg-[#F09E4F]/25 transition cursor-pointer"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Admin</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white transition cursor-pointer"
                title="Profile & Settings"
              >
                <div className="w-5 h-5 rounded-full bg-[#F09E4F]/20 text-[#F09E4F] font-bold text-[10px] flex items-center justify-center font-mono uppercase border border-[#F09E4F]/30">
                  {user.username.substring(0, 2)}
                </div>
                <span className="font-mono text-[11px] font-semibold text-slate-200">
                  {user.username}
                </span>
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={onScrollToAudit || onOpenAuth}
                className="text-xs font-semibold text-slate-950 bg-[#F09E4F] hover:bg-[#E08E3F] px-4 py-1.5 rounded-full shadow-lg shadow-[rgba(240,158,79,0.25)] transition cursor-pointer flex items-center gap-1"
              >
                <span>Get Started</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
