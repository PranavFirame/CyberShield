import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.article.update({
      where: { id },
      data: {
        title: body.title,
        summary: body.summary,
        content: body.content,
        category: body.category,
        tags: body.tags,
        status: body.status,
      },
    });

    return NextResponse.json({ success: true, article: updated });
  } catch (err: unknown) {
    console.error("Admin update article error:", err);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { id } = await params;
    await prisma.article.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Article deleted successfully" });
  } catch (err: unknown) {
    console.error("Admin delete article error:", err);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
