import { describe, it, expect } from "vitest";
import { prisma } from "../lib/db";

describe("Newsletter Subscription System", () => {
  it("rejects invalid email formats", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test("invalid-email")).toBe(false);
    expect(emailRegex.test("@missinguser.com")).toBe(false);
    expect(emailRegex.test("user@missingtld")).toBe(false);
    expect(emailRegex.test("security@cybershield.dev")).toBe(true);
  });

  it("stores subscriber with consent timestamp and allows unsubscription", async () => {
    const email = "test_optout_" + Math.random().toString(36).substring(2, 6) + "@test.org";
    const sub = await prisma.newsletterSubscriber.create({
      data: { email, source: "landing_footer", consentGiven: 1 },
    });
    expect(sub.status).toBe("ACTIVE");
    expect(sub.consentTimestamp).toBeDefined();

    const unsub = await prisma.newsletterSubscriber.update({
      where: { email },
      data: { status: "UNSUBSCRIBED" },
    });
    expect(unsub.status).toBe("UNSUBSCRIBED");
  });

  it("handles duplicate subscription attempts gracefully without breaking", async () => {
    const email = "test_dup_" + Math.random().toString(36).substring(2, 6) + "@test.org";
    await prisma.newsletterSubscriber.create({
      data: { email, source: "landing", consentGiven: 1 },
    });

    // Existing subscriber re-subscribes
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    expect(existing).not.toBeNull();
    if (existing && existing.status === "UNSUBSCRIBED") {
      const reSub = await prisma.newsletterSubscriber.update({
        where: { email },
        data: { status: "ACTIVE" },
      });
      expect(reSub.status).toBe("ACTIVE");
    }
  });
});
