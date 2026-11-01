import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Mobile Responsiveness & Viewport Optimization", () => {
  it("PublicNavbar includes mobile hamburger toggle and responsive navigation sheet", () => {
    const navbarFile = path.resolve(process.cwd(), "src/components/PublicNavbar.tsx");
    expect(fs.existsSync(navbarFile)).toBe(true);
    const content = fs.readFileSync(navbarFile, "utf-8");

    // Hamburger toggle
    expect(content).toContain("aria-label=\"Toggle navigation menu\"");
    expect(content).toContain("mobileMenuOpen");
    // Responsive breakpoints
    expect(content).toContain("md:hidden");
    expect(content).toContain("hidden md:flex");
  });

  it("SupportChatbot window adapts dynamically to mobile viewports without overflowing 320px", () => {
    const chatbotFile = path.resolve(process.cwd(), "src/components/SupportChatbot.tsx");
    const content = fs.readFileSync(chatbotFile, "utf-8");

    // Dynamic mobile viewport width calc
    expect(content).toContain("w-[calc(100vw-24px)]");
    expect(content).toContain("max-w-[420px]");
    expect(content).toContain("bottom-3 right-3 sm:bottom-5 sm:right-5");
  });

  it("AdminModal tables are enclosed in overflow-x-auto with touch min-width", () => {
    const adminFile = path.resolve(process.cwd(), "src/components/AdminModal.tsx");
    const content = fs.readFileSync(adminFile, "utf-8");

    // Scroll wrapper & table min width
    expect(content).toContain("overflow-x-auto");
    expect(content).toContain("min-w-[560px]");
    expect(content).toContain("max-h-[92vh] sm:max-h-[85vh]");
  });

  it("Main application page includes responsive mobile menu and stackable disaster model", () => {
    const pageFile = path.resolve(process.cwd(), "src/app/page.tsx");
    const content = fs.readFileSync(pageFile, "utf-8");

    // Mobile menu state and toggle
    expect(content).toContain("mobileMenuOpen");
    expect(content).toContain("aria-label=\"Toggle navigation menu\"");

    // Findings table horizontal scrolling
    expect(content).toContain("min-w-[640px]");

    // Stackable disaster model columns
    expect(content).toContain("grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x");
  });

  it("Modals fit mobile viewports with flexible max-height and safe padding", () => {
    const authFile = path.resolve(process.cwd(), "src/components/AuthModal.tsx");
    const authContent = fs.readFileSync(authFile, "utf-8");
    expect(authContent).toContain("p-3 sm:p-4");
    expect(authContent).toContain("max-h-[92vh]");

    const profileFile = path.resolve(process.cwd(), "src/components/ProfileModal.tsx");
    const profileContent = fs.readFileSync(profileFile, "utf-8");
    expect(profileContent).toContain("p-3 sm:p-4");
    expect(profileContent).toContain("max-h-[92vh] sm:max-h-[85vh]");

    const historyFile = path.resolve(process.cwd(), "src/components/HistoryModal.tsx");
    const historyContent = fs.readFileSync(historyFile, "utf-8");
    expect(historyContent).toContain("p-3 sm:p-4");
    expect(historyContent).toContain("max-h-[92vh] sm:max-h-[85vh]");
  });

  it("GlobalFooter provides responsive 1-to-5 column stacking on mobile screens", () => {
    const footerFile = path.resolve(process.cwd(), "src/components/GlobalFooter.tsx");
    const content = fs.readFileSync(footerFile, "utf-8");

    expect(content).toContain("grid-cols-1 sm:grid-cols-2 md:grid-cols-5");
    expect(content).toContain("col-span-1 sm:col-span-2 md:col-span-2");
  });
});
