import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("CloudVault-Inspired Hero & Mac Terminal Showcase", () => {
  const pagePath = path.resolve(__dirname, "../app/page.tsx");

  it("page.tsx contains CloudVault live status pill with emerald indicator", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Zero-Execution");
    expect(content).toContain("#64D771");
  });

  it("page.tsx contains rounded-full command audit bar with amber CTA", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("audit-terminal");
    expect(content).toContain("#F09E4F");
  });

  it("page.tsx features Mac-style window controls (red, yellow, green dots)", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("mac-dot-red");
    expect(content).toContain("mac-dot-yellow");
    expect(content).toContain("mac-dot-green");
  });
});
