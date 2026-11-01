import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME, ensureAdminUserExists } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await ensureAdminUserExists();

    const body = await req.json();
    const { username, password, email, githubUsername } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (trimmedUsername.toLowerCase() === "pranavfirame") {
      return NextResponse.json(
        { error: "Username is reserved for master administrator" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: trimmedUsername },
          ...(email ? [{ email: email.trim() }] : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username or email is already taken" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: trimmedUsername,
        email: email ? email.trim() : null,
        passwordHash,
        role: "USER",
        githubUsername: githubUsername ? githubUsername.trim() : null,
      },
    });

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
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
