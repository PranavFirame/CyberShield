import { NextResponse } from "next/server";

export async function GET() {
  const isConfigured = Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
  );

  return NextResponse.json({
    configured: isConfigured,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/github/callback`,
  });
}
