# CyberShield CloudVault-Inspired UI/UX Design Specification

## 1. Intent & Context
Elevate CyberShield's visual design, layout hierarchy, and user experience by adopting the aesthetic and interaction models demonstrated by [CloudVault](https://cloudvault-8bqj.onrender.com/).

CloudVault achieves a high-trust, premium cybersecurity feel through:
- Centered floating island navigation pill (`nav-pill`) with translucent glassmorphic backdrop.
- Obsidian dark-first palette (`#0B0D13` / `#131316`) paired with warm cyber-amber accents (`#F09E4F`), emerald security verified badges (`#64D771`), and subtle cyan taint highlights.
- High-contrast typography with deliberate line lengths and glowing gradient accents.
- Interactive macOS terminal/vault showcase card with active protocol telemetry and encrypted item list styles.
- Pill-shaped (`rounded-full`) controls, badges, and CTAs.
- Minimalist rounded card drawers (`vault-card`) with subtle border glows.

---

## 2. Design System Tokens & Classes

### Color Palette
- **Background Base**: `#0A0D14` (Obsidian Dark) / `#F8FAFC` (Clean Light)
- **Surface**: `#131620` (Dark Slate Glass) / `#FFFFFF` (Light Surface)
- **Surface Border**: `rgba(255, 255, 255, 0.08)` (Dark) / `rgba(15, 23, 42, 0.08)` (Light)
- **Accent Primary**: `#F09E4F` (Warm Cyber Amber)
- **Accent Glow**: `rgba(240, 158, 79, 0.25)`
- **Security Verified / Success**: `#64D771` (Neon Emerald)
- **Warning / Novel Bug**: `#F59E0B` (Vibrant Amber)
- **Critical Risk**: `#EF4444` (Vibrant Crimson)
- **AST Taint Flow / Info**: `#38BDF8` (Cyan Blue)

### Component Patterns
1. **Floating Navigation Pill (`.nav-pill`)**:
   - Centered container: `sticky top-3 sm:top-4 z-50 max-w-5xl mx-auto px-4`.
   - Outer shell: `rounded-full backdrop-blur-xl bg-slate-900/80 dark:bg-[#131620]/80 border border-slate-200/80 dark:border-white/10 shadow-2xl px-5 py-2.5`.
   - Brand: Shield logo + `CYBER`<span class="text-[#F09E4F]">SHIELD</span>.
   - Links: Pill-shaped hover states.
   - Action: `rounded-full` CTA with amber glow.

2. **Mac-Style Vault Terminal Card (`.vault-card`)**:
   - Header: Top bar with red, yellow, green window dots (`w-3 h-3 rounded-full`).
   - Title: Protocol URL, e.g. `cybershield://ast/audit-engine • DUAL ENGINES ACTIVE`.
   - Telemetry Stream: Real-time scan telemetry and AST taint traces.
   - Interactive Objects: Encrypted-item style cards with severity tags, file locations, and patch triggers.

3. **Rounded Pill Command Bar**:
   - `rounded-full` input box with embedded icon and inline pill "Run Audit" button.

---

## 3. Scope & Screens

1. **Global Styles (`src/app/globals.css` & `tailwind.config.ts`)**:
   - Add custom color variables, glow utilities, and glass card utility classes.
2. **Main Landing & Quick Audit (`src/app/page.tsx`)**:
   - Replace standard navbar with the Floating Nav Pill.
   - Hero section with live status pill, high-contrast headline, and command audit bar.
   - Interactive Mac-style AST taint terminal showcase.
   - GitHub Repositories Hub with glass card tiles and 1-click audit pill buttons.
   - Disaster cost and dual-engine discovery cards in `.vault-card` style.
3. **Blog & Resources (`src/app/blog/page.tsx` & `src/app/blog/[slug]/page.tsx`)**:
   - Floating nav pill and glass cards with amber tags and reading time pills.
4. **FAQ Center (`src/app/faq/page.tsx`)**:
   - Minimalist accordion drawers matching CloudVault's drawer pattern.
5. **Support Chatbot (`src/components/SupportChatbot.tsx`)**:
   - Obsidian glass panel with amber launcher and emerald status badge.
6. **Authentication Modal (`src/components/AuthModal.tsx`)**:
   - Obsidian glass modal with rounded-full OAuth buttons.

---

## 4. Invariants & Safety
- Maintain zero-execution sandbox: no execution or evaluation of third-party repositories.
- Strict tenant isolation for scans.
- All existing 30 tests in `src/tests/*.test.ts` must pass.
- WCAG AA contrast standards maintained.
