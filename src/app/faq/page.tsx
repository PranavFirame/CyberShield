import Link from "next/link";
import { prisma, ensureContentSeeded } from "@/lib/db";
import { Shield, ChevronDown, Search, HelpCircle, ArrowRight, MessageSquare } from "lucide-react";
import NewsletterCard from "@/components/NewsletterCard";
import PublicNavbar from "@/components/PublicNavbar";

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      <PublicNavbar />
      {/* Hero */}
      <div className="bg-gradient-to-b from-white via-sky-50/20 to-slate-50 border-b border-slate-200 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold mb-3">
            <HelpCircle className="h-3.5 w-3.5 text-sky-600" />
            <span>KNOWLEDGE & SUPPORT CENTER</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about CyberShield's dual analysis engines, worst-case disaster risk formulations, and tenant data privacy.
          </p>

          {/* Search bar */}
          <form action="/faq" method="GET" className="mt-6 max-w-md mx-auto relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Search questions (e.g. AST, sandbox, pricing)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
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
        <div className="flex flex-wrap gap-1.5 justify-center">
          {FAQ_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const href = cat === "ALL" ? "/faq" : `/faq?category=${encodeURIComponent(cat)}`;
            return (
              <Link
                key={cat}
                href={href}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* FAQs Accordion List */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
            <HelpCircle className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No matching questions</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't find any questions matching your query. Ask our floating AI Support Assistant in the bottom-right corner or reset your filter.
            </p>
            <Link
              href="/faq"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              View All Questions
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <details
                key={faq.id}
                className="group bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-4 sm:p-5 transition shadow-2xs open:shadow-xs open:border-sky-300"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-xs sm:text-sm text-slate-900 group-open:text-sky-600 transition">
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" />
                </summary>

                <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed space-y-2">
                  <p>{faq.answer}</p>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      Category: {faq.category}
                    </span>
                    <a
                      href="mailto:support@cybershield.dev"
                      className="text-sky-600 hover:underline"
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
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div>
            <h3 className="text-base font-bold">Still have questions?</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Our engineering team is available to assist with custom CI/CD pipelines, novel vulnerability remediation, or private code auditing.
            </p>
          </div>

          <a
            href="mailto:support@cybershield.dev"
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold text-xs text-white shadow-xs transition flex items-center gap-1.5 shrink-0"
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
