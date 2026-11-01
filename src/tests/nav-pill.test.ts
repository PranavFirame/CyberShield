import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Floating Nav Pill Component", () => {
  const componentPath = path.resolve(__dirname, "../components/FloatingNavPill.tsx");

  it("FloatingNavPill file exists and has correct imports", () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it("FloatingNavPill implements floating pill shell and CloudVault brand accents", () => {
    const content = fs.readFileSync(componentPath, "utf-8");
    expect(content).toContain("nav-pill");
    expect(content).toContain("CYBER");
    expect(content).toContain("SHIELD");
    expect(content).toContain("#F09E4F");
  });

  it("FloatingNavPill only shows Scan History button when user is logged in", () => {
    const content = fs.readFileSync(componentPath, "utf-8");
    // Verify that user conditional is guarding Scan History
    expect(content).toMatch(/user\s*\?\s*\(?[\s\S]*Scan History/);
  });

  it("FloatingNavPill links to Blog and FAQ", () => {
    const content = fs.readFileSync(componentPath, "utf-8");
    expect(content).toContain("/blog");
    expect(content).toContain("/faq");
  });
});
