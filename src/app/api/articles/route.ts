import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureContentSeeded } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await ensureContentSeeded();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search")?.trim() || undefined;

    const articles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        category,
        search,
      },
    });

    return NextResponse.json({
      success: true,
      articles,
    });
  } catch (err: unknown) {
    console.error("Fetch articles error:", err);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
