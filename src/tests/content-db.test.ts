import { describe, it, expect, beforeAll } from "vitest";
import { prisma, ensureContentSeeded } from "../lib/db";

describe("Content & Support Database Tables", () => {
  beforeAll(async () => {
    await ensureContentSeeded();
  });

  it("seeds and queries published cybersecurity articles", async () => {
    const articles = await prisma.article.findMany({ where: { status: "PUBLISHED" } });
    expect(articles.length).toBeGreaterThan(0);
    const first = articles[0];
    expect(first.slug).toBeDefined();
    expect(first.title).toBeDefined();
    expect(first.category).toBeDefined();
    expect(first.readingTimeMinutes).toBeGreaterThan(0);
  });

  it("seeds and queries categorized FAQs", async () => {
    const faqs = await prisma.faq.findMany({ where: { isPublished: 1 } });
    expect(faqs.length).toBeGreaterThan(0);
    const categories = new Set(faqs.map((f) => f.category));
    expect(categories.has("Repository Scanning")).toBe(true);
    expect(categories.has("Known Vulnerabilities")).toBe(true);
  });

  it("handles newsletter subscriber creation and deduplication", async () => {
    const testEmail = "subscriber_" + Math.random().toString(36).substring(2, 7) + "@example.com";
    const sub = await prisma.newsletterSubscriber.create({
      data: { email: testEmail, source: "test_suite", consentGiven: 1 },
    });
    expect(sub.id).toBeDefined();
    expect(sub.email).toBe(testEmail);
    expect(sub.status).toBe("ACTIVE");

    const found = await prisma.newsletterSubscriber.findUnique({
      where: { email: testEmail },
    });
    expect(found).not.toBeNull();
    expect(found?.email).toBe(testEmail);
  });
});
