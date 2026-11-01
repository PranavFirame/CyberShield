"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, BookOpen, HelpCircle, Globe, Menu, X, ArrowRight } from "lucide-react";

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur px-4 sm:px-6 py-3.5 flex flex-col shadow-2xs">
      <div className="flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 sm:h-9 w-8 sm:w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform">
            <Shield className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">
                Cyber<span className="text-sky-600">Shield</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block font-medium">Defensive Security & AST Analysis</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <nav className="flex items-center gap-1 font-semibold text-slate-600 mr-2">
            <Link
              href="/"
              className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1"
            >
              <Shield className="h-3.5 w-3.5 text-sky-600" />
              <span>Scanner</span>
            </Link>
            <Link
              href="/blog"
              className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1"
            >
              <BookOpen className="h-3.5 w-3.5 text-sky-600" />
              <span>Blog</span>
            </Link>
            <Link
              href="/faq"
              className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1"
            >
              <HelpCircle className="h-3.5 w-3.5 text-sky-600" />
              <span>FAQ</span>
            </Link>
            <Link
              href="/sitemap"
              className="px-2.5 py-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1"
            >
              <Globe className="h-3.5 w-3.5 text-sky-600" />
              <span>Sitemap</span>
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-1.5 text-slate-500 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-full font-medium shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px]">Zero-Execution Sandbox</span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold text-xs text-white shadow-xs transition"
          >
            <span>Launch Audit</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/"
            className="px-2.5 py-1.5 rounded-lg bg-sky-600 text-white font-semibold text-xs flex items-center gap-1 shadow-xs"
          >
            <span>Audit</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-3.5 pb-2 border-t border-slate-100 mt-3 flex flex-col gap-2 text-xs animate-in slide-in-from-top-2 duration-150">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold transition"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-sky-600" />
              <span>Vulnerability Scanner</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <Link
            href="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold transition"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-sky-600" />
              <span>Security Research Blog</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <Link
            href="/faq"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold transition"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-sky-600" />
              <span>Frequently Asked Questions</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <Link
            href="/sitemap"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold transition"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-sky-600" />
              <span>HTML Navigation Sitemap</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-3 py-1.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Zero-Execution Sandbox Active
            </span>
            <span className="font-mono text-slate-400">v2.4</span>
          </div>
        </div>
      )}
    </header>
  );
}
