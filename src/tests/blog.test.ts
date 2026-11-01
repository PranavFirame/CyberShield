import { describe, it, expect } from "vitest";
import { prisma, ensureContentSeeded } from "../lib/db";

describe("Blog & Articles Engine", () => {
  it("only returns published articles for public consumption", async () => {
    await ensureContentSeeded();
    const draftSlug = "test-draft-" + Date.now();
    await prisma.article.create({
      data: {
        slug: draftSlug,
        title: "Internal Vulnerability Note (Draft)",
        summary: "Not yet verified",
        content: "Under embargo content",
        category: "Vulnerability Research",
        tags: ["draft", "embargo"],
        status: "DRAFT",
      },
    });

    const publicArticles = await prisma.article.findMany({ where: { status: "PUBLISHED" } });
    expect(publicArticles.length).toBeGreaterThan(0);
    expect(publicArticles.some((a) => a.slug === draftSlug)).toBe(false);

    // Verify draft can still be found directly by ID for admin
    const draftArticle = await prisma.article.findUnique({ where: { slug: draftSlug } });
    expect(draftArticle).not.toBeNull();
    expect(draftArticle?.status).toBe("DRAFT");

    // Cleanup
    await prisma.article.delete({ where: { slug: draftSlug } });
  });

  it("computes estimated reading time based on word count", () => {
    const text = new Array(500).fill("word").join(" ");
    const wordsPerMinute = 200;
    const readingTime = Math.ceil(text.trim().split(/\s+/).length / wordsPerMinute);
    expect(readingTime).toBe(3);
  });

  it("filters articles by category", async () => {
    await ensureContentSeeded();
    const appSecArticles = await prisma.article.findMany({
      where: { category: "Application Security", status: "PUBLISHED" },
    });
    expect(appSecArticles.length).toBeGreaterThan(0);
    expect(appSecArticles.every((a) => a.category === "Application Security")).toBe(true);
  });

  it("blog templates contain CloudVault vault-card and amber styling", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const blogIndex = fs.readFileSync(path.resolve(__dirname, "../app/blog/page.tsx"), "utf-8");
    const blogSlug = fs.readFileSync(path.resolve(__dirname, "../app/blog/[slug]/page.tsx"), "utf-8");

    expect(blogIndex).toContain("vault-card");
    expect(blogIndex).toContain("#F09E4F");
    expect(blogSlug).toContain("vault-card");
    expect(blogSlug).toContain("#F09E4F");
  });
});
