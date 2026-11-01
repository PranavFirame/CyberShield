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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Link href="/" className="hover:text-slate-900 transition">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-slate-900 transition">Blog</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium truncate max-w-xs">{article.title}</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold uppercase font-mono tracking-wider">
              {article.category}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {article.readingTimeMinutes} min read
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Recently Published"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {article.summary}
          </p>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {article.authorName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{article.authorName}</div>
                <div className="text-[11px] text-slate-500">{article.authorRole}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
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
          <div className="mb-8 p-5 bg-sky-50/40 border border-sky-100 rounded-2xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5 text-sky-600" /> Table of Contents
            </h4>
            <ul className="space-y-1.5">
              {headings.map((heading, i) => (
                <li key={i} className="text-xs text-sky-800 font-medium">
                  {i + 1}. {heading}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Body */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs prose prose-slate max-w-none">
          <div className="whitespace-pre-wrap font-sans text-sm sm:text-base text-slate-800 leading-relaxed space-y-4">
            {article.content.split("\n\n").map((block, idx) => {
              if (block.startsWith("### ")) {
                return (
                  <h3 key={idx} className="text-lg sm:text-xl font-bold text-slate-900 mt-6 pt-4 border-t border-slate-100">
                    {block.replace("### ", "")}
                  </h3>
                );
              }
              if (block.startsWith("```")) {
                const codeLines = block.split("\n");
                const code = codeLines.slice(1, -1).join("\n");
                return (
                  <div key={idx} className="my-4 rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner border border-slate-800">
                    <pre>{code}</pre>
                  </div>
                );
              }
              return (
                <p key={idx} className="text-slate-700 leading-relaxed">
                  {block}
                </p>
              );
            })}
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 mr-1">Topics:</span>
              {article.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium"
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
              Related Research in {article.category}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-4 shadow-2xs transition flex flex-col justify-between group"
                >
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition line-clamp-2">
                    {rel.title}
                  </h4>
                  <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{rel.readingTimeMinutes} min read</span>
                    <span className="text-sky-600 font-semibold flex items-center gap-0.5">
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
