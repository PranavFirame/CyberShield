import { NextRequest, NextResponse } from "next/server";
import { findSupportAnswer } from "@/lib/support-knowledge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Message exceeds 1,000 character limit." },
        { status: 400 }
      );
    }

    // Simulate minor natural assistant typing delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const answer = findSupportAnswer(message);

    return NextResponse.json({
      success: true,
      reply: answer,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("Support chat error:", err);
    return NextResponse.json(
      { error: "Support assistant encountered an error. Please try again or email support@cybershield.dev" },
      { status: 500 }
    );
  }
}
