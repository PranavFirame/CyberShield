import { Finding, DisasterCostAssumptions, DisasterCostResult } from "@/types/security";

/**
 * Derives context-aware default financial assumptions dynamically based on the repository's
 * specific detected vulnerabilities, attack surfaces, and risk profiles.
 */
export function deriveDynamicAssumptions(findings: Finding[]): DisasterCostAssumptions {
  if (findings.length === 0) {
    return {
      recordsAtRisk: 0,
      costPerRecord: 165,
      downtimeDays: 0,
      downtimeCostPerDay: 5000,
      incidentResponseCost: 5000,
      regulatoryRatePercent: 5,
    };
  }

  const hasCriticalSecrets = findings.some(
    (f) => f.toolName === "gitleaks" && f.severity === "CRITICAL"
  );
  const hasSQLi = findings.some(
    (f) => f.cweIds.includes("CWE-89") || f.ruleId.includes("sql")
  );
  const hasRCE = findings.some(
    (f) =>
      f.cweIds.includes("CWE-78") ||
      f.cweIds.includes("CWE-95") ||
      f.ruleId.includes("command") ||
      f.ruleId.includes("eval")
  );
  const hasPathTraversal = findings.some(
    (f) => f.cweIds.includes("CWE-22") || f.ruleId.includes("path-traversal")
  );
  const criticalCount = findings.filter((f) => f.severity === "CRITICAL").length;
  const highCount = findings.filter((f) => f.severity === "HIGH").length;

  // 1. Records at risk: directly tied to database exfiltration & secret leakage
  let recordsAtRisk = 5000;
  if (hasSQLi && hasCriticalSecrets) {
    recordsAtRisk = 75000;
  } else if (hasSQLi || hasCriticalSecrets) {
    recordsAtRisk = 35000;
  } else if (hasPathTraversal) {
    recordsAtRisk = 12000;
  } else if (criticalCount > 0) {
    recordsAtRisk = 20000;
  } else if (highCount > 0) {
    recordsAtRisk = 8000;
  }

  // 2. Outage downtime days: tied to RCE / command injection / service crashes
  let downtimeDays = 1.0;
  if (hasRCE) {
    downtimeDays = 5.0; // Severe infrastructure takeover requires full server rebuild
  } else if (criticalCount >= 3) {
    downtimeDays = 3.5;
  } else if (criticalCount > 0) {
    downtimeDays = 2.0;
  } else if (highCount > 0) {
    downtimeDays = 1.0;
  } else {
    downtimeDays = 0.5;
  }

  // 3. Downtime cost per day: higher for production API/RCE exposures
  let downtimeCostPerDay = 15000;
  if (hasRCE || (hasSQLi && criticalCount > 2)) {
    downtimeCostPerDay = 45000;
  } else if (criticalCount > 0) {
    downtimeCostPerDay = 25000;
  }

  // 4. Incident response & forensics cost
  let incidentResponseCost = 25000;
  if (hasRCE && hasCriticalSecrets) {
    incidentResponseCost = 85000;
  } else if (hasRCE || hasSQLi) {
    incidentResponseCost = 55000;
  } else if (criticalCount > 0) {
    incidentResponseCost = 35000;
  }

  // 5. Regulatory rate percent (GDPR/CCPA/HIPAA liability overhead)
  let regulatoryRatePercent = 10;
  if (hasSQLi || hasCriticalSecrets) {
    regulatoryRatePercent = 20; // Personal Identifiable Information (PII) breach penalties
  } else if (criticalCount > 0) {
    regulatoryRatePercent = 15;
  }

  return {
    recordsAtRisk,
    costPerRecord: 165, // Standard benchmark (IBM Security 2024)
    downtimeDays,
    downtimeCostPerDay,
    incidentResponseCost,
    regulatoryRatePercent,
  };
}

/**
 * Calculates a transparent 0-100 Risk Score using base severity,
 * exploitability, exposure, confidence, and diminishing marginal return dampening.
 */
export function calculateRiskScore(findings: Finding[]): number {
  if (findings.length === 0) return 0;

  const severityWeights = {
    CRITICAL: 25.0,
    HIGH: 12.0,
    MEDIUM: 4.0,
    LOW: 1.0,
    INFO: 0.1,
  };

  const confidenceWeights = {
    CONFIRMED: 1.0,
    HIGH: 0.85,
    MEDIUM: 0.6,
    LOW: 0.3,
  };

  let rawWeightedSum = 0;
  let hasCriticalConfirmed = false;

  for (const f of findings) {
    if (f.validationStatus === "FALSE_POSITIVE") continue;

    const s = severityWeights[f.severity] || 1.0;
    const c = confidenceWeights[f.confidence] || 0.6;
    const e = f.cveId ? 1.2 : 1.0;
    const a = f.isNovel ? 1.15 : 1.0;

    rawWeightedSum += s * c * e * a;

    if (f.severity === "CRITICAL" && f.confidence === "CONFIRMED") {
      hasCriticalConfirmed = true;
    }
  }

  // Diminishing dampening factor K = 1 / log2(N + 2)
  const dampening = 1 / Math.log2(findings.length + 2);
  let totalScore = rawWeightedSum * dampening;

  // Floor safeguard: A confirmed critical guarantees a high floor (>= 65.0)
  if (hasCriticalConfirmed && totalScore < 65.0) {
    totalScore = 65.0 + totalScore * 0.2;
  }

  return Math.min(100.0, Math.round(totalScore * 10) / 10);
}

/**
 * Transparent Worst-Case Disaster Cost Model
 * Based on IBM Security Cost of Data Breach & Ponemon statistical factors.
 */
export function calculateDisasterCost(
  findings: Finding[],
  assumptions: DisasterCostAssumptions
): DisasterCostResult {
  if (findings.length === 0) {
    return {
      recordsLoss: 0,
      downtimeLoss: 0,
      incidentResponse: 0,
      regulatoryOverhead: 0,
      expectedLoss: 0,
      lowLoss: 0,
      worstCaseLoss: 0,
    };
  }

  const hasExfiltrationRisk = findings.some(
    (f) =>
      f.severity === "CRITICAL" ||
      f.cweIds.includes("CWE-89") ||
      f.cweIds.includes("CWE-22") ||
      f.toolName === "gitleaks"
  );

  const hasDowntimeRisk = findings.some(
    (f) =>
      f.severity === "CRITICAL" ||
      f.cweIds.includes("CWE-78") ||
      f.cweIds.includes("CWE-95") ||
      f.cweIds.includes("CWE-400")
  );

  const breachProbability = hasExfiltrationRisk ? 0.85 : 0.2;
  const effectiveOutageDays = hasDowntimeRisk ? assumptions.downtimeDays : Math.min(0.5, assumptions.downtimeDays);

  const recordsLoss = Math.round(
    assumptions.recordsAtRisk * assumptions.costPerRecord * breachProbability
  );
  const downtimeLoss = Math.round(effectiveOutageDays * assumptions.downtimeCostPerDay);
  const incidentResponse = assumptions.incidentResponseCost;
  const directLosses = recordsLoss + downtimeLoss + incidentResponse;
  const regulatoryOverhead = Math.round(
    directLosses * (assumptions.regulatoryRatePercent / 100)
  );

  const expectedLoss = directLosses + regulatoryOverhead;
  const lowLoss = Math.round(expectedLoss * 0.35);
  const worstCaseLoss = Math.round(expectedLoss * 2.2);

  return {
    recordsLoss,
    downtimeLoss,
    incidentResponse,
    regulatoryOverhead,
    expectedLoss,
    lowLoss,
    worstCaseLoss,
  };
}
