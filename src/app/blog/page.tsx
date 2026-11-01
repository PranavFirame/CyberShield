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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-white via-sky-50/20 to-slate-50 border-b border-slate-200/80 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Link href="/" className="hover:text-slate-900 transition">Home</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Security Blog & Research</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold mb-3">
            <Shield className="h-3.5 w-3.5 text-sky-600" />
            <span>CYBERSHIELD DEFENSIVE RESEARCH & KNOWLEDGE HUB</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Security Intelligence & Engineering Guides
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Peer-reviewed security research, AST call-graph analyses, and actionable remediation diffs authored by defensive security engineers.
          </p>

          {/* Search & Category Filter */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                const href = cat === "ALL" ? "/blog" : `/blog?category=${encodeURIComponent(cat)}`;
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

            {/* Search Input */}
            <form action="/blog" method="GET" className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search articles & CVEs..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
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
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
            <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No articles found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No published articles matched your filter criteria. Try clearing your search query or selecting another category.
            </p>
            <Link
              href="/blog"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              Reset Filters
            </Link>
          </div>
        ) : (
          <>
            {/* Featured Hero Article */}
            {featuredArticle && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs hover:border-sky-300 transition group">
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold uppercase font-mono tracking-wider">
                        Featured Research
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{featuredArticle.category}</span>
                    </div>

                    <Link href={`/blog/${featuredArticle.slug}`}>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-sky-600 transition tracking-tight">
                        {featuredArticle.title}
                      </h2>
                    </Link>

                    <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl line-clamp-3">
                      {featuredArticle.summary}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-4 border-t border-slate-100">
                      <span className="font-semibold text-slate-800">{featuredArticle.authorName}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {featuredArticle.readingTimeMinutes} min read
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {featuredArticle.publishedAt ? new Date(featuredArticle.publishedAt).toLocaleDateString() : "Recent"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/blog/${featuredArticle.slug}`}
                    className="self-start sm:self-center shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
                  Latest Security Articles
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularArticles.map((article) => (
                    <article
                      key={article.id}
                      className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                            {article.category}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {article.readingTimeMinutes} min
                          </span>
                        </div>

                        <Link href={`/blog/${article.slug}`}>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition leading-snug line-clamp-2">
                            {article.title}
                          </h4>
                        </Link>

                        <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700 truncate max-w-[150px]">{article.authorName}</span>
                        <Link
                          href={`/blog/${article.slug}`}
                          className="font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
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
