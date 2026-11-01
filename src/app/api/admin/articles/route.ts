import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma, ensureContentSeeded } from "@/lib/db";

export async function GET() {
  try {
    await ensureContentSeeded();
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    // Admins see all articles including drafts
    const articles = await prisma.article.findMany();
    return NextResponse.json({ success: true, articles });
  } catch (err: unknown) {
    console.error("Admin fetch articles error:", err);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureContentSeeded();
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { title, summary, content, category, tags, status, slug: customSlug } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "Title, content, and category are required" },
        { status: 400 }
      );
    }

    const slug =
      customSlug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
        "-" +
        Math.random().toString(36).substring(2, 6);

    const article = await prisma.article.create({
      data: {
        slug,
        title: title.trim(),
        summary: summary?.trim() || title.trim(),
        content,
        category: category.trim(),
        tags: Array.isArray(tags) ? tags : [],
        status: status === "DRAFT" ? "DRAFT" : "PUBLISHED",
        authorName: session.username,
        authorRole: "CyberShield Security Lead",
      },
    });

    return NextResponse.json({ success: true, article });
  } catch (err: unknown) {
    console.error("Admin create article error:", err);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
