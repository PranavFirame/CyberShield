import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const source = body.source || "landing";
    const consentGiven = body.consentGiven === true || body.consentGiven === 1 ? 1 : 0;

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!consentGiven) {
      return NextResponse.json(
        { error: "Please agree to receive security advisories and newsletters." },
        { status: 400 }
      );
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json({
          success: true,
          message: "You are already subscribed to CyberShield Security Advisories.",
          status: "ALREADY_SUBSCRIBED",
        });
      }

      // Re-activate previously unsubscribed user
      const updated = await prisma.newsletterSubscriber.update({
        where: { email },
        data: { status: "ACTIVE", consentGiven: 1 },
      });

      return NextResponse.json({
        success: true,
        message: "Welcome back! Your subscription has been reactivated.",
        status: updated.status,
      });
    }

    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email,
        source,
        consentGiven: 1,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed! You'll receive our monthly cybersecurity intelligence digests.",
      status: subscriber.status,
    });
  } catch (err: unknown) {
    console.error("Newsletter subscription error:", err);
    return NextResponse.json(
      { error: "Failed to process newsletter subscription. Please try again." },
      { status: 500 }
    );
  }
}
