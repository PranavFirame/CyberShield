import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureContentSeeded } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await ensureContentSeeded();
    const { slug } = await params;

    const article = await prisma.article.findUnique({
      where: { slug },
    });

    if (!article || article.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Related articles in the same category
    const allCategoryArticles = await prisma.article.findMany({
      where: {
        category: article.category,
        status: "PUBLISHED",
      },
      take: 4,
    });

    const related = allCategoryArticles.filter((a) => a.slug !== article.slug).slice(0, 3);

    return NextResponse.json({
      success: true,
      article,
      related,
    });
  } catch (err: unknown) {
    console.error("Fetch article error:", err);
    return NextResponse.json(
      { error: "Failed to fetch article details" },
      { status: 500 }
    );
  }
}
