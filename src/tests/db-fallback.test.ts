import { describe, it, expect, beforeEach } from "vitest";
import { createFallbackDatabase } from "@/lib/db";

describe("Database Universal Fallback Engine", () => {
  let db: ReturnType<typeof createFallbackDatabase>;

  beforeEach(() => {
    db = createFallbackDatabase(":memory:");
  });

  it("handles CREATE TABLE, PRAGMA, and ALTER TABLE statements gracefully", () => {
    expect(() => {
      db.exec("PRAGMA journal_mode = WAL;");
      db.exec("CREATE TABLE IF NOT EXISTS test (id TEXT PRIMARY KEY);");
      db.exec("ALTER TABLE users ADD COLUMN testCol TEXT;");
    }).not.toThrow();
  });

  it("inserts, queries, updates, and deletes users with parameter binding", () => {
    // Insert
    const insertStmt = db.prepare(
      "INSERT INTO users (id, username, email, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const now = new Date().toISOString();
    insertStmt.run("u-1", "alice", "alice@example.com", "hash123", "USER", now, now);

    // Query by username
    const getStmt = db.prepare("SELECT * FROM users WHERE username = ?");
    const user = getStmt.get("alice") as any;
    expect(user).toBeDefined();
    expect(user.id).toBe("u-1");
    expect(user.username).toBe("alice");
    expect(user.email).toBe("alice@example.com");

    // Query with OR condition
    const orStmt = db.prepare("SELECT * FROM users WHERE (username = ? OR email = ?) LIMIT 1");
    const userOr = orStmt.get("nonexistent", "alice@example.com") as any;
    expect(userOr).toBeDefined();
    expect(userOr.username).toBe("alice");

    // Update
    const updateStmt = db.prepare("UPDATE users SET username = ?, email = ? WHERE id = ?");
    updateStmt.run("alice_updated", "new@example.com", "u-1");
    const updated = (db.prepare("SELECT * FROM users WHERE id = ?").get("u-1") as any);
    expect(updated.username).toBe("alice_updated");
    expect(updated.email).toBe("new@example.com");

    // Delete
    const deleteStmt = db.prepare("DELETE FROM users WHERE id = ?");
    deleteStmt.run("u-1");
    const deleted = db.prepare("SELECT * FROM users WHERE id = ?").get("u-1");
    expect(deleted).toBeUndefined();
  });

  it("supports scan_records, articles, faqs, and newsletter queries", () => {
    // Insert FAQ
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO faqs (id, question, answer, category, orderIndex, isPublished, isFeatured, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run("faq-1", "Is it secure?", "Yes.", "Security", 1, 1, 1, now, now);

    const faqs = db.prepare("SELECT * FROM faqs WHERE isPublished = 1 ORDER BY orderIndex ASC").all() as any[];
    expect(faqs.length).toBe(1);
    expect(faqs[0].question).toBe("Is it secure?");

    // Insert article
    db.prepare(
      "INSERT INTO articles (id, slug, title, summary, content, category, tagsJson, authorName, authorRole, readingTimeMinutes, coverImage, status, canonicalUrl, publishedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run("art-1", "taint-analysis", "AST Analysis", "Summary", "Full content", "Research", "[]", "CyberShield", "Team", 5, "", "PUBLISHED", "", now, now, now);

    const article = db.prepare("SELECT * FROM articles WHERE slug = ?").get("taint-analysis") as any;
    expect(article).toBeDefined();
    expect(article.title).toBe("AST Analysis");
  });
});
