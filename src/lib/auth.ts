import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "cybershield-dev-secret-key-32-chars-min!!";
export const AUTH_COOKIE_NAME = "cybershield_token";

export interface SessionUser {
  id: string;
  username: string;
  role: "USER" | "ADMIN";
  githubUsername?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(user: { id: string; username: string; role: string; githubUsername?: string | null }): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      githubUsername: user.githubUsername ?? null,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;
    return decoded;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Ensures the master admin account exists on startup
 */
export async function ensureAdminUserExists() {
  try {
    const adminUsername = "pranavfirame";
    const existing = await prisma.user.findUnique({
      where: { username: adminUsername },
    });

    if (!existing) {
      const passwordHash = await hashPassword("pranavadmin@1234");
      await prisma.user.create({
        data: {
          username: adminUsername,
          email: "pranavfirame@cybershield.local",
          passwordHash,
          role: "ADMIN",
        },
      });
      console.log(`[CyberShield] Master admin "${adminUsername}" initialized.`);
    }
  } catch (err) {
    console.error("[CyberShield] Failed to check/seed admin user:", err);
  }
}
