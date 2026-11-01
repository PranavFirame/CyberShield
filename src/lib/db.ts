import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require("node:sqlite") as {
  DatabaseSync: new (path: string) => any;
};

export interface DbUser {
  id: string;
  username: string;
  email: string | null;
  passwordHash: string;
  role: "USER" | "ADMIN";
  githubUsername?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { scans: number };
}

export interface DbScanRecord {
  id: string;
  userId: string | null;
  targetType: string;
  repoUrl: string;
  repoFullName: string;
  defaultBranch?: string | null;
  commitSha?: string | null;
  riskScore: number;
  durationMs: number;
  summaryJson: string;
  findingsJson: string;
  costModelJson: string;
  costAssumptionsJson: string;
  createdAt: string;
  user?: { username: string; role: string } | null;
}

const dbDir = process.cwd();
const dbPath = path.join(dbDir, "cybershield.db");

type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number };
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Array<Record<string, unknown>>;
  };
};

const globalForDb = globalThis as unknown as {
  sqliteDb: SqliteDatabase | undefined;
};

function getDatabase(): SqliteDatabase {
  if (!globalForDb.sqliteDb) {
    const db = new DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'USER',
        githubUsername TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS scan_records (
        id TEXT PRIMARY KEY,
        userId TEXT,
        targetType TEXT NOT NULL,
        repoUrl TEXT NOT NULL,
        repoFullName TEXT NOT NULL,
        defaultBranch TEXT,
        commitSha TEXT,
        riskScore REAL NOT NULL,
        durationMs INTEGER NOT NULL,
        summaryJson TEXT NOT NULL,
        findingsJson TEXT NOT NULL,
        costModelJson TEXT NOT NULL,
        costAssumptionsJson TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_scans_userId ON scan_records(userId);
      CREATE INDEX IF NOT EXISTS idx_scans_createdAt ON scan_records(createdAt);
    `);

    try {
      db.exec("ALTER TABLE users ADD COLUMN githubUsername TEXT;");
    } catch {
      // Column already exists
    }

    globalForDb.sqliteDb = db;
  }
  return globalForDb.sqliteDb!;
}

export const prisma = {
  user: {
    async findUnique(args: { where: { id?: string; username?: string }; select?: Record<string, unknown> }): Promise<DbUser | null> {
      const db = getDatabase();
      if (args.where.id) {
        const stmt = db.prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
        const row = stmt.get(args.where.id) as unknown as DbUser | undefined;
        return row ?? null;
      }
      if (args.where.username) {
        const stmt = db.prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
        const row = stmt.get(args.where.username) as unknown as DbUser | undefined;
        return row ?? null;
      }
      return null;
    },

    async findFirst(args: {
      where: {
        username?: string;
        email?: string;
        githubUsername?: string;
        id?: { not?: string };
        OR?: Array<{ username?: string; email?: string; githubUsername?: string }>;
      };
    }): Promise<DbUser | null> {
      const db = getDatabase();

      if (args.where.OR && args.where.OR.length > 0) {
        const conditions: string[] = [];
        const params: string[] = [];

        for (const cond of args.where.OR) {
          if (cond.username) {
            conditions.push("username = ?");
            params.push(cond.username);
          }
          if (cond.email) {
            conditions.push("email = ?");
            params.push(cond.email);
          }
          if (cond.githubUsername) {
            conditions.push("githubUsername = ?");
            params.push(cond.githubUsername);
          }
        }

        if (conditions.length > 0) {
          const sql = `SELECT * FROM users WHERE (${conditions.join(" OR ")}) LIMIT 1`;
          const stmt = db.prepare(sql);
          const row = stmt.get(...params) as unknown as DbUser | undefined;
          return row ?? null;
        }
      }

      if (args.where.githubUsername) {
        const stmt = db.prepare("SELECT * FROM users WHERE githubUsername = ? LIMIT 1");
        const row = stmt.get(args.where.githubUsername) as unknown as DbUser | undefined;
        return row ?? null;
      }

      if (args.where.username && args.where.id?.not) {
        const stmt = db.prepare("SELECT * FROM users WHERE username = ? AND id != ? LIMIT 1");
        const row = stmt.get(args.where.username, args.where.id.not) as unknown as DbUser | undefined;
        return row ?? null;
      }

      if (args.where.username) {
        const stmt = db.prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
        const row = stmt.get(args.where.username) as unknown as DbUser | undefined;
        return row ?? null;
      }

      return null;
    },

    async findMany(args?: {
      orderBy?: { createdAt: "asc" | "desc" };
      select?: Record<string, unknown>;
    }): Promise<DbUser[]> {
      const db = getDatabase();
      const sql = `
        SELECT u.*, 
          (SELECT COUNT(*) FROM scan_records WHERE userId = u.id) as scanCount 
        FROM users u 
        ORDER BY u.createdAt DESC
      `;
      const rows = db.prepare(sql).all() as unknown as Array<DbUser & { scanCount: number }>;
      return rows.map((r) => ({
        ...r,
        _count: { scans: Number(r.scanCount) },
      }));
    },

    async create(args: {
      data: {
        username: string;
        email?: string | null;
        passwordHash: string;
        role?: "USER" | "ADMIN";
        githubUsername?: string | null;
      };
    }): Promise<DbUser> {
      const db = getDatabase();
      const id = "usr_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      const now = new Date().toISOString();
      const role = args.data.role ?? "USER";
      const email = args.data.email ?? null;
      const githubUsername = args.data.githubUsername ?? null;

      const stmt = db.prepare(`
        INSERT INTO users (id, username, email, passwordHash, role, githubUsername, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, args.data.username, email, args.data.passwordHash, role, githubUsername, now, now);

      return {
        id,
        username: args.data.username,
        email,
        passwordHash: args.data.passwordHash,
        role,
        githubUsername,
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(args: {
      where: { id: string };
      data: { username?: string; passwordHash?: string; githubUsername?: string | null };
      select?: Record<string, unknown>;
    }): Promise<DbUser> {
      const db = getDatabase();
      const now = new Date().toISOString();
      const sets: string[] = ["updatedAt = ?"];
      const params: (string | null)[] = [now];

      if (args.data.username !== undefined) {
        sets.push("username = ?");
        params.push(args.data.username);
      }
      if (args.data.passwordHash !== undefined) {
        sets.push("passwordHash = ?");
        params.push(args.data.passwordHash);
      }
      if (args.data.githubUsername !== undefined) {
        sets.push("githubUsername = ?");
        params.push(args.data.githubUsername);
      }

      params.push(args.where.id);
      const sql = `UPDATE users SET ${sets.join(", ")} WHERE id = ?`;
      db.prepare(sql).run(...params);

      const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(args.where.id) as unknown as DbUser;
      return updated;
    },

    async delete(args: { where: { id: string } }): Promise<void> {
      const db = getDatabase();
      db.prepare("DELETE FROM users WHERE id = ?").run(args.where.id);
    },
  },

  scanRecord: {
    async findUnique(args: { where: { id: string } }): Promise<DbScanRecord | null> {
      const db = getDatabase();
      const row = db.prepare("SELECT * FROM scan_records WHERE id = ? LIMIT 1").get(args.where.id) as unknown as DbScanRecord | undefined;
      return row ?? null;
    },

    async findMany(args?: {
      where?: { userId?: string | null };
      orderBy?: { createdAt: "desc" };
      take?: number;
      include?: { user?: boolean };
    }): Promise<DbScanRecord[]> {
      const db = getDatabase();
      const limit = args?.take ?? 50;

      let sql: string;
      let params: (string | number)[] = [];

      if (args?.where && "userId" in args.where) {
        if (args.where.userId === null) {
          sql = `
            SELECT s.*, u.username as u_username, u.role as u_role 
            FROM scan_records s 
            LEFT JOIN users u ON s.userId = u.id 
            WHERE s.userId IS NULL 
            ORDER BY s.createdAt DESC LIMIT ?
          `;
          params = [limit];
        } else {
          sql = `
            SELECT s.*, u.username as u_username, u.role as u_role 
            FROM scan_records s 
            LEFT JOIN users u ON s.userId = u.id 
            WHERE s.userId = ? 
            ORDER BY s.createdAt DESC LIMIT ?
          `;
          params = [args.where.userId ?? "", limit];
        }
      } else {
        sql = `
          SELECT s.*, u.username as u_username, u.role as u_role 
          FROM scan_records s 
          LEFT JOIN users u ON s.userId = u.id 
          ORDER BY s.createdAt DESC LIMIT ?
        `;
        params = [limit];
      }

      const rows = db.prepare(sql).all(...params) as unknown as Array<DbScanRecord & { u_username?: string; u_role?: string }>;
      return rows.map((r) => ({
        ...r,
        user: r.u_username ? { username: r.u_username, role: r.u_role ?? "USER" } : null,
      }));
    },

    async create(args: {
      data: {
        id: string;
        userId?: string | null;
        targetType: string;
        repoUrl: string;
        repoFullName: string;
        defaultBranch?: string | null;
        commitSha?: string | null;
        riskScore: number;
        durationMs: number;
        summaryJson: string;
        findingsJson: string;
        costModelJson: string;
        costAssumptionsJson: string;
      };
    }): Promise<DbScanRecord> {
      const db = getDatabase();
      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO scan_records (
          id, userId, targetType, repoUrl, repoFullName, defaultBranch, commitSha,
          riskScore, durationMs, summaryJson, findingsJson, costModelJson, costAssumptionsJson, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        args.data.id,
        args.data.userId ?? null,
        args.data.targetType,
        args.data.repoUrl,
        args.data.repoFullName,
        args.data.defaultBranch ?? null,
        args.data.commitSha ?? null,
        args.data.riskScore,
        args.data.durationMs,
        args.data.summaryJson,
        args.data.findingsJson,
        args.data.costModelJson,
        args.data.costAssumptionsJson,
        now
      );

      return {
        ...args.data,
        userId: args.data.userId ?? null,
        createdAt: now,
      };
    },

    async delete(args: { where: { id: string } }): Promise<void> {
      const db = getDatabase();
      db.prepare("DELETE FROM scan_records WHERE id = ?").run(args.where.id);
    },
  },
};
