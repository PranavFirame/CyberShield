import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getCurrentUser();

    // STRICT ISOLATION: No user can see any other user's audits or reports.
    // If not authenticated, return empty list.
    if (!session) {
      return NextResponse.json({ scans: [] });
    }

    // Query ONLY scans owned by this specific user
    const scans = await prisma.scanRecord.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const parsedScans = scans.map((s) => ({
      id: s.id,
      userId: s.userId,
      username: session.username,
      targetType: s.targetType,
      repoUrl: s.repoUrl,
      repoFullName: s.repoFullName,
      defaultBranch: s.defaultBranch,
      commitSha: s.commitSha,
      riskScore: s.riskScore,
      durationMs: s.durationMs,
      summary: JSON.parse(s.summaryJson),
      findingsCount: (JSON.parse(s.findingsJson) as unknown[]).length,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ scans: parsedScans });
  } catch (err) {
    console.error("Fetch scan history error:", err);
    return NextResponse.json({ error: "Failed to fetch scan history" }, { status: 500 });
  }
}
