import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("GitHub Repositories Hub & Vault Card Layouts", () => {
  const pagePath = path.resolve(__dirname, "../app/page.tsx");

  it("GitHub Repositories section uses vault-card glass styling", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Your GitHub Repositories");
    // Should use vault-card for repos container
    expect(content).toMatch(/Your GitHub Repositories[\s\S]*vault-card/);
  });

  it("1-Click Direct Audit button uses rounded-full styling with amber accent", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("1-Click Audit");
    expect(content).toMatch(/1-Click Audit[\s\S]*rounded-full/);
  });

  it("Empty state recommended targets use vault-card styling", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("Choose a Target to Audit");
    expect(content).toMatch(/Choose a Target to Audit[\s\S]*vault-card/);
  });
});
