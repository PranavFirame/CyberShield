import Link from "next/link";
import { prisma, ensureContentSeeded } from "@/lib/db";
import { Shield, Globe, BookOpen, HelpCircle, FileText, Lock, ArrowRight } from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HTML Sitemap | CyberShield",
  description: "Complete public directory of all CyberShield application scanner pages, cybersecurity articles, FAQs, and legal trust center documentation.",
};

export default async function HtmlSitemapPage() {
  await ensureContentSeeded();
  const articles = await prisma.article.findMany({ where: { status: "PUBLISHED" } });

  const corePages = [
    { title: "Home & Vulnerability Scanner", href: "/", desc: "Audit public GitHub repositories and web domains." },
    { title: "Security Blog & Knowledge Hub", href: "/blog", desc: "Technical cybersecurity research and novel bug disclosures." },
    { title: "Frequently Asked Questions", href: "/faq", desc: "12-category knowledge base covering engines, scoring, and data security." },
    { title: "Public HTML Sitemap", href: "/sitemap", desc: "Complete directory of public pages and resources." },
  ];

  const legalPages = [
    { title: "Privacy Policy", href: "/legal/privacy", desc: "Data processing, zero-execution sandbox, and retention policies." },
    { title: "Terms of Service", href: "/legal/terms", desc: "Authorized usage, public scanning boundaries, and acceptable terms." },
    { title: "Cookie & Analytics Policy", href: "/legal/cookies", desc: "Essential security cookies and privacy rights." },
    { title: "Responsible Security Disclosure", href: "/legal/disclosure", desc: "Guidelines for reporting security vulnerabilities to CyberShield." },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      <PublicNavbar />
      {/* Header */}
      <div className="bg-gradient-to-b from-white via-sky-50/20 to-slate-50 border-b border-slate-200 py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <Link href="/" className="hover:text-slate-900 transition">Home</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Sitemap</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold mb-3">
            <Globe className="h-3.5 w-3.5 text-sky-600" />
            <span>PUBLIC SITEMAP DIRECTORY</span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            CyberShield Sitemaps & Navigation Directory
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-xl leading-relaxed">
            A comprehensive, human-readable hierarchy of public pages, published research articles, knowledge center guides, and trust disclosures.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex-1 space-y-10">
        {/* Main Platform Pages */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-sky-600" /> Platform & Scanner
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {corePages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-4 transition shadow-2xs hover:shadow-xs group flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition flex items-center justify-between">
                    <span>{page.title}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">{page.desc}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-3">{page.href}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Security Research & Articles */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-sky-600" /> Published Security Research ({articles.length})
          </h2>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 divide-y divide-slate-100 shadow-2xs">
            {articles.map((article) => (
              <div key={article.id} className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="text-xs font-bold text-slate-900 hover:text-sky-600 transition line-clamp-1"
                  >
                    {article.title}
                  </Link>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{article.summary}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[10px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                    {article.category}
                  </span>
                  <span>{article.readingTimeMinutes} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal & Trust Center */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-sky-600" /> Trust, Privacy & Legal Policies
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {legalPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-4 transition shadow-2xs hover:shadow-xs group flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition flex items-center justify-between">
                    <span>{page.title}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">{page.desc}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-3">{page.href}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Search Engine Information */}
        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-800">Looking for machine-readable XML format?</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Automated web crawlers can access our dynamic XML sitemap directly.</p>
          </div>
          <Link
            href="/sitemap.xml"
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-semibold text-slate-700 hover:text-slate-900 shrink-0"
          >
            /sitemap.xml
          </Link>
        </div>
      </main>
    </div>
  );
}
