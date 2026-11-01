import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureContentSeeded } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await ensureContentSeeded();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;

    const faqs = await prisma.faq.findMany({
      where: {
        category,
        isPublished: 1,
      },
    });

    return NextResponse.json({ success: true, faqs });
  } catch (err: unknown) {
    console.error("Fetch faqs error:", err);
    return NextResponse.json({ error: "Failed to load FAQs" }, { status: 500 });
  }
}
