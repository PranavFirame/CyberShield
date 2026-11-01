import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME, ensureAdminUserExists } from "@/lib/auth";

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
  const baseUrl = resolveBaseUrl(req);

  try {
    await ensureAdminUserExists();

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const storedState = req.cookies.get("github_oauth_state")?.value;

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=missing_code`);
    }

    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=csrf_validation_failed`);
    }

    const clientId = process.env.GITHUB_CLIENT_ID?.trim();
    const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
    const callbackUrl = `${baseUrl}/api/auth/github/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=oauth_not_configured`);
    }

    // 1. Exchange temporary authorization code for GitHub access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "CyberShield-Security-Auditor/1.0",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("GitHub token exchange failure:", tokenData);
      return NextResponse.redirect(`${baseUrl}/?auth_error=token_exchange_failed`);
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated and verified GitHub user profile from GitHub API
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "CyberShield-Security-Auditor/1.0",
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userRes.ok) {
      console.error("Failed to fetch GitHub profile:", userRes.status);
      return NextResponse.redirect(`${baseUrl}/?auth_error=profile_fetch_failed`);
    }

    const ghUser = (await userRes.json()) as {
      login: string;
      id: number;
      email: string | null;
      avatar_url?: string;
    };

    const verifiedGithubLogin = ghUser.login.trim();

    // 3. Match or create user in SQLite database tied to verified GitHub handle
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { githubUsername: verifiedGithubLogin },
          { username: verifiedGithubLogin },
        ],
      },
    });

    if (user) {
      if (!user.githubUsername) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { githubUsername: verifiedGithubLogin },
        });
      }
    } else {
      const dummyPassword = "OAuth-" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const passwordHash = await hashPassword(dummyPassword);

      user = await prisma.user.create({
        data: {
          username: verifiedGithubLogin,
          email: ghUser.email || `${verifiedGithubLogin.toLowerCase()}@users.noreply.github.com`,
          passwordHash,
          role: "USER",
          githubUsername: verifiedGithubLogin,
        },
      });
    }

    // 4. Issue secure JWT session token
    const token = createSessionToken({
      id: user.id,
      username: user.username,
      role: user.role,
      githubUsername: user.githubUsername,
    });

    const response = NextResponse.redirect(`${baseUrl}/?auth_success=github`);

    // Set secure HTTP-only auth cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Clear state verification cookie
    response.cookies.delete("github_oauth_state");

    return response;
  } catch (err: unknown) {
    console.error("GitHub OAuth callback error:", err);
    return NextResponse.redirect(`${baseUrl}/?auth_error=internal_server_error`);
  }
}
