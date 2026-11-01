import { describe, it, expect, beforeAll } from "vitest";
import { prisma, ensureContentSeeded } from "../lib/db";

describe("FAQ Knowledge Center", () => {
  beforeAll(async () => {
    await ensureContentSeeded();
  });

  it("retrieves published FAQs sorted by orderIndex", async () => {
    const faqs = await prisma.faq.findMany({ where: { isPublished: 1 } });
    expect(faqs.length).toBeGreaterThan(0);
    for (let i = 1; i < faqs.length; i++) {
      expect(faqs[i].orderIndex).toBeGreaterThanOrEqual(faqs[i - 1].orderIndex);
    }
  });

  it("filters FAQs by category accurately", async () => {
    const scanFaqs = await prisma.faq.findMany({
      where: { category: "Repository Scanning", isPublished: 1 },
    });
    expect(scanFaqs.length).toBeGreaterThan(0);
    expect(scanFaqs.every((f) => f.category === "Repository Scanning")).toBe(true);
  });

  it("allows creating and updating an FAQ", async () => {
    const testFaq = await prisma.faq.create({
      data: {
        question: "Can I run audits on private repos?",
        answer: "Private repository support is in private preview with Enterprise RBAC.",
        category: "Repository Scanning",
        orderIndex: 99,
        isPublished: 1,
      },
    });

    expect(testFaq.id).toBeDefined();

    const updated = await prisma.faq.update({
      where: { id: testFaq.id },
      data: { isFeatured: 1 },
    });
    expect(updated.isFeatured).toBe(1);

    // Cleanup
    await prisma.faq.delete({ where: { id: testFaq.id } });
  });
});
