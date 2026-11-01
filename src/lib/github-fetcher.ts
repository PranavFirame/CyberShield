import AdmZip from "adm-zip";
import { ScanTargetFile } from "./scanner-engine";

export interface GitHubRepoMeta {
  fullName: string;
  defaultBranch: string;
  description: string;
  starCount: number;
  commitSha: string;
  files: ScanTargetFile[];
}

// Ignore files that are binary, minified, or irrelevant for SAST
const IGNORED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2",
  ".ttf", ".eot", ".mp4", ".mp3", ".pdf", ".zip", ".tar", ".gz",
  ".exe", ".dll", ".so", ".dylib", ".bin", ".map", ".min.js", ".min.css"
]);

const ALLOWED_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".pyw",
  ".go",
  ".rb",
  ".java",
  ".php",
  ".rs",
  ".json", ".yaml", ".yml", ".toml", ".env.example", "Dockerfile"
]);

/**
 * Safely fetches a public GitHub repository archive from GitHub API/Codeload,
 * unpacks it completely in-memory with zip bomb safeguards, and returns readable code files.
 */
export async function fetchGitHubRepo(owner: string, repo: string): Promise<GitHubRepoMeta> {
  // 1. Fetch Repository Metadata
  const headers: Record<string, string> = {
    "User-Agent": "CyberShield-Security-Auditor/1.0",
    Accept: "application/vnd.github.v3+json",
  };

  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!metaRes.ok) {
    if (metaRes.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" was not found or is private.`);
    }
    if (metaRes.status === 403) {
      throw new Error(`GitHub API rate limit exceeded or access forbidden.`);
    }
    throw new Error(`Failed to query GitHub repository: HTTP ${metaRes.status}`);
  }

  const meta = await metaRes.json();
  const defaultBranch = meta.default_branch || "main";

  // 2. Query latest commit SHA on default branch
  let commitSha = "unknown";
  try {
    const branchRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${defaultBranch}`,
      { headers }
    );
    if (branchRes.ok) {
      const commitData = await branchRes.json();
      commitSha = (commitData.sha || "").substring(0, 7);
    }
  } catch {
    commitSha = "head";
  }

  // 3. Download repository zipball
  const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${defaultBranch}`;
  const zipRes = await fetch(zipUrl, {
    headers: {
      ...headers,
      Accept: "application/vnd.github+json",
    },
    redirect: "follow",
  });

  if (!zipRes.ok) {
    throw new Error(`Failed to download repository zipball: HTTP ${zipRes.status}`);
  }

  const arrayBuffer = await zipRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 4. Safely unpack with Zip-bomb & file limits
  const zip = new AdmZip(buffer);
  const zipEntries = zip.getEntries();

  const files: ScanTargetFile[] = [];
  let totalBytes = 0;
  const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB in-memory cap
  const MAX_FILE_SIZE = 1.5 * 1024 * 1024;  // 1.5 MB per file cap
  const MAX_FILES = 2500;                  // Max files analyzed per scan

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;
    if (files.length >= MAX_FILES) break;

    // Path traversal prevention (Zip Slip)
    const entryName = entry.entryName;
    if (entryName.includes("..") || entryName.startsWith("/") || entryName.startsWith("\\")) {
      continue;
    }

    // Strip the top-level GitHub generated folder (e.g., owner-repo-sha/)
    const parts = entryName.split("/");
    if (parts.length <= 1) continue;
    const relativePath = parts.slice(1).join("/");

    // Skip ignored extensions & check allowed extensions
    const lower = relativePath.toLowerCase();
    const hasIgnored = Array.from(IGNORED_EXTENSIONS).some(ext => lower.endsWith(ext));
    if (hasIgnored) continue;

    const isAllowed = Array.from(ALLOWED_EXTENSIONS).some(ext => lower.endsWith(ext) || lower.endsWith("dockerfile"));
    if (!isAllowed) continue;

    if (entry.header.size > MAX_FILE_SIZE) continue;
    totalBytes += entry.header.size;
    if (totalBytes > MAX_TOTAL_BYTES) break;

    try {
      const content = entry.getData().toString("utf8");
      // Skip binary content / null bytes
      if (content.includes("\0")) continue;

      files.push({
        path: relativePath,
        content,
      });
    } catch {
      // Ignore unparseable files
      continue;
    }
  }

  return {
    fullName: meta.full_name,
    defaultBranch,
    description: meta.description || "",
    starCount: meta.stargazers_count || 0,
    commitSha: commitSha || "main",
    files,
  };
}
