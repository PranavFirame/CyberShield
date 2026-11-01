import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME, ensureAdminUserExists } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await ensureAdminUserExists();

    const body = await req.json();
    let githubUsername = body.githubUsername?.trim();

    if (!githubUsername) {
      return NextResponse.json(
        { error: "GitHub username is required" },
        { status: 400 }
      );
    }

    // Strip leading @ if user pasted @handle
    if (githubUsername.startsWith("@")) {
      githubUsername = githubUsername.substring(1).trim();
    }

    if (githubUsername.length < 1 || githubUsername.length > 39) {
      return NextResponse.json(
        { error: "Invalid GitHub username length" },
        { status: 400 }
      );
    }

    // Check if user already exists with this githubUsername or username
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { githubUsername: githubUsername },
          { username: githubUsername },
        ],
      },
    });

    if (user) {
      // Ensure githubUsername is stored
      if (!user.githubUsername) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { githubUsername },
        });
      }
    } else {
      // Create new user for this GitHub account
      const safeUsername = githubUsername;
      const dummyPassword = "OAuth-" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const passwordHash = await hashPassword(dummyPassword);

      user = await prisma.user.create({
        data: {
          username: safeUsername,
          email: `${safeUsername.toLowerCase()}@users.noreply.github.com`,
          passwordHash,
          role: "USER",
          githubUsername,
        },
      });
    }

    const token = createSessionToken({
      id: user.id,
      username: user.username,
      role: user.role,
      githubUsername: user.githubUsername,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        githubUsername: user.githubUsername,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    console.error("GitHub auth error:", err);
    return NextResponse.json(
      { error: "Authentication with GitHub failed" },
      { status: 500 }
    );
  }
}
