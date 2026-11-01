import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("CloudVault-Inspired Design Tokens", () => {
  it("tailwind.config.ts includes cyber-amber, cyber-emerald, and cyber-surface tokens", () => {
    const tailwindConfigPath = path.resolve(__dirname, "../../tailwind.config.ts");
    const content = fs.readFileSync(tailwindConfigPath, "utf-8");

    expect(content).toContain("#F09E4F");
    expect(content).toContain("#64D771");
    expect(content).toContain("cyber");
  });

  it("globals.css includes .nav-pill, .vault-card, and glow utilities", () => {
    const globalsCssPath = path.resolve(__dirname, "../app/globals.css");
    const content = fs.readFileSync(globalsCssPath, "utf-8");

    expect(content).toContain(".nav-pill");
    expect(content).toContain(".vault-card");
    expect(content).toContain(".glow-amber");
  });
});
