import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, ensureContentSeeded } from "@/lib/db";
import { Clock, Calendar, ArrowLeft, ArrowRight, Share2, Shield, User, Bookmark } from "lucide-react";
import NewsletterCard from "@/components/NewsletterCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article || article.status !== "PUBLISHED") {
    return { title: "Article Not Found - CyberShield" };
  }
  return {
    title: `${article.title} | CyberShield Security Research`,
    description: article.summary,
    alternates: {
      canonical: article.canonicalUrl || `https://cybershield.dev/blog/${article.slug}`,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await ensureContentSeeded();
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });

  if (!article || article.status !== "PUBLISHED") {
    notFound();
  }

  // Related articles in same category
  const relatedArticles = (
    await prisma.article.findMany({
      where: { category: article.category, status: "PUBLISHED" },
      take: 4,
    })
  ).filter((a) => a.slug !== article.slug).slice(0, 3);

  // Extract simple table of contents from markdown headings (### )
  const headings = article.content
    .split("\n")
    .filter((line) => line.startsWith("### "))
    .map((line) => line.replace("### ", "").trim());

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col">
      {/* Top Header / Breadcrumbs */}
      <div className="border-b border-white/10 px-6 py-4 bg-[#0E1017]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-full bg-[#F09E4F]/20 border border-[#F09E4F]/30 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-[#F09E4F]" />
            </div>
            <span className="font-extrabold text-sm text-white">
              CYBER<span className="text-[#F09E4F]">SHIELD</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 text-xs font-mono">
            <Link href="/" className="text-slate-400 hover:text-white transition">
              Home
            </Link>
            <span className="text-slate-600">/</span>
            <Link href="/blog" className="text-slate-400 hover:text-white transition">
              Blog
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-[#F09E4F] truncate max-w-[150px]">{article.title}</span>
          </div>
        </div>
      </div>

      {/* Article Header Bar */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0A0D14] via-[#0E111A] to-[#131620] border-b border-white/10 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4 font-mono text-xs">
            <span className="px-3 py-1 rounded-full bg-[#F09E4F]/10 border border-[#F09E4F]/30 text-[#F09E4F] text-[11px] font-bold uppercase tracking-wider">
              {article.category}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#F09E4F]" />
              {article.readingTimeMinutes} min read
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Recently Published"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            {article.summary}
          </p>

          <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#F09E4F]/20 text-[#F09E4F] border border-[#F09E4F]/30 flex items-center justify-center font-bold text-xs shadow-xs font-mono">
                {article.authorName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{article.authorName}</div>
                <div className="text-[11px] text-slate-400 font-mono">{article.authorRole}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All Articles</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Reading Container */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex-1">
        {/* Table of Contents */}
        {headings.length > 0 && (
          <div className="mb-8 p-5 vault-card border border-white/10 rounded-2xl bg-[#0E111A]/80">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F09E4F] mb-3 flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5 text-[#F09E4F]" /> Table of Contents
            </h4>
            <ul className="space-y-2">
              {headings.map((heading, i) => (
                <li key={i} className="text-xs text-slate-300 font-medium hover:text-[#F09E4F] transition">
                  {i + 1}. {heading}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Body */}
        <div className="vault-card border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl bg-[#0E111A]/90">
          <div className="whitespace-pre-wrap font-sans text-sm sm:text-base text-slate-200 leading-relaxed space-y-4">
            {article.content.split("\n\n").map((block, idx) => {
              if (block.startsWith("### ")) {
                return (
                  <h3 key={idx} className="text-lg sm:text-xl font-bold text-white mt-8 pt-6 border-t border-white/10">
                    {block.replace("### ", "")}
                  </h3>
                );
              }
              if (block.startsWith("```")) {
                const codeLines = block.split("\n");
                const code = codeLines.slice(1, -1).join("\n");
                return (
                  <div key={idx} className="my-5 rounded-2xl bg-[#080A0F] p-4 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner border border-white/10">
                    <pre>{code}</pre>
                  </div>
                );
              }
              return (
                <p key={idx} className="text-slate-300 leading-relaxed">
                  {block}
                </p>
              );
            })}
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-semibold text-slate-500 mr-1">Topics:</span>
              {article.tags.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#F09E4F] text-[11px] font-mono"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F09E4F] mb-4">
              Related Research in {article.category}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="vault-card border border-white/10 hover:border-[#F09E4F]/50 rounded-2xl p-4 shadow-lg transition flex flex-col justify-between group bg-[#0E111A]/80"
                >
                  <h4 className="text-xs font-bold text-white group-hover:text-[#F09E4F] transition line-clamp-2">
                    {rel.title}
                  </h4>
                  <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{rel.readingTimeMinutes} min read</span>
                    <span className="text-[#F09E4F] font-semibold flex items-center gap-0.5">
                      Read <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Article Page Newsletter */}
        <div className="mt-12">
          <NewsletterCard
            source={`article_${article.slug}`}
            title="Enjoyed this research breakdown?"
            description="Subscribe to receive our monthly defensive security tutorials, AST logic flaw investigations, and platform feature releases."
          />
        </div>
      </main>
    </div>
  );
}
