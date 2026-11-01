import { NextResponse } from "next/server";
import { getCurrentUser, AUTH_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Safety guard: The master admin account cannot be deleted
    if (session.username === "pranavfirame") {
      return NextResponse.json(
        { error: "Master administrator account cannot be deleted" },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: { id: session.id },
    });

    const response = NextResponse.json({ success: true, message: "Account deleted successfully" });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
