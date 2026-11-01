# CyberShield Content, Support, SEO & Trust Architecture Design Specification

**Status:** APPROVED  
**Date:** 2026-11-01  
**Author:** DeepMind CyberShield Core Engineering  

---

## 1. Intent & Purpose

CyberShield is a defensive cybersecurity and risk intelligence SaaS platform featuring dual AST analysis engines, zero-execution sandboxing, and financial worst-case disaster modeling. This specification details the architecture for the Content, AI Support, Technical SEO, and Trust ecosystem, transforming the application into a complete cybersecurity knowledge, customer support, and organic visibility platform.

---

## 2. Core Subsystems & Technical Architecture

### Subsystem 1: Data Model & SQLite Persistence (`src/lib/db.ts`)
- **Articles (`articles`)**:
  - `id` (TEXT PK), `slug` (TEXT UNIQUE), `title` (TEXT), `summary` (TEXT), `content` (TEXT markdown), `category` (TEXT), `tagsJson` (TEXT), `authorName` (TEXT), `authorRole` (TEXT), `readingTimeMinutes` (INTEGER), `coverImage` (TEXT), `status` (TEXT: `'DRAFT' | 'PUBLISHED'`), `canonicalUrl` (TEXT), `publishedAt` (TEXT), `createdAt` (TEXT), `updatedAt` (TEXT).
- **Newsletter Subscribers (`newsletter_subscribers`)**:
  - `id` (TEXT PK), `email` (TEXT UNIQUE), `status` (TEXT: `'ACTIVE' | 'UNSUBSCRIBED'`), `consentGiven` (INTEGER 0/1), `consentTimestamp` (TEXT), `source` (TEXT), `createdAt` (TEXT), `updatedAt` (TEXT).
- **Frequently Asked Questions (`faqs`)**:
  - `id` (TEXT PK), `question` (TEXT), `answer` (TEXT markdown), `category` (TEXT), `orderIndex` (INTEGER), `isPublished` (INTEGER 0/1), `isFeatured` (INTEGER 0/1), `createdAt` (TEXT), `updatedAt` (TEXT).
- **Seed Data**: Automatic seeding of high-quality cybersecurity articles and comprehensive FAQs across all 12 categories on initial launch if tables are empty.

---

### Subsystem 2: Blog & Cybersecurity Resources Center
- **Public Routes**:
  - `/blog`: Main blog hub with category filters (Application Security, Web Security, API Security, DevSecOps, AI Security, Novel Bug Research, Dependency Security, CyberShield Updates), search input, featured article hero, article grid with reading time estimates, author info, and publication dates.
  - `/blog/[slug]`: In-depth reading page with interactive table of contents, breadcrumbs, social share links, syntax-highlighted code blocks, author bio card, and related articles.
- **Admin CMS Workflow**:
  - `GET /api/admin/articles`: Retrieve all articles including drafts (ADMIN role required).
  - `POST /api/admin/articles`: Create new draft or published article with SEO metadata, tags, and canonical URL.
  - `PUT /api/admin/articles/[id]`: Update article content, status, tags, and category.
  - `DELETE /api/admin/articles/[id]`: Remove article.
  - Integrated into the existing `AdminModal` with a dedicated "Blog CMS" management tab.

---

### Subsystem 3: AI Support Chatbot & Educational Assistant
- **Floating Launcher & Chat Panel** (`src/components/SupportChatbot.tsx`):
  - Fixed bottom-right launcher button with CyberShield badge and notification dot.
  - Smooth expandable chat window with welcome prompt and 4 suggested quick questions.
  - Full conversation history in local session state, typing indicator, and "Clear Conversation" button.
- **Server API** (`/api/support/chat`):
  - Grounded in official CyberShield documentation (`/docs`), scanner limitations, scoring formulas, and FAQs.
  - Guardrails:
    - Never hallucinates non-existent features.
    - Never evaluates or claims unverified vulnerabilities without evidence.
    - Explicitly separates educational advice from live scan findings.
    - Never transmits raw source code or private report data to external endpoints.
    - Escapes to human support contact (`support@cybershield.dev`) when requested or uncertain.
    - Server-side rate limiting and error handling.

---

### Subsystem 4: Newsletter Subscription System
- **Public Endpoints**:
  - `POST /api/newsletter/subscribe`: Validates email format, checks for duplicates, records explicit consent timestamp and source (`landing`, `blog`, `footer`), returns success message.
  - `GET /api/newsletter/unsubscribe?email=...&token=...` / `POST /api/newsletter/unsubscribe`: Safely sets subscriber status to `'UNSUBSCRIBED'`.
- **Placements**:
  - Embedded newsletter subscription card on Landing page, Blog homepage, Article footer, and Global Footer.
  - No intrusive popups.

---

### Subsystem 5: Frequently Asked Questions (FAQ) Center
- **Public Route** (`/faq`):
  - 12 Dedicated Categories:
    1. Getting Started
    2. Repository Scanning
    3. Known Vulnerabilities (CVEs & SAST)
    4. Novel Bug Discovery & AST Taint
    5. AI Code Analysis
    6. Security Scores & Metrics
    7. Risk & Impact Disaster Analysis
    8. Scan Reports & PDF Exports
    9. Privacy & Data Security
    10. GitHub Integration
    11. Accounts & Authentication
    12. Subscriptions & Billing
  - Searchable questions with instant keyword filtering, expandable accordions, documentation deep-links, and contact escalation.
- **Admin Management API**:
  - `GET /api/admin/faqs`, `POST /api/admin/faqs`, `PUT /api/admin/faqs/[id]`, `DELETE /api/admin/faqs/[id]`.

---

### Subsystem 6: Custom 404, 403 & 500 Error Pages
- `src/app/not-found.tsx`: Polished 404 page with CyberShield branding, helpful explanation, "Return Home", "Go to Dashboard", direct links to Documentation, Blog, and FAQ, plus search input.
- `src/app/error.tsx`: Next.js error boundary capturing 500 errors safely without leaking stack traces or internal environment variables, offering "Try Again" and support links.
- Consistent with the light theme WCAG AA `#F8FAFC` base design system.

---

### Subsystem 7: Technical SEO, HTML & XML Sitemaps, robots.txt
- **HTML Sitemap** (`/sitemap`): Human-readable sitemap organized by Main Pages, Product Features, Documentation, Blog Articles, Resources, FAQs, and Legal Trust pages.
- **Dynamic XML Sitemap** (`/sitemap.xml` / `src/app/sitemap.ts`):
  - Dynamically queries published articles and FAQs from SQLite.
  - Generates `<url>` entries with `<loc>`, `<lastmod>`, `<changefreq>`, and `<priority>`.
  - Strictly excludes drafts, admin endpoints, authenticated user pages, and private scan reports.
- **Robots.txt** (`/robots.txt` / `src/app/robots.ts`):
  - Disallows `/api/`, `/admin/`, `/app/`, private scan reports.
  - References `https://cybershield.dev/sitemap.xml`.
- **Structured Data (JSON-LD)**:
  - `Organization`, `SoftwareApplication`, `Article`, `BreadcrumbList`.

---

### Subsystem 8: Legal & Trust Center Integration
- Disclosures for blog content ownership, newsletter data collection, marketing consent, email service providers, chatbot data handling, cookie usage, user privacy rights, and data retention.
- Accessible via `/legal/privacy`, `/legal/terms`, `/legal/cookies`, and `/legal/disclosure`.

---

### Subsystem 9: Global Navigation Header & Multi-Column Footer
- **Navigation Bar**: Responsive navbar with links to Scanner, Blog, Resources, Documentation, FAQ, and authenticated user/profile buttons.
- **Global Footer**: 4 structured columns (Product, Resources, Company & Support, Legal) + Newsletter subscription bar and copyright.
