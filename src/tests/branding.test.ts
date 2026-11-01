import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Branding Consistency & Favicon", () => {
  it("GlobalFooter logo matches Navbar gradient, shield styling, and enterprise badge", () => {
    const footerFile = path.resolve(process.cwd(), "src/components/GlobalFooter.tsx");
    expect(fs.existsSync(footerFile)).toBe(true);
    const content = fs.readFileSync(footerFile, "utf-8");

    // Must match the navbar logo styling
    expect(content).toContain("bg-gradient-to-tr from-sky-600 to-indigo-600");
    expect(content).toContain("text-white");
    expect(content).toContain("ENTERPRISE SCANNER");
    expect(content).toContain("AST Vulnerability Analysis & Disaster Risk Modeling");
    expect(content).not.toContain("bg-slate-900 text-white flex items-center justify-center shadow-xs");
  });

  it("PublicNavbar has consistent ENTERPRISE SCANNER badge", () => {
    const navbarFile = path.resolve(process.cwd(), "src/components/PublicNavbar.tsx");
    expect(fs.existsSync(navbarFile)).toBe(true);
    const content = fs.readFileSync(navbarFile, "utf-8");

    expect(content).toContain("bg-gradient-to-tr from-sky-600 to-indigo-600");
    expect(content).toContain("ENTERPRISE SCANNER");
  });

  it("favicon exists as valid SVG icon with shield gradient in app directory", () => {
    const iconFile = path.resolve(process.cwd(), "src/app/icon.svg");
    expect(fs.existsSync(iconFile)).toBe(true);
    const content = fs.readFileSync(iconFile, "utf-8");

    expect(content).toContain("<svg");
    expect(content).toContain("linearGradient");
    expect(content).toContain("path");
  });

  it("RootLayout includes icon metadata reference for broad browser support", () => {
    const layoutFile = path.resolve(process.cwd(), "src/app/layout.tsx");
    const content = fs.readFileSync(layoutFile, "utf-8");

    expect(content).toContain("icons");
  });
});
