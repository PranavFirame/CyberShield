import { z } from "zod";

export const SeveritySchema = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const ConfidenceSchema = z.enum(["CONFIRMED", "HIGH", "MEDIUM", "LOW"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const ValidationStatusSchema = z.enum([
  "CONFIRMED",
  "LIKELY",
  "NEEDS_VERIFICATION",
  "FALSE_POSITIVE",
]);
export type ValidationStatus = z.infer<typeof ValidationStatusSchema>;

export const EngineTypeSchema = z.enum(["KNOWN_VULNERABILITY", "NOVEL_DISCOVERY"]);
export type EngineType = z.infer<typeof EngineTypeSchema>;

export interface Finding {
  id: string;
  fingerprint: string;
  title: string;
  description: string;
  engineType: EngineType;
  toolName: string;
  ruleId: string;
  severity: Severity;
  confidence: Confidence;
  validationStatus: ValidationStatus;
  cweIds: string[];
  cveId?: string;
  owaspCategory?: string;
  location: {
    filePath: string;
    startLine: number;
    endLine: number;
    startColumn?: number;
    endColumn?: number;
  };
  codeSnippet: string;
  isNovel?: boolean;
  attackNarrative?: string;
  taintTrace?: {
    source: string;
    sink: string;
    steps: Array<{
      file: string;
      line: number;
      description: string;
    }>;
  };
  remediation: {
    summary: string;
    patchDiff: string;
    unitTestFixture?: string;
    breakingChangeRisk?: "LOW" | "MEDIUM" | "HIGH";
  };
}

export const DisasterCostAssumptionsSchema = z.object({
  recordsAtRisk: z.number().default(10000),
  costPerRecord: z.number().default(165),
  downtimeDays: z.number().default(2),
  downtimeCostPerDay: z.number().default(20000),
  incidentResponseCost: z.number().default(35000),
  regulatoryRatePercent: z.number().default(15),
});
export type DisasterCostAssumptions = z.infer<typeof DisasterCostAssumptionsSchema>;

export const DisasterCostResultSchema = z.object({
  recordsLoss: z.number(),
  downtimeLoss: z.number(),
  incidentResponse: z.number(),
  regulatoryOverhead: z.number(),
  expectedLoss: z.number(),
  lowLoss: z.number(),
  worstCaseLoss: z.number(),
});
export type DisasterCostResult = z.infer<typeof DisasterCostResultSchema>;

export interface ScanReport {
  scanId: string;
  userId?: string;
  targetType: "REPOSITORY" | "WEBSITE";
  repoUrl: string;
  repoFullName: string;
  defaultBranch?: string;
  commitSha?: string;
  status: "QUEUED" | "FETCHING" | "ANALYZING" | "NOVEL_DISCOVERY" | "COMPLETED" | "FAILED";
  progress: number;
  durationMs: number;
  riskScore: number;
  findings: Finding[];
  costModel: DisasterCostResult;
  costAssumptions: DisasterCostAssumptions;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    novelCount: number;
  };
}
