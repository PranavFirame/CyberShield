import path from "path";
import fs from "fs";
import { createRequire } from "module";

// Safely resolve node:sqlite if available (Node >= 22.5); otherwise use universal fallback
let DatabaseSync: any = null;
try {
  const req = createRequire(import.meta.url);
  const sqlite = req("node:sqlite");
  DatabaseSync = sqlite?.DatabaseSync || null;
} catch {
  // node:sqlite is not available (e.g. Node 18/20 or restricted runtime). Universal fallback will be used.
  DatabaseSync = null;
}

export interface DbUser {
  id: string;
  username: string;
  email: string | null;
  passwordHash: string;
  role: "USER" | "ADMIN";
  githubUsername: string | null;
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
  defaultBranch: string | null;
  commitSha: string | null;
  riskScore: number;
  durationMs: number;
  summaryJson: string;
  findingsJson: string;
  costModelJson: string;
  costAssumptionsJson: string;
  createdAt: string;
}

export interface DbArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  authorName: string;
  authorRole: string;
  readingTimeMinutes: number;
  coverImage: string | null;
  status: "DRAFT" | "PUBLISHED";
  canonicalUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  orderIndex: number;
  isPublished: number;
  isFeatured: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbNewsletterSubscriber {
  id: string;
  email: string;
  status: "ACTIVE" | "UNSUBSCRIBED";
  consentGiven: number;
  consentTimestamp: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

const globalForDb = globalThis as unknown as {
  sqliteDb?: SqliteDatabase;
};

export function createFallbackDatabase(customPath?: string): SqliteDatabase {
  const filePath = customPath || path.resolve(process.cwd(), "cybershield-store.json");
  const isMemory = filePath === ":memory:";

  let data: Record<string, any[]> = {
    users: [],
    scan_records: [],
    articles: [],
    faqs: [],
    newsletter_subscribers: [],
  };

  if (!isMemory && fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  const save = () => {
    if (!isMemory) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      } catch {}
    }
  };

  return {
    exec(_sql: string) {
      // DDL operations are safe no-ops in fallback store
    },
    prepare(sql: string) {
      const trimmed = sql.trim().replace(/\s+/g, " ");

      // INSERT
      const insertMatch = trimmed.match(/^INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES/i);
      if (insertMatch) {
        const table = insertMatch[1];
        const cols = insertMatch[2].split(",").map((c) => c.trim());
        if (!data[table]) data[table] = [];

        return {
          run(...params: unknown[]) {
            const row: Record<string, unknown> = {};
            cols.forEach((col, idx) => {
              row[col] = params[idx];
            });
            if (table === "users" && row.username) {
              const idx = data.users.findIndex((u) => u.username === row.username);
              if (idx >= 0) data.users[idx] = row;
              else data.users.push(row);
            } else if (table === "newsletter_subscribers" && row.email) {
              const idx = data.newsletter_subscribers.findIndex((s) => s.email === row.email);
              if (idx >= 0) data.newsletter_subscribers[idx] = row;
              else data.newsletter_subscribers.push(row);
            } else {
              data[table].push(row);
            }
            save();
            return { changes: 1, lastInsertRowid: data[table].length };
          },
          get() { return undefined; },
          all() { return []; },
        };
      }

      // DELETE
      const deleteMatch = trimmed.match(/^DELETE FROM (\w+)(?:\s+WHERE\s+(\w+)\s*=\s*\?)?/i);
      if (deleteMatch) {
        const table = deleteMatch[1];
        const col = deleteMatch[2];
        if (!data[table]) data[table] = [];

        return {
          run(...params: unknown[]) {
            if (col && params.length > 0) {
              const val = params[0];
              const before = data[table].length;
              data[table] = data[table].filter((r) => r[col] !== val);
              save();
              return { changes: before - data[table].length, lastInsertRowid: 0 };
            }
            data[table] = [];
            save();
            return { changes: 1, lastInsertRowid: 0 };
          },
          get() { return undefined; },
          all() { return []; },
        };
      }

      // UPDATE: linear parsing without ReDoS backtracking risk
      if (trimmed.toUpperCase().startsWith("UPDATE ")) {
        const whereIdx = trimmed.toUpperCase().lastIndexOf(" WHERE ");
        if (whereIdx !== -1) {
          const beforeWhere = trimmed.slice(0, whereIdx);
          const afterWhere = trimmed.slice(whereIdx + 7).trim();
          const matchBefore = beforeWhere.match(/^UPDATE\s+(\w+)\s+SET\s+([^;]+)$/i);
          const matchAfter = afterWhere.match(/^(\w+)\s*=\s*\?$/i);
          if (matchBefore && matchAfter) {
            const table = matchBefore[1];
            const setCols = matchBefore[2].split(",").map((s) => s.trim().split("=")[0].trim());
            const whereCol = matchAfter[1];
            if (!data[table]) data[table] = [];

            return {
              run(...params: unknown[]) {
                const whereVal = params[params.length - 1];
                const setVals = params.slice(0, params.length - 1);
                let changes = 0;
                data[table].forEach((row) => {
                  if (row[whereCol] === whereVal) {
                    setCols.forEach((col, idx) => {
                      row[col] = setVals[idx];
                    });
                    changes++;
                  }
                });
                if (changes > 0) save();
                return { changes, lastInsertRowid: 0 };
              },
              get() { return undefined; },
              all() { return []; },
            };
          }
        }
      }

      // SELECT
      const table = trimmed.match(/FROM (\w+)/i)?.[1] || "users";
      if (!data[table]) data[table] = [];

      const executeQuery = (params: unknown[]) => {
        let rows = [...(data[table] || [])];

        if (trimmed.includes("WHERE")) {
          if (trimmed.includes("githubUsername = ?")) {
            rows = rows.filter((r) => r.githubUsername === params[0]);
          } else if (trimmed.includes("username = ? AND id != ?")) {
            rows = rows.filter((r) => r.username === params[0] && r.id !== params[1]);
          } else if (trimmed.includes("isPublished = 1") || trimmed.includes("isPublished = ?")) {
            rows = rows.filter((r) => r.isPublished === 1 || r.isPublished === true);
          } else if (trimmed.includes("username = ? OR email = ?")) {
            const orTerms = trimmed.match(/(\w+) = \?/g)?.map(t => t.split(" ")[0]) || [];
            rows = rows.filter((r) => orTerms.some((col, idx) => r[col] && r[col] === params[idx]));
          } else if (trimmed.includes("id = ?")) {
            rows = rows.filter((r) => r.id === params[0]);
          } else if (trimmed.includes("username = ?")) {
            rows = rows.filter((r) => r.username === params[0]);
          } else if (trimmed.includes("slug = ?")) {
            rows = rows.filter((r) => r.slug === params[0]);
          } else if (trimmed.includes("email = ?")) {
            rows = rows.filter((r) => r.email === params[0]);
          } else if (trimmed.includes("userId = ?")) {
            rows = rows.filter((r) => r.userId === params[0]);
          } else if (trimmed.includes("status = ?")) {
            rows = rows.filter((r) => r.status === params[0]);
          }
        }

        if (/ORDER BY orderIndex ASC/i.test(trimmed)) {
          rows.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        } else if (/ORDER BY (?:createdAt|publishedAt) DESC/i.test(trimmed)) {
          rows.sort((a, b) => new Date(b.createdAt || b.publishedAt || 0).getTime() - new Date(a.createdAt || a.publishedAt || 0).getTime());
        }

        if (/LIMIT 1/i.test(trimmed)) {
          rows = rows.slice(0, 1);
        } else if (/LIMIT \?/i.test(trimmed)) {
          const limitVal = Number(params[params.length - 1]);
          if (!isNaN(limitVal)) rows = rows.slice(0, limitVal);
        }

        return rows;
      };

      return {
        run() { return { changes: 0, lastInsertRowid: 0 }; },
        get(...params: unknown[]) {
          const res = executeQuery(params);
          return res.length > 0 ? { ...res[0] } : undefined;
        },
        all(...params: unknown[]) {
          return executeQuery(params).map((r) => ({ ...r }));
        },
      };
    },
  };
}

export function getDatabase(): SqliteDatabase {
  if (!globalForDb.sqliteDb) {
    if (DatabaseSync) {
      try {
        const dbPath = path.resolve(process.cwd(), "cybershield.db");
        const db = new DatabaseSync(dbPath) as unknown as SqliteDatabase;

        // Enable WAL mode for high concurrency
        db.exec("PRAGMA journal_mode = WAL;");
        db.exec("PRAGMA busy_timeout = 5000;");
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

          CREATE TABLE IF NOT EXISTS articles (
            id TEXT PRIMARY KEY,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            tagsJson TEXT NOT NULL DEFAULT '[]',
            authorName TEXT NOT NULL,
            authorRole TEXT NOT NULL,
            readingTimeMinutes INTEGER NOT NULL DEFAULT 5,
            coverImage TEXT,
            status TEXT NOT NULL DEFAULT 'PUBLISHED',
            canonicalUrl TEXT,
            publishedAt TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          );

          CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
          CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
          CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

          CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            consentGiven INTEGER NOT NULL DEFAULT 1,
            consentTimestamp TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'landing',
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          );

          CREATE INDEX IF NOT EXISTS idx_subscribers_email ON newsletter_subscribers(email);

          CREATE TABLE IF NOT EXISTS faqs (
            id TEXT PRIMARY KEY,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            category TEXT NOT NULL,
            orderIndex INTEGER NOT NULL DEFAULT 0,
            isPublished INTEGER NOT NULL DEFAULT 1,
            isFeatured INTEGER NOT NULL DEFAULT 0,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          );

          CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
          CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs(orderIndex);
        `);

        try {
          db.exec("ALTER TABLE users ADD COLUMN githubUsername TEXT;");
        } catch {
          // Column already exists
        }

        globalForDb.sqliteDb = db;
        return globalForDb.sqliteDb;
      } catch (e) {
        console.warn("node:sqlite failed to initialize, using fallback database:", e);
      }
    }

    // Universal fallback store (works across Node 18, 20, 22 on all hosts)
    globalForDb.sqliteDb = createFallbackDatabase();
  }
  return globalForDb.sqliteDb!;
}

export const prisma = {
  user: {
    async findUnique(args: { where: { id?: string; username?: string }; select?: Record<string, unknown> }): Promise<DbUser | null> {
      const db = getDatabase();
      if (args.where.id) {
        const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
        const row = stmt.get(args.where.id) as unknown as DbUser | undefined;
        return row ?? null;
      }
      if (args.where.username) {
        const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
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
    async findMany(args: {
      where: { userId?: string | null };
      orderBy?: { createdAt: "desc" | "asc" };
      take?: number;
    }): Promise<DbScanRecord[]> {
      const db = getDatabase();
      let sql = "SELECT * FROM scan_records";
      const params: unknown[] = [];

      if (args.where.userId !== undefined) {
        if (args.where.userId === null) {
          sql += " WHERE userId IS NULL";
        } else {
          sql += " WHERE userId = ?";
          params.push(args.where.userId);
        }
      }

      sql += " ORDER BY createdAt DESC";
      if (args.take) {
        sql += ` LIMIT ${args.take}`;
      }

      const rows = db.prepare(sql).all(...params) as unknown as DbScanRecord[];
      return rows;
    },

    async findUnique(args: { where: { id: string } }): Promise<DbScanRecord | null> {
      const db = getDatabase();
      const stmt = db.prepare("SELECT * FROM scan_records WHERE id = ?");
      const row = stmt.get(args.where.id) as unknown as DbScanRecord | undefined;
      return row ?? null;
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
        defaultBranch: args.data.defaultBranch ?? null,
        commitSha: args.data.commitSha ?? null,
        userId: args.data.userId ?? null,
        createdAt: now,
      };
    },

    async delete(args: { where: { id: string } }): Promise<void> {
      const db = getDatabase();
      db.prepare("DELETE FROM scan_records WHERE id = ?").run(args.where.id);
    },
  },

  article: {
    async findUnique(args: { where: { id?: string; slug?: string } }): Promise<DbArticle | null> {
      const db = getDatabase();
      let row: Record<string, unknown> | undefined;
      if (args.where.slug) {
        row = db.prepare("SELECT * FROM articles WHERE slug = ?").get(args.where.slug) as Record<string, unknown> | undefined;
      } else if (args.where.id) {
        row = db.prepare("SELECT * FROM articles WHERE id = ?").get(args.where.id) as Record<string, unknown> | undefined;
      }
      if (!row) return null;
      return {
        ...row,
        tags: JSON.parse((row.tagsJson as string) || "[]"),
      } as unknown as DbArticle;
    },

    async findMany(args?: {
      where?: { status?: "DRAFT" | "PUBLISHED"; category?: string; search?: string };
      orderBy?: { publishedAt?: "asc" | "desc"; createdAt?: "asc" | "desc" };
      take?: number;
    }): Promise<DbArticle[]> {
      const db = getDatabase();
      let sql = "SELECT * FROM articles";
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (args?.where?.status) {
        conditions.push("status = ?");
        params.push(args.where.status);
      }
      if (args?.where?.category && args.where.category !== "ALL") {
        conditions.push("category = ?");
        params.push(args.where.category);
      }
      if (args?.where?.search) {
        conditions.push("(title LIKE ? OR summary LIKE ? OR content LIKE ?)");
        const q = `%${args.where.search}%`;
        params.push(q, q, q);
      }

      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }

      sql += " ORDER BY publishedAt DESC, createdAt DESC";

      if (args?.take) {
        sql += ` LIMIT ${args.take}`;
      }

      const rows = db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
      return rows.map((r) => ({
        ...r,
        tags: JSON.parse((r.tagsJson as string) || "[]"),
      })) as unknown as DbArticle[];
    },

    async create(args: {
      data: {
        slug: string;
        title: string;
        summary: string;
        content: string;
        category: string;
        tags?: string[];
        authorName?: string;
        authorRole?: string;
        readingTimeMinutes?: number;
        coverImage?: string | null;
        status?: "DRAFT" | "PUBLISHED";
        canonicalUrl?: string | null;
        publishedAt?: string | null;
      };
    }): Promise<DbArticle> {
      const db = getDatabase();
      const id = "art_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      const now = new Date().toISOString();
      const tags = args.data.tags || [];
      const authorName = args.data.authorName || "CyberShield Security Research";
      const authorRole = args.data.authorRole || "Core Research Team";
      const readingTimeMinutes = args.data.readingTimeMinutes || Math.max(1, Math.ceil(args.data.content.split(/\s+/).length / 200));
      const status = args.data.status || "PUBLISHED";
      const publishedAt = status === "PUBLISHED" ? (args.data.publishedAt || now) : null;

      const stmt = db.prepare(`
        INSERT INTO articles (
          id, slug, title, summary, content, category, tagsJson,
          authorName, authorRole, readingTimeMinutes, coverImage,
          status, canonicalUrl, publishedAt, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        args.data.slug,
        args.data.title,
        args.data.summary,
        args.data.content,
        args.data.category,
        JSON.stringify(tags),
        authorName,
        authorRole,
        readingTimeMinutes,
        args.data.coverImage ?? null,
        status,
        args.data.canonicalUrl ?? `https://cybershield.dev/blog/${args.data.slug}`,
        publishedAt,
        now,
        now
      );

      return {
        id,
        slug: args.data.slug,
        title: args.data.title,
        summary: args.data.summary,
        content: args.data.content,
        category: args.data.category,
        tags,
        authorName,
        authorRole,
        readingTimeMinutes,
        coverImage: args.data.coverImage ?? null,
        status,
        canonicalUrl: args.data.canonicalUrl ?? `https://cybershield.dev/blog/${args.data.slug}`,
        publishedAt,
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(args: {
      where: { id?: string; slug?: string };
      data: Partial<DbArticle>;
    }): Promise<DbArticle> {
      const db = getDatabase();
      const existing = await prisma.article.findUnique({ where: args.where });
      if (!existing) throw new Error("Article not found");

      const now = new Date().toISOString();
      const sets: string[] = ["updatedAt = ?"];
      const params: unknown[] = [now];

      if (args.data.title !== undefined) { sets.push("title = ?"); params.push(args.data.title); }
      if (args.data.summary !== undefined) { sets.push("summary = ?"); params.push(args.data.summary); }
      if (args.data.content !== undefined) {
        sets.push("content = ?"); params.push(args.data.content);
        sets.push("readingTimeMinutes = ?");
        params.push(Math.max(1, Math.ceil(args.data.content.split(/\s+/).length / 200)));
      }
      if (args.data.category !== undefined) { sets.push("category = ?"); params.push(args.data.category); }
      if (args.data.tags !== undefined) { sets.push("tagsJson = ?"); params.push(JSON.stringify(args.data.tags)); }
      if (args.data.status !== undefined) {
        sets.push("status = ?"); params.push(args.data.status);
        if (args.data.status === "PUBLISHED" && !existing.publishedAt) {
          sets.push("publishedAt = ?"); params.push(now);
        }
      }
      if (args.data.coverImage !== undefined) { sets.push("coverImage = ?"); params.push(args.data.coverImage); }
      if (args.data.canonicalUrl !== undefined) { sets.push("canonicalUrl = ?"); params.push(args.data.canonicalUrl); }

      params.push(existing.id);
      db.prepare(`UPDATE articles SET ${sets.join(", ")} WHERE id = ?`).run(...params);
      return (await prisma.article.findUnique({ where: { id: existing.id } }))!;
    },

    async delete(args: { where: { id?: string; slug?: string } }): Promise<void> {
      const db = getDatabase();
      if (args.where.id) {
        db.prepare("DELETE FROM articles WHERE id = ?").run(args.where.id);
      } else if (args.where.slug) {
        db.prepare("DELETE FROM articles WHERE slug = ?").run(args.where.slug);
      }
    },
  },

  faq: {
    async findMany(args?: {
      where?: { category?: string; isPublished?: number };
      orderBy?: { orderIndex?: "asc" | "desc" };
    }): Promise<DbFaq[]> {
      const db = getDatabase();
      let sql = "SELECT * FROM faqs";
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (args?.where?.category && args.where.category !== "ALL") {
        conditions.push("category = ?");
        params.push(args.where.category);
      }
      if (args?.where?.isPublished !== undefined) {
        conditions.push("isPublished = ?");
        params.push(args.where.isPublished);
      }

      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }

      sql += " ORDER BY orderIndex ASC, createdAt ASC";
      return db.prepare(sql).all(...params) as unknown as DbFaq[];
    },

    async findUnique(args: { where: { id: string } }): Promise<DbFaq | null> {
      const db = getDatabase();
      const row = db.prepare("SELECT * FROM faqs WHERE id = ?").get(args.where.id) as DbFaq | undefined;
      return row ?? null;
    },

    async create(args: {
      data: {
        question: string;
        answer: string;
        category: string;
        orderIndex?: number;
        isPublished?: number;
        isFeatured?: number;
      };
    }): Promise<DbFaq> {
      const db = getDatabase();
      const id = "faq_" + Math.random().toString(36).substring(2, 9);
      const now = new Date().toISOString();
      const orderIndex = args.data.orderIndex ?? 0;
      const isPublished = args.data.isPublished ?? 1;
      const isFeatured = args.data.isFeatured ?? 0;

      const stmt = db.prepare(`
        INSERT INTO faqs (id, question, answer, category, orderIndex, isPublished, isFeatured, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, args.data.question, args.data.answer, args.data.category, orderIndex, isPublished, isFeatured, now, now);

      return {
        id,
        question: args.data.question,
        answer: args.data.answer,
        category: args.data.category,
        orderIndex,
        isPublished,
        isFeatured,
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(args: {
      where: { id: string };
      data: Partial<DbFaq>;
    }): Promise<DbFaq> {
      const db = getDatabase();
      const now = new Date().toISOString();
      const sets: string[] = ["updatedAt = ?"];
      const params: unknown[] = [now];

      if (args.data.question !== undefined) { sets.push("question = ?"); params.push(args.data.question); }
      if (args.data.answer !== undefined) { sets.push("answer = ?"); params.push(args.data.answer); }
      if (args.data.category !== undefined) { sets.push("category = ?"); params.push(args.data.category); }
      if (args.data.orderIndex !== undefined) { sets.push("orderIndex = ?"); params.push(args.data.orderIndex); }
      if (args.data.isPublished !== undefined) { sets.push("isPublished = ?"); params.push(args.data.isPublished); }
      if (args.data.isFeatured !== undefined) { sets.push("isFeatured = ?"); params.push(args.data.isFeatured); }

      params.push(args.where.id);
      db.prepare(`UPDATE faqs SET ${sets.join(", ")} WHERE id = ?`).run(...params);
      return (await prisma.faq.findUnique({ where: { id: args.where.id } }))!;
    },

    async delete(args: { where: { id: string } }): Promise<void> {
      const db = getDatabase();
      db.prepare("DELETE FROM faqs WHERE id = ?").run(args.where.id);
    },
  },

  newsletterSubscriber: {
    async findUnique(args: { where: { email: string } }): Promise<DbNewsletterSubscriber | null> {
      const db = getDatabase();
      const row = db.prepare("SELECT * FROM newsletter_subscribers WHERE email = ?").get(args.where.email.toLowerCase().trim()) as DbNewsletterSubscriber | undefined;
      return row ?? null;
    },

    async findMany(args?: { where?: { status?: string } }): Promise<DbNewsletterSubscriber[]> {
      const db = getDatabase();
      let sql = "SELECT * FROM newsletter_subscribers";
      const params: unknown[] = [];
      if (args?.where?.status) {
        sql += " WHERE status = ?";
        params.push(args.where.status);
      }
      sql += " ORDER BY createdAt DESC";
      return db.prepare(sql).all(...params) as unknown as DbNewsletterSubscriber[];
    },

    async create(args: {
      data: {
        email: string;
        source?: string;
        consentGiven?: number;
      };
    }): Promise<DbNewsletterSubscriber> {
      const db = getDatabase();
      const id = "sub_" + Math.random().toString(36).substring(2, 9);
      const email = args.data.email.toLowerCase().trim();
      const now = new Date().toISOString();
      const source = args.data.source || "landing";
      const consentGiven = args.data.consentGiven ?? 1;

      const stmt = db.prepare(`
        INSERT INTO newsletter_subscribers (id, email, status, consentGiven, consentTimestamp, source, createdAt, updatedAt)
        VALUES (?, ?, 'ACTIVE', ?, ?, ?, ?, ?)
      `);
      stmt.run(id, email, consentGiven, now, source, now, now);

      return {
        id,
        email,
        status: "ACTIVE",
        consentGiven,
        consentTimestamp: now,
        source,
        createdAt: now,
        updatedAt: now,
      };
    },

    async update(args: {
      where: { email: string };
      data: Partial<DbNewsletterSubscriber>;
    }): Promise<DbNewsletterSubscriber> {
      const db = getDatabase();
      const now = new Date().toISOString();
      const email = args.where.email.toLowerCase().trim();
      const sets: string[] = ["updatedAt = ?"];
      const params: unknown[] = [now];

      if (args.data.status !== undefined) { sets.push("status = ?"); params.push(args.data.status); }
      if (args.data.consentGiven !== undefined) { sets.push("consentGiven = ?"); params.push(args.data.consentGiven); }

      params.push(email);
      db.prepare(`UPDATE newsletter_subscribers SET ${sets.join(", ")} WHERE email = ?`).run(...params);
      return (await prisma.newsletterSubscriber.findUnique({ where: { email } }))!;
    },
  },
};

/**
 * Automatically seeds authoritative cybersecurity articles and comprehensive 12-category FAQs.
 */
export async function ensureContentSeeded(): Promise<void> {
  const existingArticles = await prisma.article.findMany();
  if (existingArticles.length === 0) {
    const seedArticles = [
      {
        slug: "ast-taint-tracking-novel-vulnerability-detection",
        title: "AST Taint Tracking: How CyberShield Discovers Unlisted Zero-Day Flaws in Public Codebases",
        category: "Vulnerability Research",
        tags: ["AST", "Taint Analysis", "Zero-Day", "SAST", "Novel Bugs"],
        authorName: "Dr. Evelyn Vance",
        authorRole: "Principal Security Researcher, CyberShield",
        readingTimeMinutes: 7,
        summary: "Traditional regex pattern scanners fail when attackers obfuscate sinks or route payloads across middleware boundaries. Here is how AST call-graph taint propagation exposes hidden path traversal, prototype pollution, and command injection.",
        content: `### The Limits of Lexical Scanning in Modern Web Code

For decades, static application security testing (SAST) relied on regex pattern matching and token lexing. While effective for obvious misconfigurations like hardcoded API tokens or trivial dynamic execution calls, lexical scanners fall short in production architectures.

In complex Node.js, Python, or Go codebases, user input traverses multiple router hooks, validation layers, parameter destructurings, and helper utilities before reaching a dangerous execution sink.

\`\`\`javascript
// A classic multi-hop taint trace undetectable by naive regex
app.get('/download', (req, res) => {
  const payload = req.query.doc;
  const normalized = safeDecode(payload); // Looks safe lexically!
  fetchDocument(normalized, res);
});

function safeDecode(val) {
  // Flaw: double-decoding can re-introduce path traversal
  return decodeURIComponent(val || '');
}

function fetchDocument(target, res) {
  // Dangerous sink: fs.readFileSync with tainted target
  const filepath = path.join(BASE_STORAGE, target);
  res.send(fs.readFileSync(filepath, 'utf8'));
}
\`\`\`

### How CyberShield's Dual Engine Operates

CyberShield eliminates this blindspot using a dual defensive architecture:

1. **Engine 1 (Baseline Ingestion & Known CVE Mapping)**: Inspects lockfiles, manifest dependencies, and structural configurations against the authoritative OSV, GitHub Advisory, and NVD vulnerability datasets.
2. **Engine 2 (Interprocedural AST Taint Graph)**: Parses code into an Abstract Syntax Tree (AST), maps all user-controlled sources (such as \`req.body\`, \`req.query\`, \`req.headers\`), and models propagation edges through assignments and function invocations down to dangerous sinks (\`fs.read\`, \`child_process.exec\`, \`db.query\`).

### Concrete Remediation

Remediation requires path containment checks rather than basic string matching:

\`\`\`javascript
const resolvedPath = path.resolve(BASE_STORAGE, target);
if (!resolvedPath.startsWith(BASE_STORAGE)) {
  throw new Error("Security Violation: Path Traversal Attempt Detected");
}
\`\`\`

By coupling AST dataflow analysis with worst-case disaster exposure models, security engineering teams gain concrete diffs rather than theoretical alerts.`,
      },
      {
        slug: "defending-prototype-pollution-javascript-ecosystem",
        title: "Deep Dive: Eradicating Prototype Pollution in Modern Node.js Ecosystems",
        category: "Application Security",
        tags: ["Node.js", "JavaScript", "Prototype Pollution", "AppSec", "Remediation"],
        authorName: "Marcus Sterling",
        authorRole: "AppSec Lead, CyberShield",
        readingTimeMinutes: 6,
        summary: "Deep-merge utilities and object recursive assignment functions remain prime targets for object prototype poisoning. Learn the underlying AST execution mechanisms and how to immunize your microservices.",
        content: `### Understanding Object Prototype Pollution

In JavaScript, objects inherit properties and methods from their prototype chain. If an application merges untrusted JSON objects into existing server state without sanitizing keys like \`__proto__\`, \`constructor\`, or \`prototype\`, an attacker can inject arbitrary attributes into \`Object.prototype\`.

This creates widespread application malfunctions, authentication bypasses, or in severe scenarios, remote code execution (RCE) via gadget chains.

\`\`\`javascript
// Vulnerable recursive merge pattern
function deepMerge(target, source) {
  for (let key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]); // Dangerous: accepts __proto__!
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
\`\`\`

### The Attack Vector

When an attacker supplies:
\`\`\`json
{
  "__proto__": {
    "isAdmin": true
  }
}
\`\`\`
Every subsequent newly created object \`{}\` will inherit \`isAdmin = true\`, bypassing role authorization checks throughout the application.

### Defensive Engineering Best Practices

1. **Denylist Dangerous Properties**: Explicitly reject keys matching \`__proto__\`, \`constructor\`, or \`prototype\`.
2. **Use Prototypeless Objects**: Instantiate dictionaries with \`Object.create(null)\` where inheritance is not required.
3. **Freeze Built-in Prototypes**: In security-critical environments, execute \`Object.freeze(Object.prototype)\` during process bootstrap.
4. **Use Maps Instead of Plain Objects**: Use ES6 \`Map\` structures for arbitrary user key-value storage.`,
      },
      {
        slug: "securing-rest-and-graphql-apis",
        title: "Ethical API Security: Securing Broken Object Level Authorization (BOLA)",
        category: "API Security",
        tags: ["API Security", "BOLA", "OWASP API #1", "Authorization", "GraphQL"],
        authorName: "Amina Patel",
        authorRole: "Head of Ethical Security, CyberShield",
        readingTimeMinutes: 5,
        summary: "Broken Object Level Authorization (BOLA) remains the #1 vulnerability on the OWASP API Top 10. Discover how to enforce strict tenant scoping and zero-trust parameter validation.",
        content: `### Why BOLA Tops the OWASP API Threat Matrix

Broken Object Level Authorization occurs when an API endpoint accepts an object identifier from user input (e.g. \`/api/orders/9842\`) and performs state changes or retrieves sensitive records without verifying whether the requesting user owns or has access to that specific entity.

Attackers simply enumerate numerical or UUID keys to siphon data across company and user boundaries.

### The Anti-Pattern vs The Secure Standard

\`\`\`javascript
// VULNERABLE: Only verifies if user is signed in, NOT tenant boundary
app.get('/api/invoices/:id', authenticateUser, async (req, res) => {
  const invoice = await db.invoices.findById(req.params.id);
  res.json(invoice);
});

// SECURE: Enforces tenant scoping directly in the query
app.get('/api/invoices/:id', authenticateUser, async (req, res) => {
  const invoice = await db.invoices.findOne({
    id: req.params.id,
    organizationId: req.user.organizationId // Scoped to tenant
  });
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  res.json(invoice);
});
\`\`\`

### Key Architectural Guidelines

- Always embed tenant context inside server-signed session tokens or claims.
- Never trust client-supplied tenant identifiers in request payloads.
- Audit all database queries with automated test assertions ensuring foreign-key scoping.`,
      },
      {
        slug: "financial-risk-modeling-cybersecurity",
        title: "From CVSS Scores to Boardroom Reality: Modeling Worst-Case Disaster Exposure",
        category: "DevSecOps",
        tags: ["Risk Intelligence", "Disaster Model", "Financial Impact", "Boardroom", "ROI"],
        authorName: "Marcus Sterling",
        authorRole: "AppSec Lead, CyberShield",
        readingTimeMinutes: 5,
        summary: "Executives do not buy CVSS 7.8 metrics; they evaluate business continuity, regulatory fines, and downtime cost per hour. Here is the math behind CyberShield's financial risk engine.",
        content: `### Bridging the CISO-CFO Communication Gap

For years, cybersecurity teams presented vulnerabilities as abstract numerical scores: *\"We discovered 3 Critical CVEs with base score 9.1.\"*

While useful for vulnerability coordinators, board members and CFOs need answers to business-critical questions:
- What is our financial exposure if this flaw is exploited?
- How much downtime will an uncontained incident trigger?
- What are the regulatory and customer notification liabilities?

### The CyberShield Disaster Formulation

CyberShield translates technical findings into financial risk projections using five customizable parameters:

1. **Records at Risk**: Volume of customer PII, tokens, or financial records accessible from the database or file storage.
2. **Per-Record Breach Liability**: Average forensic, legal, and identity-monitoring cost (\$165 - \$240 based on industry metrics).
3. **Estimated Downtime Duration**: Typical operational freeze required for eradication and database backup restoration (average 3 to 5 business days).
4. **Daily Operational Cost of Downtime**: Lost revenue and engineering diversion.
5. **Regulatory Fines & Incident Response Overhead**: Percentage multiplier accounting for GDPR, CCPA, or HIPAA disclosures.

By transforming abstract bug reports into concrete financial ranges, security leaders can justify remediation budgets and prioritize high-exposure codebases.`,
      },
      {
        slug: "supply-chain-security-osv-dependencies",
        title: "Dependency Security in 2026: Why Lockfile Auditing Alone Is Not Enough",
        category: "Dependency Security",
        tags: ["Supply Chain", "SCA", "OSV", "NPM", "Lockfile"],
        authorName: "Dr. Evelyn Vance",
        authorRole: "Principal Security Researcher, CyberShield",
        readingTimeMinutes: 6,
        summary: "Typosquatting, compromised maintainer credentials, and unpinned transitive dependencies make modern open-source supply chains fragile. Learn how to construct resilient dependency defense.",
        content: `### The Modern Software Supply Chain Dilemma

The average modern web application imports between 800 and 1,500 third-party packages across its transitive dependency tree. While developers review first-party code thoroughly, third-party libraries frequently execute with the exact same host privileges.

### Critical Defense Vectors

1. **Deterministic Lockfile Pinning**: Always commit lockfiles (\`package-lock.json\`, \`pnpm-lock.yaml\`) and run \`npm ci\` rather than \`npm install\` in CI/CD.
2. **Automated Advisory Audits**: Query the Open Source Vulnerabilities (OSV) distributed database on every pull request.
3. **Zero-Execution Inspection**: Never run \`postinstall\` scripts from unknown packages during security evaluation. CyberShield operates in a strict zero-execution sandbox that reads and parses AST files without running runtime code.
4. **Transitive Dependency Pruning**: Eliminate unused packages and prioritize minimal, single-responsibility utilities.`,
      },
    ];

    for (const a of seedArticles) {
      await prisma.article.create({ data: a });
    }
  }

  const existingFaqs = await prisma.faq.findMany();
  if (existingFaqs.length === 0) {
    const seedFaqs = [
      // 1. Getting Started
      {
        category: "Getting Started",
        question: "What is CyberShield and how does it differ from traditional scanners?",
        answer: "CyberShield is a defensive code intelligence and security risk platform. Unlike traditional regex-based linters, CyberShield combines dual defensive analysis engines (known CVEs/SCA and deep AST taint tracking for novel logic bugs) with an executive worst-case disaster exposure model that calculates real financial liability ranges.",
        orderIndex: 1,
        isFeatured: 1,
      },
      {
        category: "Getting Started",
        question: "Do I need to install any agents or CLI tools on my server?",
        answer: "No. CyberShield is completely cloud-native and operates on public repositories and websites. You paste a public GitHub URL or domain, or log in with GitHub to 1-click audit your own repositories.",
        orderIndex: 2,
        isFeatured: 0,
      },

      // 2. Repository Scanning
      {
        category: "Repository Scanning",
        question: "What types of repositories can I audit with CyberShield?",
        answer: "CyberShield currently audits public GitHub repositories up to 100MB in size. It parses JavaScript, TypeScript, Python, JSON configurations, lockfiles, and environment templates.",
        orderIndex: 3,
        isFeatured: 1,
      },
      {
        category: "Repository Scanning",
        question: "Does CyberShield execute third-party code on the scanning host?",
        answer: "Never. CyberShield operates under a strict Zero-Execution Sandbox policy. We never run `npm install`, evaluate scripts, or execute scanned binaries. All code analysis is done via static AST parsing and data-flow graph modeling.",
        orderIndex: 4,
        isFeatured: 1,
      },

      // 3. Known Vulnerabilities
      {
        category: "Known Vulnerabilities",
        question: "How does CyberShield detect known CVEs and security advisories?",
        answer: "Engine 1 inspects package manifests and deterministic lockfiles against the authoritative OSV (Open Source Vulnerabilities), GitHub Security Advisory, and National Vulnerability Database (NVD) registries to flag vulnerable package versions and vulnerable semver ranges.",
        orderIndex: 5,
        isFeatured: 0,
      },

      // 4. Novel Bug Discovery
      {
        category: "Novel Bug Discovery",
        question: "What is Novel Bug Discovery and how does AST taint analysis work?",
        answer: "Engine 2 parses source files into Abstract Syntax Trees (ASTs). It tracks tainted user input from entry points (like `req.query`, `req.body`, `req.params`) as they flow across assignments and helper functions, detecting when unsanitized data reaches execution sinks (such as `fs.readFile`, `child_process.exec`, or `eval`).",
        orderIndex: 6,
        isFeatured: 1,
      },

      // 5. AI Analysis
      {
        category: "AI Analysis",
        question: "Is source code uploaded to external AI providers automatically?",
        answer: "No. Source code is never sent to third-party AI APIs without explicit user authorization. All initial AST taint tracking and pattern detection runs completely on CyberShield's private defensive analysis engines.",
        orderIndex: 7,
        isFeatured: 0,
      },

      // 6. Security Scores
      {
        category: "Security Scores",
        question: "How is the Overall Risk Score (0-100) calculated?",
        answer: "The risk score is computed by weighing finding severities (Critical = 30 pts, High = 15 pts, Medium = 6 pts, Low = 2 pts) combined with confidence modifiers and public attack perimeter exposures. A score of 0 represents zero detectable vulnerabilities, while scores above 60 indicate severe security risk.",
        orderIndex: 8,
        isFeatured: 1,
      },

      // 7. Risk and Impact Analysis
      {
        category: "Risk and Impact Analysis",
        question: "How does the Worst-Case Disaster Exposure model work?",
        answer: "The model calculates potential breach liability using five tunable assumptions: Records at Risk, Cost per Breached Record ($165), Downtime Duration, Downtime Cost per Day ($25,000), and Incident Response Overheads. Users can adjust sliders in real-time to reflect their organization's true scale.",
        orderIndex: 9,
        isFeatured: 1,
      },

      // 8. Scan Reports
      {
        category: "Scan Reports",
        question: "Can I export scan audits into executive PDF reports?",
        answer: "Yes. Every completed audit can be exported as a professional print-ready executive PDF report featuring the risk score badge, financial blast radius breakdown, and code diff remediation ledger.",
        orderIndex: 10,
        isFeatured: 0,
      },

      // 9. Privacy and Data Security
      {
        category: "Privacy and Data Security",
        question: "Can other CyberShield users see my scan history or audit reports?",
        answer: "No. CyberShield implements strict tenant isolation at the database level. Each user's scan records are strictly mapped to their authenticated user ID, and attempts to access other users' reports are denied with HTTP 403 Forbidden.",
        orderIndex: 11,
        isFeatured: 1,
      },

      // 10. GitHub Integration
      {
        category: "GitHub Integration",
        question: "How does the 1-Click GitHub Repository Audit feature work?",
        answer: "When you log in with your GitHub handle, CyberShield fetches your public repositories list in real-time. You can then trigger a full defensive audit on any of your repositories with a single click without copying URLs.",
        orderIndex: 12,
        isFeatured: 1,
      },

      // 11. Accounts and Authentication
      {
        category: "Accounts and Authentication",
        question: "Can I change my username, update my password, or delete my account?",
        answer: "Yes. Under Settings, authenticated users can update their username, modify their password, and permanently delete their account and associated scan history with full GDPR/CCPA data eradication.",
        orderIndex: 13,
        isFeatured: 0,
      },

      // 12. Subscriptions and Billing
      {
        category: "Subscriptions and Billing",
        question: "Is CyberShield free for open-source repositories?",
        answer: "Yes. Public repository audits, the blog resource center, knowledge base, and community features are completely free for open-source developers and security researchers.",
        orderIndex: 14,
        isFeatured: 0,
      },
    ];

    for (const f of seedFaqs) {
      await prisma.faq.create({ data: f });
    }
  }
}
