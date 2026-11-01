import Link from "next/link";
import { prisma, ensureContentSeeded } from "@/lib/db";
import { Shield, ChevronDown, Search, HelpCircle, ArrowRight, MessageSquare } from "lucide-react";
import NewsletterCard from "@/components/NewsletterCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Frequently Asked Questions (FAQ) | CyberShield",
  description: "Answers to common questions regarding CyberShield repository scanning, AST taint tracking, disaster models, and privacy policies.",
};

const FAQ_CATEGORIES = [
  "ALL",
  "Getting Started",
  "Repository Scanning",
  "Known Vulnerabilities",
  "Novel Bug Discovery",
  "AI Analysis",
  "Security Scores",
  "Risk and Impact Analysis",
  "Scan Reports",
  "Privacy and Data Security",
  "GitHub Integration",
  "Accounts and Authentication",
  "Subscriptions and Billing",
];

export default async function FaqPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  await ensureContentSeeded();
  const params = await searchParams;
  const activeCategory = params.category || "ALL";
  const searchQuery = (params.search || "").toLowerCase().trim();

  const allFaqs = await prisma.faq.findMany({
    where: {
      category: activeCategory !== "ALL" ? activeCategory : undefined,
      isPublished: 1,
    },
  });

  const filteredFaqs = searchQuery
    ? allFaqs.filter(
        (f) =>
          f.question.toLowerCase().includes(searchQuery) ||
          f.answer.toLowerCase().includes(searchQuery)
      )
    : allFaqs;

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col">
      {/* Top Breadcrumb / Nav */}
      <div className="border-b border-white/10 px-6 py-4 bg-[#0E1017]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-full bg-[#F09E4F]/20 border border-[#F09E4F]/30 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-[#F09E4F]" />
            </div>
            <span className="font-extrabold text-sm text-white">
              CYBER<span className="text-[#F09E4F]">SHIELD</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/" className="text-slate-400 hover:text-white transition">
              Home
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-[#F09E4F] font-semibold">FAQ</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0D14] via-[#0E111A] to-[#131620] border-b border-white/10 py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#131620] border border-white/10 text-xs font-mono text-slate-300 mb-4 shadow-lg">
            <HelpCircle className="h-3.5 w-3.5 text-[#F09E4F]" />
            <span>KNOWLEDGE & SUPPORT CENTER</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F09E4F] to-[#FFA85C]">Questions</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about CyberShield's dual analysis engines, worst-case disaster risk formulations, and tenant data privacy.
          </p>

          {/* Search bar */}
          <form action="/faq" method="GET" className="mt-8 max-w-md mx-auto relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#F09E4F]" />
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Search questions (e.g. AST, sandbox, pricing)..."
              className="w-full pl-11 pr-4 py-3 text-xs bg-white/5 border border-white/10 rounded-full text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F09E4F] focus:ring-1 focus:ring-[#F09E4F] shadow-2xl font-mono"
            />
            {activeCategory !== "ALL" && (
              <input type="hidden" name="category" value={activeCategory} />
            )}
          </form>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex-1 flex flex-col gap-8">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {FAQ_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const href = cat === "ALL" ? "/faq" : `/faq?category=${encodeURIComponent(cat)}`;
            return (
              <Link
                key={cat}
                href={href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  isActive
                    ? "bg-[#F09E4F] text-slate-950 shadow-md shadow-[rgba(240,158,79,0.25)]"
                    : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* FAQs Accordion List */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16 vault-card p-8 border border-white/10">
            <HelpCircle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No matching questions</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              We couldn't find any questions matching your query. Ask our floating AI Support Assistant in the bottom-right corner or reset your filter.
            </p>
            <Link
              href="/faq"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F09E4F] text-slate-950 text-xs font-bold shadow-md shadow-[rgba(240,158,79,0.25)]"
            >
              View All Questions
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <details
                key={faq.id}
                className="group vault-card border border-white/10 hover:border-[#F09E4F]/40 p-5 rounded-2xl transition-all shadow-lg open:border-[#F09E4F]/50"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-xs sm:text-sm text-slate-200 group-open:text-[#F09E4F] transition">
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" />
                </summary>

                <div className="mt-3.5 pt-3 border-t border-white/5 text-xs text-slate-300 leading-relaxed space-y-2">
                  <p>{faq.answer}</p>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-[#F09E4F]">
                      Category: {faq.category}
                    </span>
                    <a
                      href="mailto:support@cybershield.dev"
                      className="text-[#F09E4F] hover:underline"
                    >
                      Need clarification? Contact support
                    </a>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}

        {/* Support Callout Banner */}
        <div className="vault-card border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white">Still have questions?</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Our engineering team is available to assist with custom CI/CD pipelines, novel vulnerability remediation, or private code auditing.
            </p>
          </div>

          <a
            href="mailto:support@cybershield.dev"
            className="px-5 py-2.5 rounded-full bg-[#F09E4F] hover:bg-[#E08E3F] font-bold text-xs text-slate-950 shadow-md shadow-[rgba(240,158,79,0.25)] transition flex items-center gap-1.5 shrink-0"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Contact Security Team</span>
          </a>
        </div>

        {/* Newsletter */}
        <NewsletterCard
          source="faq_page"
          title="Stay Updated on Platform & Vulnerability Disclosures"
          description="Subscribe to receive our monthly cybersecurity intelligence digests and scanner feature announcements."
        />
      </main>
    </div>
  );
}
