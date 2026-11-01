import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Valid username is required" }, { status: 400 });
    }

    const trimmed = username.trim();
    if (trimmed.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }

    if (trimmed.toLowerCase() === "pranavfirame" && session.username !== "pranavfirame") {
      return NextResponse.json({ error: "Reserved username" }, { status: 400 });
    }

    // Check if taken by another user
    const existing = await prisma.user.findFirst({
      where: {
        username: trimmed,
        id: { not: session.id },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: { username: trimmed },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
