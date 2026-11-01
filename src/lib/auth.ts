import crypto from "crypto";
import { createRequire } from "module";
import { cookies } from "next/headers";
import { prisma } from "./db";

let bcrypt: any = null;
let jwt: any = null;
try {
  const req = createRequire(import.meta.url);
  bcrypt = req("bcryptjs");
} catch {
  bcrypt = null;
}
try {
  const req = createRequire(import.meta.url);
  jwt = req("jsonwebtoken");
} catch {
  jwt = null;
}

const JWT_SECRET = process.env.JWT_SECRET || "cybershield-dev-secret-key-32-chars-min!!";
export const AUTH_COOKIE_NAME = "cybershield_token";

export interface SessionUser {
  id: string;
  username: string;
  role: "USER" | "ADMIN";
  githubUsername?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  if (bcrypt && typeof bcrypt.hash === "function") {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
  // Universal standard fallback producing bcrypt-compliant format
  const salt = crypto.randomBytes(16).toString("base64").slice(0, 22).replace(/\+/g, ".");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 24, "sha256").toString("base64").slice(0, 31).replace(/\+/g, ".");
  return `$2a$10$${salt}${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (bcrypt && typeof bcrypt.compare === "function") {
    try {
      const res = await bcrypt.compare(password, storedHash);
      if (res) return true;
    } catch {}
  }
  if (!storedHash.startsWith("$2a$10$") && !storedHash.startsWith("$2b$10$")) return false;
  const salt = storedHash.slice(7, 29);
  const expectedHash = crypto.pbkdf2Sync(password, salt, 1000, 24, "sha256").toString("base64").slice(0, 31).replace(/\+/g, ".");
  const fullExpected = `${storedHash.slice(0, 29)}${expectedHash}`;
  return storedHash === fullExpected;
}

export function createSessionToken(user: { id: string; username: string; role: string; githubUsername?: string | null }): string {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    githubUsername: user.githubUsername ?? null,
  };

  if (jwt && typeof jwt.sign === "function") {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  }

  // Universal JWT signing with node:crypto
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 86400 })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    if (jwt && typeof jwt.verify === "function") {
      const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;
      if (decoded) return decoded;
    }
    // Universal JWT verification with node:crypto
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload as SessionUser;
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
    } else {
      const isValid = await verifyPassword("pranavadmin@1234", existing.passwordHash);
      if (!isValid) {
        const passwordHash = await hashPassword("pranavadmin@1234");
        await prisma.user.update({
          where: { id: existing.id },
          data: { passwordHash },
        });
      }
    }
  } catch (err) {
    console.error("[CyberShield] Failed to check/seed admin user:", err);
  }
}
