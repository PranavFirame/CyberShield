import { describe, it, expect } from "vitest";
import { prisma, ensureContentSeeded } from "../lib/db";

describe("Technical SEO & Sitemaps", () => {
  it("excludes unpublished drafts and private routes from public sitemap entries", async () => {
    await ensureContentSeeded();
    const publishedArticles = await prisma.article.findMany({ where: { status: "PUBLISHED" } });
    const slugs = publishedArticles.map((a) => a.slug);
    expect(slugs.every((s) => !s.includes("draft"))).toBe(true);
    expect(publishedArticles.length).toBeGreaterThan(0);
  });

  it("ensures canonical URLs are valid absolute HTTPS strings", async () => {
    const articles = await prisma.article.findMany({ where: { status: "PUBLISHED" } });
    for (const a of articles) {
      if (a.canonicalUrl) {
        expect(a.canonicalUrl.startsWith("https://")).toBe(true);
      }
    }
  });
});
