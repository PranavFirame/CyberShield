import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryUsername = searchParams.get("username")?.trim();

    const session = await getCurrentUser();
    let githubUsername = queryUsername;

    if (!githubUsername && session) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.id },
      });
      githubUsername = dbUser?.githubUsername || session.githubUsername || session.username;
    }

    if (!githubUsername) {
      return NextResponse.json(
        { error: "No GitHub username specified or linked to this account" },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      "User-Agent": "CyberShield-Security-Auditor/1.0",
      Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(githubUsername)}/repos?sort=updated&per_page=30`,
      { headers, next: { revalidate: 60 } }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: `GitHub user "${githubUsername}" not found. Verify your GitHub handle.` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `GitHub API error: status ${res.status}` },
        { status: res.status }
      );
    }

    const rawRepos = (await res.json()) as Array<{
      id: number;
      name: string;
      full_name: string;
      description: string | null;
      html_url: string;
      language: string | null;
      stargazers_count: number;
      updated_at: string;
      fork: boolean;
      private: boolean;
    }>;

    const repos = rawRepos
      .filter((r) => !r.private)
      .map((r) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        description: r.description,
        htmlUrl: r.html_url,
        language: r.language,
        stars: r.stargazers_count,
        updatedAt: r.updated_at,
        isFork: r.fork,
      }));

    return NextResponse.json({
      success: true,
      githubUsername,
      repos,
    });
  } catch (err: unknown) {
    console.error("Fetch GitHub repos error:", err);
    return NextResponse.json(
      { error: "Failed to fetch repositories from GitHub" },
      { status: 500 }
    );
  }
}
