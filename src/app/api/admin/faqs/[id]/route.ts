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

    const updated = await prisma.faq.update({
      where: { id },
      data: {
        question: body.question,
        answer: body.answer,
        category: body.category,
        orderIndex: body.orderIndex !== undefined ? Number(body.orderIndex) : undefined,
        isPublished: body.isPublished !== undefined ? Number(body.isPublished) : undefined,
        isFeatured: body.isFeatured !== undefined ? Number(body.isFeatured) : undefined,
      },
    });

    return NextResponse.json({ success: true, faq: updated });
  } catch (err: unknown) {
    console.error("Admin update faq error:", err);
    return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 });
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
    await prisma.faq.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "FAQ deleted successfully" });
  } catch (err: unknown) {
    console.error("Admin delete faq error:", err);
    return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 });
  }
}
