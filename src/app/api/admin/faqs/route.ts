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

    const faqs = await prisma.faq.findMany();
    return NextResponse.json({ success: true, faqs });
  } catch (err: unknown) {
    console.error("Admin fetch faqs error:", err);
    return NextResponse.json({ error: "Failed to load FAQs" }, { status: 500 });
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
    const { question, answer, category, orderIndex, isPublished, isFeatured } = body;

    if (!question || !answer || !category) {
      return NextResponse.json(
        { error: "Question, answer, and category are required" },
        { status: 400 }
      );
    }

    const faq = await prisma.faq.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim(),
        orderIndex: Number(orderIndex) || 0,
        isPublished: isPublished !== undefined ? Number(isPublished) : 1,
        isFeatured: isFeatured !== undefined ? Number(isFeatured) : 0,
      },
    });

    return NextResponse.json({ success: true, faq });
  } catch (err: unknown) {
    console.error("Admin create faq error:", err);
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
  }
}
