import { NextRequest, NextResponse } from "next/server";

function resolveBaseUrl(req: NextRequest): string {
  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || (forwardedHost?.includes("localhost") ? "http" : "https");

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return (
    process.env.RENDER_EXTERNAL_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    req.nextUrl.origin ||
    "http://localhost:3000"
  );
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();

  const baseUrl = resolveBaseUrl(req);
  const callbackUrl = `${baseUrl}/api/auth/github/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error: "GITHUB_OAUTH_NOT_CONFIGURED",
        configured: false,
        message:
          "GitHub OAuth requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET. Please register a GitHub OAuth application at https://github.com/settings/developers with callback URL: " +
          callbackUrl,
      },
      { status: 400 }
    );
  }

  // Generate cryptographically secure state token to prevent CSRF
  const state = crypto.randomUUID();

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", callbackUrl);
  githubAuthUrl.searchParams.set("scope", "read:user,repo");
  githubAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(githubAuthUrl.toString());

  // Store state token in secure HTTP-only cookie for verification in callback
  response.cookies.set({
    name: "github_oauth_state",
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
