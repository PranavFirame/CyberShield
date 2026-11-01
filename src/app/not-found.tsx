import Link from "next/link";
import { Shield, Home, Search, BookOpen, HelpCircle, ArrowRight } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found | CyberShield",
  description: "The requested security resource or page could not be located.",
};

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-lg">
        {/* Shield Icon Badge */}
        <div className="h-16 w-16 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Shield className="h-8 w-8" />
        </div>

        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold uppercase tracking-wider mb-3 inline-block">
          HTTP Error 404
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Perimeter Not Found
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
          The security audit, document, or resource URL you requested does not exist or has been relocated to another address.
        </p>

        {/* Quick Links */}
        <div className="mt-8 space-y-2 text-left">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Recommended Destinations
          </div>

          <Link
            href="/"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-300 transition text-xs font-semibold text-slate-800 group"
          >
            <div className="flex items-center gap-2.5">
              <Home className="h-4 w-4 text-sky-600" />
              <span>Return to Audit Scanner (Home)</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/blog"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-300 transition text-xs font-semibold text-slate-800 group"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-4 w-4 text-sky-600" />
              <span>Browse Security Blog & Research</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/faq"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-300 transition text-xs font-semibold text-slate-800 group"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="h-4 w-4 text-sky-600" />
              <span>Knowledge Base & FAQs</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>CyberShield Security Platform</span>
          <a href="mailto:support@cybershield.dev" className="text-sky-600 hover:underline">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
