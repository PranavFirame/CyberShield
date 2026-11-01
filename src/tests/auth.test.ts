import { describe, it, expect, beforeAll } from "vitest";
import { ensureAdminUserExists, hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "../lib/auth";
import { prisma } from "../lib/db";

describe("CyberShield Authentication & RBAC Engine", () => {
  beforeAll(async () => {
    await ensureAdminUserExists();
  });

  it("seeds master admin pranavfirame with ADMIN role", async () => {
    const admin = await prisma.user.findUnique({
      where: { username: "pranavfirame" },
    });
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe("ADMIN");
    expect(admin?.username).toBe("pranavfirame");

    // Verify admin password
    const isPasswordValid = await verifyPassword("pranavadmin@1234", admin!.passwordHash);
    expect(isPasswordValid).toBe(true);
  });

  it("hashes passwords securely with bcrypt", async () => {
    const rawPass = "supersecret123";
    const hashed = await hashPassword(rawPass);
    expect(hashed).not.toBe(rawPass);
    expect(hashed.startsWith("$2a$") || hashed.startsWith("$2b$")).toBe(true);

    const valid = await verifyPassword(rawPass, hashed);
    expect(valid).toBe(true);

    const invalid = await verifyPassword("wrongpassword", hashed);
    expect(invalid).toBe(false);
  });

  it("creates and verifies signed JWT session tokens", () => {
    const user = { id: "test-user-id", username: "alice", role: "USER" as const };
    const token = createSessionToken(user);
    expect(token).toBeDefined();

    const decoded = verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.username).toBe("alice");
    expect(decoded?.role).toBe("USER");
  });

  it("registers regular users, allows username updates, and supports self-deletion", async () => {
    const testUsername = "tester_" + Math.random().toString(36).substring(2, 7);
    const passHash = await hashPassword("pass123456");

    // 1. Create user
    const newUser = await prisma.user.create({
      data: {
        username: testUsername,
        passwordHash: passHash,
        role: "USER",
      },
    });
    expect(newUser.id).toBeDefined();
    expect(newUser.role).toBe("USER");

    // 2. Update username
    const updatedUsername = testUsername + "_mod";
    const updated = await prisma.user.update({
      where: { id: newUser.id },
      data: { username: updatedUsername },
    });
    expect(updated.username).toBe(updatedUsername);

    // 3. User updates password
    const newPassHash = await hashPassword("newsecretpass999");
    const passUpdated = await prisma.user.update({
      where: { id: newUser.id },
      data: { passwordHash: newPassHash },
    });
    const checkNewPass = await verifyPassword("newsecretpass999", passUpdated.passwordHash);
    expect(checkNewPass).toBe(true);

    // 4. Delete user
    await prisma.user.delete({
      where: { id: newUser.id },
    });
    const deleted = await prisma.user.findUnique({
      where: { id: newUser.id },
    });
    expect(deleted).toBeNull();
  });

  it("enforces strict scan isolation: User A scans cannot be seen by User B", async () => {
    // Create User A
    const userA = await prisma.user.create({
      data: {
        username: "user_a_" + Math.random().toString(36).substring(2, 6),
        passwordHash: await hashPassword("passA123"),
        role: "USER",
      },
    });

    // Create User B
    const userB = await prisma.user.create({
      data: {
        username: "user_b_" + Math.random().toString(36).substring(2, 6),
        passwordHash: await hashPassword("passB123"),
        role: "USER",
      },
    });

    // User A records a scan
    const scanId = "scan-a-" + Math.random().toString(36).substring(2, 6);
    await prisma.scanRecord.create({
      data: {
        id: scanId,
        userId: userA.id,
        targetType: "REPOSITORY",
        repoUrl: "https://github.com/secret/repo-a",
        repoFullName: "secret/repo-a",
        riskScore: 65,
        durationMs: 1200,
        summaryJson: JSON.stringify({ total: 3, critical: 1, high: 2, medium: 0, low: 0, novelCount: 0 }),
        findingsJson: JSON.stringify([]),
        costModelJson: JSON.stringify({}),
        costAssumptionsJson: JSON.stringify({}),
      },
    });

    // Query scans for User A -> Should return 1 scan
    const userAScans = await prisma.scanRecord.findMany({
      where: { userId: userA.id },
    });
    expect(userAScans.length).toBe(1);
    expect(userAScans[0].repoFullName).toBe("secret/repo-a");

    // Query scans for User B -> MUST return 0 scans (strict privacy)
    const userBScans = await prisma.scanRecord.findMany({
      where: { userId: userB.id },
    });
    expect(userBScans.length).toBe(0);

    // Cleanup
    await prisma.user.delete({ where: { id: userA.id } });
    await prisma.user.delete({ where: { id: userB.id } });
  });

  it("links and persists githubUsername on user profile, included in session JWT", async () => {
    const ghUser = await prisma.user.create({
      data: {
        username: "gh_tester_" + Math.random().toString(36).substring(2, 6),
        passwordHash: await hashPassword("secure123"),
        role: "USER",
        githubUsername: "octocat",
      },
    });

    expect(ghUser.githubUsername).toBe("octocat");

    const token = createSessionToken({
      id: ghUser.id,
      username: ghUser.username,
      role: ghUser.role,
      githubUsername: ghUser.githubUsername,
    });

    const decoded = verifySessionToken(token);
    expect(decoded?.githubUsername).toBe("octocat");

    // Cleanup
    await prisma.user.delete({ where: { id: ghUser.id } });
  });

  it("fetches repositories for GitHub user and verifies structure for 1-click audit", async () => {
    const res = await fetch("https://api.github.com/users/octocat/repos?per_page=5", {
      headers: {
        "User-Agent": "CyberShield-Security-Auditor/1.0",
        Accept: "application/vnd.github.v3+json",
      },
    });

    expect(res.status).toBe(200);
    const repos = await res.json();
    expect(Array.isArray(repos)).toBe(true);
    expect(repos.length).toBeGreaterThan(0);

    const firstRepo = repos[0];
    expect(firstRepo.name).toBeDefined();
    expect(firstRepo.html_url).toMatch(/^https:\/\/github\.com\//);
    expect(typeof firstRepo.stargazers_count).toBe("number");
  });
});
