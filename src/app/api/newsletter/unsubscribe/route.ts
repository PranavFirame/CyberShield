import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (!existing) {
      return NextResponse.json({
        success: true,
        message: "Email is not in our subscription records.",
      });
    }

    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { status: "UNSUBSCRIBED" },
    });

    return NextResponse.json({
      success: true,
      message: "You have been successfully unsubscribed from CyberShield newsletters.",
    });
  } catch (err: unknown) {
    console.error("Newsletter unsubscribe error:", err);
    return NextResponse.json({ error: "Failed to process unsubscription" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
  }

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });

  if (existing) {
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { status: "UNSUBSCRIBED" },
    });
  }

  return NextResponse.json({
    success: true,
    message: "You have been successfully unsubscribed from CyberShield communications.",
  });
}
