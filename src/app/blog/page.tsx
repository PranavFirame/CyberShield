import Link from "next/link";
import { prisma, ensureContentSeeded } from "@/lib/db";
import { Shield, Clock, Calendar, ArrowRight, Tag, BookOpen, Search } from "lucide-react";
import NewsletterCard from "@/components/NewsletterCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CyberShield Security Blog & Research Center",
  description: "In-depth cybersecurity research, AST taint tracking methodologies, zero-day disclosures, and secure coding tutorials for engineering teams.",
};

const CATEGORIES = [
  "ALL",
  "Application Security",
  "API Security",
  "Vulnerability Research",
  "DevSecOps",
  "Dependency Security",
];

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  await ensureContentSeeded();
  const params = await searchParams;
  const activeCategory = params.category || "ALL";
  const searchQuery = params.search || "";

  const articles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      category: activeCategory !== "ALL" ? activeCategory : undefined,
      search: searchQuery || undefined,
    },
  });

  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const regularArticles = articles.length > 0 ? articles.slice(1) : [];

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col">
      {/* Top Header / Breadcrumbs */}
      <div className="border-b border-white/10 px-6 py-4 bg-[#0E1017]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
            <span className="text-[#F09E4F] font-semibold">Security Blog & Research</span>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0D14] via-[#0E111A] to-[#131620] border-b border-white/10 py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#131620] border border-white/10 text-xs font-mono text-slate-300 mb-4 shadow-lg">
            <Shield className="h-3.5 w-3.5 text-[#F09E4F]" />
            <span>CYBERSHIELD DEFENSIVE RESEARCH & KNOWLEDGE HUB</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Security Intelligence & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F09E4F] to-[#FFA85C]">Engineering Guides</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
            Peer-reviewed security research, AST call-graph analyses, and actionable remediation diffs authored by defensive security engineers.
          </p>

          {/* Search & Category Filter */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                const href = cat === "ALL" ? "/blog" : `/blog?category=${encodeURIComponent(cat)}`;
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

            {/* Search Input */}
            <form action="/blog" method="GET" className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#F09E4F]" />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search articles & CVEs..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/5 border border-white/10 rounded-full text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F09E4F] shadow-2xl font-mono"
              />
              {activeCategory !== "ALL" && (
                <input type="hidden" name="category" value={activeCategory} />
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 flex-1 flex flex-col gap-10">
        {articles.length === 0 ? (
          <div className="text-center py-16 vault-card p-8 border border-white/10">
            <BookOpen className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No articles found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No published articles matched your filter criteria. Try clearing your search query or selecting another category.
            </p>
            <Link
              href="/blog"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F09E4F] text-slate-950 text-xs font-bold shadow-md shadow-[rgba(240,158,79,0.25)]"
            >
              Reset Filters
            </Link>
          </div>
        ) : (
          <>
            {/* Featured Hero Article */}
            {featuredArticle && (
              <div className="vault-card p-6 sm:p-8 border border-white/10 shadow-2xl hover:border-[#F09E4F]/50 transition group bg-[#0E111A]/90">
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F09E4F]/10 border border-[#F09E4F]/30 text-[#F09E4F] text-[10px] font-bold uppercase font-mono tracking-wider">
                        Featured Research
                      </span>
                      <span className="text-xs text-slate-400 font-medium font-mono">{featuredArticle.category}</span>
                    </div>

                    <Link href={`/blog/${featuredArticle.slug}`}>
                      <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#F09E4F] transition tracking-tight">
                        {featuredArticle.title}
                      </h2>
                    </Link>

                    <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl line-clamp-3">
                      {featuredArticle.summary}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-4 border-t border-white/5 font-mono">
                      <span className="font-semibold text-slate-200">{featuredArticle.authorName}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[#F09E4F]" />
                        {featuredArticle.readingTimeMinutes} min read
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {featuredArticle.publishedAt ? new Date(featuredArticle.publishedAt).toLocaleDateString() : "Recent"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/blog/${featuredArticle.slug}`}
                    className="self-start sm:self-center shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#F09E4F] hover:bg-[#E08E3F] text-slate-950 text-xs font-bold shadow-md shadow-[rgba(240,158,79,0.25)] transition"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            {regularArticles.length > 0 && (
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F09E4F] mb-4">
                  Latest Security Articles
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularArticles.map((article) => (
                    <article
                      key={article.id}
                      className="vault-card p-5 border border-white/10 hover:border-[#F09E4F]/50 transition flex flex-col justify-between group bg-[#0E111A]/80"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 font-mono">
                          <span className="text-[11px] font-bold text-[#F09E4F] bg-[#F09E4F]/10 px-2 py-0.5 rounded-full border border-[#F09E4F]/20">
                            {article.category}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#F09E4F]" />
                            {article.readingTimeMinutes} min
                          </span>
                        </div>

                        <Link href={`/blog/${article.slug}`}>
                          <h4 className="text-sm font-bold text-white group-hover:text-[#F09E4F] transition leading-snug line-clamp-2">
                            {article.title}
                          </h4>
                        </Link>

                        <p className="mt-2 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="font-medium text-slate-300 truncate max-w-[150px]">{article.authorName}</span>
                        <Link
                          href={`/blog/${article.slug}`}
                          className="font-semibold text-[#F09E4F] hover:underline flex items-center gap-1"
                        >
                          Read <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter Subscription Bar */}
            <div className="mt-4">
              <NewsletterCard
                source="blog_index"
                title="Get Zero-Day & AST Research In Your Inbox"
                description="Subscribe to receive CyberShield's monthly vulnerability research digests and developer security tutorials."
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
