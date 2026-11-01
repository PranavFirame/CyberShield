import Link from "next/link";
import { Shield, ExternalLink, Github, Heart } from "lucide-react";
import NewsletterCard from "./NewsletterCard";

export default function GlobalFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      {/* Newsletter Bar */}
      <div className="border-b border-slate-100 py-8 px-4 sm:px-6 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <NewsletterCard
            source="global_footer"
            variant="inline"
            title="CyberShield Monthly Security Dispatch"
            description="Subscribe for curated AST taint tracking research, novel zero-day disclosures, and open-source defensive tutorials. Zero spam."
          />
        </div>
      </div>

      {/* Multi-Column Links */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <Shield className="h-4 w-4 text-sky-400" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Cyber<span className="text-sky-600">Shield</span>
              </span>
            </Link>

            <p className="mt-3 text-xs text-slate-500 leading-relaxed max-w-sm">
              Defensive security intelligence and dual AST analysis engines. Audit public repositories and domains with zero code execution and financial disaster exposure modeling.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Zero-Execution Sandbox Active
              </span>
            </div>
          </div>

          {/* Col 1: Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5">
              Product
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="/" className="hover:text-sky-600 transition">Vulnerability Scanner</Link>
              </li>
              <li>
                <Link href="/#ast-engine" className="hover:text-sky-600 transition">AST Novel Bug Engine</Link>
              </li>
              <li>
                <Link href="/#disaster-model" className="hover:text-sky-600 transition">Disaster Cost Model</Link>
              </li>
              <li>
                <Link href="/#github-repos" className="hover:text-sky-600 transition">1-Click GitHub Audit</Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-sky-600 transition">PDF Report Exports</Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Resources & Knowledge */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5">
              Knowledge Hub
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="/blog" className="hover:text-sky-600 transition">Security Research Blog</Link>
              </li>
              <li>
                <Link href="/blog?category=Vulnerability+Research" className="hover:text-sky-600 transition">Vulnerability Research</Link>
              </li>
              <li>
                <Link href="/blog?category=Application+Security" className="hover:text-sky-600 transition">AppSec Tutorials</Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-sky-600 transition">Knowledge Base (FAQ)</Link>
              </li>
              <li>
                <Link href="/sitemap" className="hover:text-sky-600 transition">HTML Sitemap Directory</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5">
              Trust & Legal
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="/legal/privacy" className="hover:text-sky-600 transition">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-sky-600 transition">Terms of Service</Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="hover:text-sky-600 transition">Cookie Policy</Link>
              </li>
              <li>
                <Link href="/legal/disclosure" className="hover:text-sky-600 transition">Responsible Disclosure</Link>
              </li>
              <li>
                <a href="mailto:support@cybershield.dev" className="hover:text-sky-600 transition">Contact Security Team</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} CyberShield Security Systems. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/legal/privacy" className="hover:text-slate-600 transition">Privacy</Link>
            <span>·</span>
            <Link href="/legal/terms" className="hover:text-slate-600 transition">Terms</Link>
            <span>·</span>
            <Link href="/sitemap" className="hover:text-slate-600 transition">Sitemap</Link>
            <span>·</span>
            <a href="https://github.com/PranavFirame/CyberShield" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition flex items-center gap-1">
              <Github className="h-3 w-3" /> GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
