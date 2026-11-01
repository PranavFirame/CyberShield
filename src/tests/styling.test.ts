import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Custom Sky Accent & Hover Theme Styling", () => {
  it("defines .bg-sky-600 with background-color #ff990a in globals.css", () => {
    const cssPath = path.resolve(process.cwd(), "src/app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    expect(cssContent).toContain(".bg-sky-600");
    expect(cssContent.toLowerCase()).toContain("#ff990a");
  });

  it("defines hover background color similar to #ff990a for .bg-sky-600 and hover states", () => {
    const cssPath = path.resolve(process.cwd(), "src/app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    expect(cssContent).toMatch(/\.bg-sky-600:hover/);
    // Verifies a cohesive warm amber/orange hover tone is defined
    expect(cssContent.toLowerCase()).toContain("#e68a00");
  });

  it("configures sky-600 (#ff990a) and hover sky-500 (#e68a00) palette in tailwind.config.ts", () => {
    const tailwindPath = path.resolve(process.cwd(), "tailwind.config.ts");
    const tailwindContent = fs.readFileSync(tailwindPath, "utf-8");

    expect(tailwindContent.toLowerCase()).toContain("#ff990a");
    expect(tailwindContent.toLowerCase()).toContain("#e68a00");
  });
});
