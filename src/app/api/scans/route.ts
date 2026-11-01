import { NextRequest, NextResponse } from "next/server";
import { fetchGitHubRepo } from "@/lib/github-fetcher";
import { auditLiveWebsite } from "@/lib/web-auditor";
import { analyzeRepositoryFiles } from "@/lib/scanner-engine";
import { calculateRiskScore, calculateDisasterCost, deriveDynamicAssumptions } from "@/lib/risk-calculator";
import { DisasterCostAssumptions, ScanReport } from "@/types/security";
import { scansStore } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoUrl, assumptions } = body;

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { error: { message: "Invalid repository or website URL provided" } },
        { status: 400 }
      );
    }

    const sessionUser = await getCurrentUser();
    const inputUrl = repoUrl.trim();
    const startTime = Date.now();
    const scanId = `scan-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Check if target is a GitHub repository or a live Web application URL
    const githubMatch = inputUrl.match(/^https:\/\/github\.com\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)(?:\/)?$/);

    if (githubMatch) {
      // MODE 1: GITHUB REPOSITORY DEEP SCAN
      const owner = githubMatch[1];
      const repo = githubMatch[2].replace(/\.git$/, "");

      const repoData = await fetchGitHubRepo(owner, repo);
      const findings = analyzeRepositoryFiles(repoData.fullName, repoData.files);
      const riskScore = calculateRiskScore(findings);
      const dynamicAssumptions = deriveDynamicAssumptions(findings);

      const costAssumptions: DisasterCostAssumptions = {
        recordsAtRisk: assumptions?.recordsAtRisk !== undefined ? assumptions.recordsAtRisk : dynamicAssumptions.recordsAtRisk,
        costPerRecord: assumptions?.costPerRecord !== undefined ? assumptions.costPerRecord : dynamicAssumptions.costPerRecord,
        downtimeDays: assumptions?.downtimeDays !== undefined ? assumptions.downtimeDays : dynamicAssumptions.downtimeDays,
        downtimeCostPerDay: assumptions?.downtimeCostPerDay !== undefined ? assumptions.downtimeCostPerDay : dynamicAssumptions.downtimeCostPerDay,
        incidentResponseCost: assumptions?.incidentResponseCost !== undefined ? assumptions.incidentResponseCost : dynamicAssumptions.incidentResponseCost,
        regulatoryRatePercent: assumptions?.regulatoryRatePercent !== undefined ? assumptions.regulatoryRatePercent : dynamicAssumptions.regulatoryRatePercent,
      };
      const costModel = calculateDisasterCost(findings, costAssumptions);

      const report: ScanReport = {
        scanId,
        userId: sessionUser?.id,
        targetType: "REPOSITORY",
        repoUrl: inputUrl,
        repoFullName: repoData.fullName,
        defaultBranch: repoData.defaultBranch,
        commitSha: repoData.commitSha,
        status: "COMPLETED",
        progress: 100,
        durationMs: Date.now() - startTime,
        riskScore,
        findings,
        costModel,
        costAssumptions,
        summary: {
          total: findings.length,
          critical: findings.filter((f) => f.severity === "CRITICAL").length,
          high: findings.filter((f) => f.severity === "HIGH").length,
          medium: findings.filter((f) => f.severity === "MEDIUM").length,
          low: findings.filter((f) => f.severity === "LOW").length,
          novelCount: findings.filter((f) => f.isNovel).length,
        },
      };

      scansStore.set(scanId, report);

      // Persist to database if available
      try {
        await prisma.scanRecord.create({
          data: {
            id: scanId,
            userId: sessionUser?.id ?? null,
            targetType: "REPOSITORY",
            repoUrl: inputUrl,
            repoFullName: repoData.fullName,
            defaultBranch: repoData.defaultBranch,
            commitSha: repoData.commitSha,
            riskScore,
            durationMs: report.durationMs,
            summaryJson: JSON.stringify(report.summary),
            findingsJson: JSON.stringify(findings),
            costModelJson: JSON.stringify(costModel),
            costAssumptionsJson: JSON.stringify(costAssumptions),
          },
        });
      } catch (dbErr) {
        console.warn("[CyberShield] Database persistence skipped/failed:", dbErr);
      }

      return NextResponse.json({
        success: true,
        scanId,
        targetType: "REPOSITORY",
        filesScannedCount: repoData.files.length,
        report,
      });
    } else {
      // MODE 2: LIVE WEB APPLICATION & PERIMETER SECURITY AUDIT
      const webResult = await auditLiveWebsite(inputUrl);
      const riskScore = calculateRiskScore(webResult.findings);
      const dynamicAssumptions = deriveDynamicAssumptions(webResult.findings);

      const costAssumptions: DisasterCostAssumptions = {
        recordsAtRisk: assumptions?.recordsAtRisk !== undefined ? assumptions.recordsAtRisk : dynamicAssumptions.recordsAtRisk,
        costPerRecord: assumptions?.costPerRecord !== undefined ? assumptions.costPerRecord : dynamicAssumptions.costPerRecord,
        downtimeDays: assumptions?.downtimeDays !== undefined ? assumptions.downtimeDays : dynamicAssumptions.downtimeDays,
        downtimeCostPerDay: assumptions?.downtimeCostPerDay !== undefined ? assumptions.downtimeCostPerDay : dynamicAssumptions.downtimeCostPerDay,
        incidentResponseCost: assumptions?.incidentResponseCost !== undefined ? assumptions.incidentResponseCost : dynamicAssumptions.incidentResponseCost,
        regulatoryRatePercent: assumptions?.regulatoryRatePercent !== undefined ? assumptions.regulatoryRatePercent : dynamicAssumptions.regulatoryRatePercent,
      };
      const costModel = calculateDisasterCost(webResult.findings, costAssumptions);

      const report: ScanReport = {
        scanId,
        userId: sessionUser?.id,
        targetType: "WEBSITE",
        repoUrl: webResult.targetUrl,
        repoFullName: webResult.hostname,
        status: "COMPLETED",
        progress: 100,
        durationMs: webResult.durationMs,
        riskScore,
        findings: webResult.findings,
        costModel,
        costAssumptions,
        summary: {
          total: webResult.findings.length,
          critical: webResult.findings.filter((f) => f.severity === "CRITICAL").length,
          high: webResult.findings.filter((f) => f.severity === "HIGH").length,
          medium: webResult.findings.filter((f) => f.severity === "MEDIUM").length,
          low: webResult.findings.filter((f) => f.severity === "LOW").length,
          novelCount: 0,
        },
      };

      scansStore.set(scanId, report);

      // Persist to database if available
      try {
        await prisma.scanRecord.create({
          data: {
            id: scanId,
            userId: sessionUser?.id ?? null,
            targetType: "WEBSITE",
            repoUrl: webResult.targetUrl,
            repoFullName: webResult.hostname,
            riskScore,
            durationMs: report.durationMs,
            summaryJson: JSON.stringify(report.summary),
            findingsJson: JSON.stringify(webResult.findings),
            costModelJson: JSON.stringify(costModel),
            costAssumptionsJson: JSON.stringify(costAssumptions),
          },
        });
      } catch (dbErr) {
        console.warn("[CyberShield] Database persistence skipped/failed:", dbErr);
      }

      return NextResponse.json({
        success: true,
        scanId,
        targetType: "WEBSITE",
        report,
      });
    }
  } catch (err: unknown) {
    console.error("Scan analysis error:", err);
    const message = err instanceof Error ? err.message : "Failed to analyze target";
    return NextResponse.json(
      { error: { message } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scanId = searchParams.get("scanId");

  if (!scanId) {
    return NextResponse.json(
      { error: { message: "Scan ID is required" } },
      { status: 400 }
    );
  }

  const sessionUser = await getCurrentUser();

  // 1. Check in-memory store
  if (scansStore.has(scanId)) {
    const report = scansStore.get(scanId)!;
    // Strict isolation: if scan belongs to a user, only that user can view it
    if (report.userId && (!sessionUser || sessionUser.id !== report.userId)) {
      return NextResponse.json(
        { error: { message: "Access forbidden: You cannot view another user's audit report" } },
        { status: 403 }
      );
    }
    return NextResponse.json({
      success: true,
      report,
    });
  }

  // 2. Fallback to database lookup
  try {
    const record = await prisma.scanRecord.findUnique({
      where: { id: scanId },
    });

    if (record) {
      // Strict isolation: if scan belongs to a user, only that user can view it
      if (record.userId && (!sessionUser || sessionUser.id !== record.userId)) {
        return NextResponse.json(
          { error: { message: "Access forbidden: You cannot view another user's audit report" } },
          { status: 403 }
        );
      }

      const report: ScanReport = {
        scanId: record.id,
        userId: record.userId ?? undefined,
        targetType: record.targetType as "REPOSITORY" | "WEBSITE",
        repoUrl: record.repoUrl,
        repoFullName: record.repoFullName,
        defaultBranch: record.defaultBranch ?? undefined,
        commitSha: record.commitSha ?? undefined,
        status: "COMPLETED",
        progress: 100,
        durationMs: record.durationMs,
        riskScore: record.riskScore,
        findings: JSON.parse(record.findingsJson),
        costModel: JSON.parse(record.costModelJson),
        costAssumptions: JSON.parse(record.costAssumptionsJson),
        summary: JSON.parse(record.summaryJson),
      };

      scansStore.set(scanId, report);
      return NextResponse.json({ success: true, report });
    }
  } catch (err) {
    console.error("Error fetching scan from database:", err);
  }

  return NextResponse.json(
    { error: { message: "Scan report not found" } },
    { status: 404 }
  );
}
