# CloudVault-Inspired UI/UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul CyberShield's visual hierarchy, navigation, and interactive components inspired by CloudVault's dark obsidian glassmorphism, floating island nav pill, warm cyber-amber accents, and macOS interactive vault cards.

**Architecture:** Extend Tailwind configuration and CSS variables with CloudVault-inspired design tokens (amber `#F09E4F`, emerald `#64D771`, dark surface `#131620`, glass borders). Create reusable floating pill header and vault card patterns. Refactor landing page hero, command audit bar, interactive demo terminal, and GitHub repositories hub, followed by styling harmonization of the Blog, FAQ, and Support Chatbot.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS, Lucide React icons, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-01-cloudvault-ui-ux-design.md`

## Global Constraints

- Preserve zero-execution sandbox: no execution or evaluation of scanned repository code.
- Zero test regressions: all 30 existing test suites must pass continuously.
- WCAG AA accessibility contrast compliance and keyboard navigability.
- No third-party UI framework installs required; native Tailwind CSS and React components only.

## Review Focus

1. Floating Nav Pill sticky positioning on mobile and desktop without obstructing page content.
2. High-contrast legibility of amber accents on dark obsidian glass backgrounds.
3. Proper keyboard focus states for all rounded-full buttons and input elements.
4. Consistent behavior of GitHub OAuth flow and quick audit inputs across viewports.
5. Smooth transitions on accordion drawers and interactive terminal windows without layout shift.

---

### Task 1: Design Tokens & CSS Utilities

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Test: `src/tests/design-tokens.test.ts`

**Interfaces:**
- Produces: CSS utility classes `.nav-pill`, `.vault-card`, `.glow-amber`, `.glow-emerald`, and Tailwind color tokens `cyber-amber`, `cyber-emerald`, `cyber-surface`.

- [ ] **Step 1: Write test for design token definitions in CSS and Tailwind configuration**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Update `tailwind.config.ts` and `src/app/globals.css` with tokens, glassmorphism utilities, and glow filters**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit changes**

---

### Task 2: Floating Nav Pill Navigation Component

**Files:**
- Create: `src/components/FloatingNavPill.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/tests/nav-pill.test.ts`

**Interfaces:**
- Produces: `<FloatingNavPill user={user} onSignIn={...} onSignOut={...} />`
- Consumes: User session state (`AuthUser | null`) and theme state.

- [ ] **Step 1: Write component unit test verifying FloatingNavPill structure and authentication visibility rules**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `FloatingNavPill` with centered floating island shell, shield logo with amber badge, pill navigation links, and theme toggle**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit changes**

---

### Task 3: Hero Section & Command Audit Bar with Mac Terminal Showcase

**Files:**
- Modify: `src/app/page.tsx`
- Test: `src/tests/hero-terminal.test.ts`

**Interfaces:**
- Produces: CloudVault-style hero with live status pill, high-contrast headline, rounded-full command audit bar, and interactive macOS terminal card with AST taint tracing preview.

- [ ] **Step 1: Write test for hero status pill, command audit input, and terminal card elements**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement CloudVault-style hero section and interactive Mac window with AST taint stream in `src/app/page.tsx`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit changes**

---

### Task 4: GitHub Repos Hub & Vault Card Layouts

**Files:**
- Modify: `src/app/page.tsx`
- Test: `src/tests/repos-vault.test.ts`

**Interfaces:**
- Produces: Glassmorphic vault-card grid for user GitHub repositories with language tags, commit SHAs, and 1-click audit pill buttons.

- [ ] **Step 1: Write test verifying repository vault card structure and direct audit click handler**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Refactor GitHub Repos Hub and feature highlight grid to use `.vault-card` styling with amber hover highlights**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit changes**

---

### Task 5: Subsystem Harmonization (Blog, FAQ, Chatbot, Auth Modal)

**Files:**
- Modify: `src/app/blog/page.tsx`
- Modify: `src/app/blog/[slug]/page.tsx`
- Modify: `src/app/faq/page.tsx`
- Modify: `src/components/SupportChatbot.tsx`
- Modify: `src/components/AuthModal.tsx`

**Interfaces:**
- Consumes: FloatingNavPill, `.vault-card`, `.glow-amber` utilities.
- Produces: Harmonized CloudVault aesthetic across all public content pages and interactive modals.

- [ ] **Step 1: Add unit tests checking Blog and FAQ page elements for vault-card containers and amber badges**
- [ ] **Step 2: Update Blog listing & article reader with FloatingNavPill and obsidian glass cards**
- [ ] **Step 3: Update FAQ page with minimalist rounded card drawer accordions**
- [ ] **Step 4: Update SupportChatbot and AuthModal with obsidian glass containers and rounded-full actions**
- [ ] **Step 5: Run all test suites and commit changes**

---

### Task 6: Full Verification & Remote Push

**Files:**
- Verify: Full codebase

- [ ] **Step 1: Run `npx tsc --noEmit` to verify 0 type errors**
- [ ] **Step 2: Run `npx vitest run` to verify all test suites pass**
- [ ] **Step 3: Verify dev server builds cleanly**
- [ ] **Step 4: Push all changes to GitHub repository `main` branch**
