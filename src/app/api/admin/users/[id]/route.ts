import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safety guard: Protect master admin from deletion
    if (targetUser.username === "pranavfirame") {
      return NextResponse.json(
        { error: "Action forbidden: The master administrator account cannot be deleted" },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: `User "${targetUser.username}" deleted` });
  } catch (err) {
    console.error("Admin delete user error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
