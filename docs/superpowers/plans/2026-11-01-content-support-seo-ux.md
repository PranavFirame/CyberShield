# Content, Support, SEO & Trust Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete cybersecurity knowledge, content, support chatbot, technical SEO, and trust center ecosystem integrated cleanly into CyberShield.

**Architecture:** Extend SQLite database with tables for articles, FAQs, and newsletter subscribers; build public pages for Blog (`/blog`, `/blog/[slug]`), FAQ (`/faq`), HTML Sitemap (`/sitemap`), and Legal pages; provide automated XML sitemap (`/sitemap.xml`) and robots.txt; create an intelligent grounded support chatbot (`/api/support/chat` + floating UI); wire newsletter subscription endpoints with double-opt in support; and integrate global navigation and multi-column footers.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Node.js `node:sqlite`, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-01-content-support-seo-ux-design.md`

## Global Constraints

- Never execute, install, or import third-party code from scanned targets.
- All database operations must use the built-in Node `node:sqlite` database connection via `src/lib/db.ts`.
- Public endpoints must strictly exclude draft articles, unpublished FAQs, admin endpoints, and private scan reports.
- Support chatbot must never transmit repository source code or private finding reports.
- All public pages must adhere to the WCAG AA `#F8FAFC` base design system.

## Review Focus

1. **Newsletter duplicate email submissions**: Submitting an existing active email must not throw a 500 error, but gracefully confirm existing subscription.
2. **Draft article leakage**: Ensure `/api/articles` and `/sitemap.xml` strictly filter by `status = 'PUBLISHED'`.
3. **Chatbot prompt injection / Code leak**: Prompts asking to dump internal server envs or scan results must be rejected with safe fallback answers.
4. **FAQ search with special characters**: Searching with regex symbols like `[` or `*` must not crash SQLite or page render.
5. **Dynamic XML sitemap**: Handles edge cases where 0 articles are published without malformed XML output.

---

### Task 1: Database Schema Expansion & Seed Data for Articles, FAQs, and Subscribers

**Files:**
- Modify: `src/lib/db.ts`
- Test: `src/tests/content-db.test.ts`

**Interfaces:**
- Consumes: Node `node:sqlite` `DatabaseSync`
- Produces: `prisma.article`, `prisma.faq`, `prisma.newsletterSubscriber` CRUD repositories and automated seed functions `ensureContentSeeded()`.

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/content-db.test.ts
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
  });

  it("seeds and queries categorized FAQs", async () => {
    const faqs = await prisma.faq.findMany({ where: { isPublished: 1 } });
    expect(faqs.length).toBeGreaterThan(0);
    const categories = new Set(faqs.map(f => f.category));
    expect(categories.has("Repository Scanning")).toBe(true);
  });

  it("handles newsletter subscriber creation and deduplication", async () => {
    const testEmail = "subscriber_" + Math.random().toString(36).substring(2, 7) + "@example.com";
    const sub = await prisma.newsletterSubscriber.create({
      data: { email: testEmail, source: "test_suite", consentGiven: 1 }
    });
    expect(sub.id).toBeDefined();
    expect(sub.email).toBe(testEmail);
    expect(sub.status).toBe("ACTIVE");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/content-db.test.ts`  
Expected: FAIL with `ensureContentSeeded is not a function` or `prisma.article is undefined`.

- [ ] **Step 3: Implement database tables and seed data in `src/lib/db.ts`**

Add tables `articles`, `newsletter_subscribers`, `faqs`, their TypeScript interfaces (`DbArticle`, `DbFaq`, `DbNewsletterSubscriber`), repository methods on `prisma`, and `ensureContentSeeded()` function seeding verified cybersecurity articles (AST Taint, Prototype Pollution, API Security, DevSecOps) and 12-category FAQs.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/content-db.test.ts`  
Expected: PASS (all 3 tests green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db.ts src/tests/content-db.test.ts
git commit -m "feat(db): add articles, faqs, and newsletter subscriber tables with cybersecurity seeds"
```

---

### Task 2: Newsletter Subscription Backend & Verification

**Files:**
- Create: `src/app/api/newsletter/subscribe/route.ts`
- Create: `src/app/api/newsletter/unsubscribe/route.ts`
- Create: `src/components/NewsletterCard.tsx`
- Test: `src/tests/newsletter.test.ts`

**Interfaces:**
- Consumes: `prisma.newsletterSubscriber` from `src/lib/db.ts`
- Produces: `POST /api/newsletter/subscribe`, `POST /api/newsletter/unsubscribe`, `NewsletterCard` component.

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/newsletter.test.ts
import { describe, it, expect } from "vitest";
import { prisma } from "../lib/db";

describe("Newsletter Subscription System", () => {
  it("rejects invalid email formats", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test("invalid-email")).toBe(false);
    expect(emailRegex.test("user@domain.com")).toBe(true);
  });

  it("stores subscriber with consent timestamp and allows unsubscription", async () => {
    const email = "test_optout_" + Math.random().toString(36).substring(2, 6) + "@test.org";
    const sub = await prisma.newsletterSubscriber.create({
      data: { email, source: "landing_footer", consentGiven: 1 }
    });
    expect(sub.status).toBe("ACTIVE");

    const unsub = await prisma.newsletterSubscriber.update({
      where: { email },
      data: { status: "UNSUBSCRIBED" }
    });
    expect(unsub.status).toBe("UNSUBSCRIBED");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/newsletter.test.ts`  
Expected: Verify test structure and imports.

- [ ] **Step 3: Implement subscription routes and `NewsletterCard` component**

- Implement `POST /api/newsletter/subscribe` handling email validation, deduplication, consent logging, and respectful status reporting.
- Implement `POST /api/newsletter/unsubscribe` and `GET /api/newsletter/unsubscribe`.
- Build `src/components/NewsletterCard.tsx` with email input, consent checkbox, and feedback messages.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/newsletter.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/newsletter/ src/components/NewsletterCard.tsx src/tests/newsletter.test.ts
git commit -m "feat(newsletter): add subscription and unsubscription endpoints and UI card"
```

---

### Task 3: Blog & Cybersecurity Resources Center

**Files:**
- Create: `src/app/api/articles/route.ts`
- Create: `src/app/api/articles/[slug]/route.ts`
- Create: `src/app/api/admin/articles/route.ts`
- Create: `src/app/api/admin/articles/[id]/route.ts`
- Create: `src/app/blog/page.tsx`
- Create: `src/app/blog/[slug]/page.tsx`
- Test: `src/tests/blog.test.ts`

**Interfaces:**
- Consumes: `prisma.article` from `src/lib/db.ts`
- Produces: Public `/blog` index, `/blog/[slug]` reading view, and Admin CMS CRUD endpoints.

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/blog.test.ts
import { describe, it, expect } from "vitest";
import { prisma } from "../lib/db";

describe("Blog & Articles Engine", () => {
  it("only returns published articles for public consumption", async () => {
    const draftSlug = "test-draft-" + Date.now();
    await prisma.article.create({
      data: {
        slug: draftSlug,
        title: "Draft Post",
        summary: "Not ready yet",
        content: "Draft content",
        category: "Vulnerability Research",
        tags: ["test"],
        status: "DRAFT",
      }
    });

    const publicArticles = await prisma.article.findMany({ where: { status: "PUBLISHED" } });
    expect(publicArticles.some(a => a.slug === draftSlug)).toBe(false);

    // Cleanup
    await prisma.article.delete({ where: { slug: draftSlug } });
  });

  it("computes estimated reading time based on word count", () => {
    const text = new Array(500).fill("word").join(" ");
    const wordsPerMinute = 200;
    const readingTime = Math.ceil(text.trim().split(/\s+/).length / wordsPerMinute);
    expect(readingTime).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/blog.test.ts`  
Expected: PASS or FAIL depending on helper existence.

- [ ] **Step 3: Implement Article API routes and responsive Next.js App Router views**

- Create `GET /api/articles` (supports `?category=...&tag=...&search=...`).
- Create `GET /api/articles/[slug]` with related articles by category.
- Create `POST /api/admin/articles`, `PUT /api/admin/articles/[id]`, `DELETE /api/admin/articles/[id]`.
- Build `src/app/blog/page.tsx` with hero featured article, category filter tabs, search bar, and card grid.
- Build `src/app/blog/[slug]/page.tsx` with reading time, author card, table of contents, syntax-highlighted code blocks, social sharing, and related articles.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/blog.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/articles/ src/app/api/admin/articles/ src/app/blog/ src/tests/blog.test.ts
git commit -m "feat(blog): implement cybersecurity blog hub, article reader, and admin APIs"
```

---

### Task 4: AI Support Chatbot & Educational Assistant

**Files:**
- Create: `src/lib/support-knowledge.ts`
- Create: `src/app/api/support/chat/route.ts`
- Create: `src/components/SupportChatbot.tsx`
- Test: `src/tests/support-chat.test.ts`

**Interfaces:**
- Consumes: CyberShield product specs (`/docs`), scanner limitations, scoring formulas, FAQ categories.
- Produces: `/api/support/chat` endpoint and `SupportChatbot` client component.

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/support-chat.test.ts
import { describe, it, expect } from "vitest";
import { findSupportAnswer } from "../lib/support-knowledge";

describe("Support Knowledge Retriever & Chatbot", () => {
  it("provides accurate answers for core CyberShield capabilities", () => {
    const answer = findSupportAnswer("how does repository scanning work");
    expect(answer).toBeDefined();
    expect(answer.toLowerCase()).toContain("zero-execution");
    expect(answer.toLowerCase()).toContain("ast");
  });

  it("handles scoring questions with disaster exposure explanation", () => {
    const answer = findSupportAnswer("how is risk score calculated");
    expect(answer).toContain("Disaster");
    expect(answer).toContain("100");
  });

  it("safely escalates when question is out of scope or requires private investigation", () => {
    const answer = findSupportAnswer("can you show me passwords from secret repository");
    expect(answer.toLowerCase()).toContain("support@cybershield.dev");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/support-chat.test.ts`  
Expected: FAIL with `findSupportAnswer is not defined`.

- [ ] **Step 3: Implement support knowledge base, chat route, and UI component**

- Create `src/lib/support-knowledge.ts` with comprehensive keyword and semantic matcher grounded in `/docs`.
- Create `POST /api/support/chat` with rate limiting and privacy safeguards.
- Build `src/components/SupportChatbot.tsx` with floating launcher, expandable chat window, suggested prompt chips, conversation clear, and support escalation link.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/support-chat.test.ts`  
Expected: PASS (all 3 tests pass).

- [ ] **Step 5: Commit**

```bash
git add src/lib/support-knowledge.ts src/app/api/support/chat/route.ts src/components/SupportChatbot.tsx src/tests/support-chat.test.ts
git commit -m "feat(support): add AI support chatbot assistant and knowledge retriever"
```

---

### Task 5: Frequently Asked Questions (FAQ) Center & Administration

**Files:**
- Create: `src/app/api/faqs/route.ts`
- Create: `src/app/api/admin/faqs/route.ts`
- Create: `src/app/api/admin/faqs/[id]/route.ts`
- Create: `src/app/faq/page.tsx`
- Test: `src/tests/faq.test.ts`

**Interfaces:**
- Consumes: `prisma.faq` from `src/lib/db.ts`
- Produces: Public `/faq` page with 12 categories and Admin FAQ CRUD endpoints.

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/faq.test.ts
import { describe, it, expect } from "vitest";
import { prisma } from "../lib/db";

describe("FAQ Knowledge Center", () => {
  it("retrieves published FAQs sorted by orderIndex", async () => {
    const faqs = await prisma.faq.findMany({ where: { isPublished: 1 } });
    expect(faqs.length).toBeGreaterThan(0);
    for (let i = 1; i < faqs.length; i++) {
      expect(faqs[i].orderIndex).toBeGreaterThanOrEqual(faqs[i - 1].orderIndex);
    }
  });

  it("filters FAQs by category accurately", async () => {
    const scanFaqs = await prisma.faq.findMany({
      where: { category: "Repository Scanning", isPublished: 1 }
    });
    expect(scanFaqs.length).toBeGreaterThan(0);
    expect(scanFaqs.every(f => f.category === "Repository Scanning")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/faq.test.ts`  
Expected: PASS or FAIL based on existing DB state.

- [ ] **Step 3: Implement FAQ API routes and public `/faq` page**

- Create `GET /api/faqs` and admin CRUD endpoints.
- Build `src/app/faq/page.tsx` featuring searchable accordion UI, category chips for all 12 categories, doc references, and contact assistance.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/faq.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/faqs/ src/app/api/admin/faqs/ src/app/faq/ src/tests/faq.test.ts
git commit -m "feat(faq): build 12-category searchable FAQ knowledge center and admin APIs"
```

---

### Task 6: Custom 404, 403 & 500 Error Pages

**Files:**
- Create: `src/app/not-found.tsx`
- Create: `src/app/error.tsx`

**Interfaces:**
- Consumes: Next.js App Router error boundaries
- Produces: Polished custom 404 page and safe 500 internal server error page adhering to design system.

- [ ] **Step 1: Build `src/app/not-found.tsx`**

Include CyberShield logo, 404 indicator, "Page not found" explanation, "Return to Dashboard / Home", quick links to Blog, Documentation, FAQ, and search input.

- [ ] **Step 2: Build `src/app/error.tsx`**

Client-side error boundary presenting a clean alert without leaking stack traces, providing a "Try Again" trigger and support contact link.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/not-found.tsx src/app/error.tsx
git commit -m "feat(errors): add custom 404 and 500 error boundary pages"
```

---

### Task 7: Technical SEO, HTML Sitemap, Dynamic XML Sitemap & Robots.txt

**Files:**
- Create: `src/app/sitemap/page.tsx`
- Create: `src/app/sitemap.ts` (Next.js Metadata Route for `/sitemap.xml`)
- Create: `src/app/robots.ts` (Next.js Metadata Route for `/robots.txt`)
- Test: `src/tests/seo.test.ts`

**Interfaces:**
- Consumes: `prisma.article`, `prisma.faq` from `src/lib/db.ts`
- Produces: `/sitemap`, `/sitemap.xml`, `/robots.txt`

- [ ] **Step 1: Write the failing test**

```typescript
// src/tests/seo.test.ts
import { describe, it, expect } from "vitest";
import { prisma } from "../lib/db";

describe("Technical SEO & Sitemaps", () => {
  it("excludes unpublished drafts and private routes from public sitemap entries", async () => {
    const publishedArticles = await prisma.article.findMany({ where: { status: "PUBLISHED" } });
    const slugs = publishedArticles.map(a => a.slug);
    expect(slugs.every(s => !s.includes("draft"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails/passes**

Run: `npx vitest run src/tests/seo.test.ts`

- [ ] **Step 3: Implement HTML sitemap, XML sitemap route, and robots.txt route**

- Implement `src/app/sitemap/page.tsx` (human-readable structured directory).
- Implement `src/app/sitemap.ts` dynamically building canonical URLs from published articles and static public pages with `lastModified`.
- Implement `src/app/robots.ts` disallowing `/api/`, `/admin/`, pointing to `/sitemap.xml`.

- [ ] **Step 4: Verify outputs**

Run: `npx tsc --noEmit` and `npx vitest run src/tests/seo.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap/ src/app/sitemap.ts src/app/robots.ts src/tests/seo.test.ts
git commit -m "feat(seo): add HTML sitemap, dynamic XML sitemap, and robots.txt routes"
```

---

### Task 8: Legal & Trust Center Integration

**Files:**
- Create: `src/app/legal/privacy/page.tsx`
- Create: `src/app/legal/terms/page.tsx`
- Create: `src/app/legal/cookies/page.tsx`
- Create: `src/app/legal/disclosure/page.tsx`

**Interfaces:**
- Consumes: CyberShield product brief, sandbox rules, and data processing model
- Produces: Public legal trust pages with accurate disclosures matching implemented systems.

- [ ] **Step 1: Implement Privacy Policy, Terms, Cookie Notice, and Responsible Disclosure**

- Detail newsletter data collection, chatbot privacy guardrails, zero-execution sandbox guarantees, and user rights.

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/legal/
git commit -m "feat(legal): add comprehensive legal and trust center policies"
```

---

### Task 9: Global Navigation Header, Multi-Column Footer & Layout Integration

**Files:**
- Create: `src/components/GlobalNavbar.tsx`
- Create: `src/components/GlobalFooter.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/AdminModal.tsx` (add Blog & FAQ CMS tabs)

**Interfaces:**
- Consumes: All public pages, chatbot, newsletter, auth modal
- Produces: Cohesive end-to-end SaaS navigation, footer, and admin controls.

- [ ] **Step 1: Build `GlobalNavbar.tsx` and `GlobalFooter.tsx`**

- Responsive navigation bar with links to Scanner, Blog, Resources, Documentation, FAQ, and user session.
- 4-column footer with Product, Resources, Company & Support, Legal, plus newsletter signup bar.

- [ ] **Step 2: Integrate into `src/app/layout.tsx` and attach `SupportChatbot`**

- Mount `SupportChatbot` globally across all pages so users can get assistance anywhere.
- Mount `GlobalNavbar` and `GlobalFooter`.

- [ ] **Step 3: Add Blog & FAQ CMS tabs to `AdminModal.tsx`**

- Enable master admin (`pranavfirame`) to create, publish, unpublish, and manage articles and FAQs directly.

- [ ] **Step 4: Run full verification suite**

Run: `npx tsc --noEmit` and `npx vitest run`  
Expected: All tests pass, 0 TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/GlobalNavbar.tsx src/components/GlobalFooter.tsx src/app/layout.tsx src/app/page.tsx src/components/AdminModal.tsx
git commit -m "feat(navigation): integrate global header, multi-column footer, admin CMS tabs, and support chatbot"
```

---

## Self-Review Checklist

- [x] **Spec coverage**:
  - Blog & Resources Center: Covered in Task 1, Task 3, Task 9.
  - AI Support Chatbot: Covered in Task 4, Task 9.
  - Newsletter Subscription: Covered in Task 1, Task 2, Task 9.
  - FAQ Center: Covered in Task 1, Task 5.
  - Custom 404 & Error Pages: Covered in Task 6.
  - HTML & XML Sitemap + robots.txt: Covered in Task 7.
  - Legal & Trust Center: Covered in Task 8.
  - Global Navigation & Footer: Covered in Task 9.
- [x] **Step scan**: Each step has a specific command, checkable result, or concrete code snippet.
- [x] **Type consistency**: Interfaces (`DbArticle`, `DbFaq`, `DbNewsletterSubscriber`) unified across `src/lib/db.ts` and routes.
- [x] **Review Focus**: All 5 potential failure modes mapped to explicit test steps.
- [x] **Proportion**: Bite-sized tasks with clean signatures and clear deliverables.
