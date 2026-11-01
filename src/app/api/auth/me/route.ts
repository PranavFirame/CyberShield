import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ user: null });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!dbUser) return NextResponse.json({ user: null });

    return NextResponse.json({
      user: {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        githubUsername: dbUser.githubUsername ?? null,
        createdAt: dbUser.createdAt,
      },
    });
  } catch (err) {
    console.error("Auth me check error:", err);
    return NextResponse.json({ user: null });
  }
}
