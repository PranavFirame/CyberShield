import { describe, it, expect } from "vitest";
import { calculateRiskScore, calculateDisasterCost } from "../lib/risk-calculator";
import { analyzeRepositoryFiles } from "../lib/scanner-engine";
import { Finding, DisasterCostAssumptions } from "../types/security";

describe("Risk & Disaster Cost Engine", () => {
  it("scores clean repositories with 0 risk", () => {
    const score = calculateRiskScore([]);
    expect(score).toBe(0);
  });

  it("calculates elevated risk for confirmed critical findings with a minimum floor", () => {
    const mockFindings: Finding[] = [
      {
        id: "F-1",
        fingerprint: "fp-1",
        title: "Critical SQL Injection",
        description: "Raw SQL query",
        engineType: "KNOWN_VULNERABILITY",
        toolName: "semgrep",
        ruleId: "rules.sql",
        severity: "CRITICAL",
        confidence: "CONFIRMED",
        validationStatus: "CONFIRMED",
        cweIds: ["CWE-89"],
        location: { filePath: "src/db.ts", startLine: 10, endLine: 10 },
        codeSnippet: "db.query()",
        remediation: { summary: "Use param", patchDiff: "" },
      },
    ];

    const score = calculateRiskScore(mockFindings);
    expect(score).toBeGreaterThanOrEqual(65.0);
  });

  it("calculates realistic disaster cost ranges based on records and outage assumptions", () => {
    const mockFindings: Finding[] = [
      {
        id: "F-1",
        fingerprint: "fp-1",
        title: "Hardcoded Secret",
        description: "Leaked secret",
        engineType: "KNOWN_VULNERABILITY",
        toolName: "gitleaks",
        ruleId: "rules.secret",
        severity: "CRITICAL",
        confidence: "CONFIRMED",
        validationStatus: "CONFIRMED",
        cweIds: ["CWE-798"],
        location: { filePath: "src/auth.ts", startLine: 5, endLine: 5 },
        codeSnippet: "jwt_secret = '123'",
        remediation: { summary: "env var", patchDiff: "" },
      },
    ];

    const assumptions: DisasterCostAssumptions = {
      recordsAtRisk: 1000,
      costPerRecord: 165,
      downtimeDays: 2,
      downtimeCostPerDay: 20000,
      incidentResponseCost: 35000,
      regulatoryRatePercent: 15,
    };

    const cost = calculateDisasterCost(mockFindings, assumptions);
    expect(cost.expectedLoss).toBeGreaterThan(0);
    expect(cost.worstCaseLoss).toBeGreaterThan(cost.expectedLoss);
    expect(cost.lowLoss).toBeLessThan(cost.expectedLoss);
  });
});

describe("Advanced High-Severity Vulnerability Engine", () => {
  it("detects dangerous SSRF, Prototype Pollution, SSTI, and ReDoS vulnerabilities", () => {
    const testFiles = [
      {
        path: "src/server.ts",
        content: `
          // 1. SSRF via fetch
          const res = await fetch(req.query.target);

          // 2. Prototype Pollution via Object.assign
          const cloned = Object.assign({}, req.body);

          // 3. SSTI via EJS render
          const html = ejs.render(req.params.template);

          // 4. Catastrophic ReDoS
          const regex = new RegExp("^(a+)+$");
          const isValid = regex.test(req.body.text);

          // 5. Mass Assignment
          await User.update(req.body);
        `,
      },
    ];

    const findings = analyzeRepositoryFiles("test/repo", testFiles);
    expect(findings.length).toBeGreaterThanOrEqual(5);

    const ssrf = findings.find((f) => f.ruleId.includes("ssrf"));
    expect(ssrf).toBeDefined();
    expect(ssrf?.severity).toBe("CRITICAL");

    const proto = findings.find((f) => f.ruleId.includes("prototype-pollution"));
    expect(proto).toBeDefined();

    const ssti = findings.find((f) => f.ruleId.includes("ssti"));
    expect(ssti).toBeDefined();
    expect(ssti?.severity).toBe("CRITICAL");

    const redos = findings.find((f) => f.ruleId.includes("redos"));
    expect(redos).toBeDefined();

    const massAssign = findings.find((f) => f.ruleId.includes("mass-assignment"));
    expect(massAssign).toBeDefined();
  });
});
