/**
 * CyberShield Support Assistant Knowledge Base
 * Strictly grounded in official /docs and platform specifications.
 * Enforces privacy guardrails: never hallucinates features and never leaks private scan/code data.
 */

export interface KnowledgeTopic {
  keywords: string[];
  title: string;
  answer: string;
}

export const KNOWLEDGE_BASE: KnowledgeTopic[] = [
  {
    keywords: ["how", "scan", "work", "scanning", "repository", "architecture"],
    title: "How CyberShield Repository Scanning Works",
    answer: "CyberShield uses a dual defensive engine architecture operating inside a strict Zero-Execution Sandbox. When you provide a public repository or web domain, Engine 1 evaluates dependencies against OSV and NVD advisory databases. Concurrently, Engine 2 parses code into Abstract Syntax Trees (AST) to trace user-controlled inputs across multi-hop function calls down to dangerous sinks (like file reading or command execution). We never install dependencies or execute untrusted code.",
  },
  {
    keywords: ["zero", "execution", "sandbox", "safety", "run code", "malware"],
    title: "Zero-Execution Sandbox Security",
    answer: "CyberShield strictly prohibits executing third-party code. We do not run `npm install`, evaluate scripts, or execute binaries from scanned repositories. Code is parsed purely as static data and syntax trees, ensuring zero danger of host compromise or remote code execution.",
  },
  {
    keywords: ["novel", "zero-day", "taint", "ast", "logic bug"],
    title: "Novel Bug Discovery & AST Taint Analysis",
    answer: "Novel Bug Discovery is powered by Engine 2's interprocedural AST taint analyzer. Unlike standard scanners that only check for known CVEs in libraries, Engine 2 tracks tainted sources (such as `req.query`, `req.body`, and route parameters) through application code to detect unlisted zero-days like path traversal, prototype pollution, and SQL injection with concrete remediation diffs.",
  },
  {
    keywords: ["score", "risk score", "calculate", "formula", "rating"],
    title: "Risk Scoring Formulation",
    answer: "The Overall Risk Score ranges from 0 (clean baseline) to 100 (critical vulnerability exposure). It is calculated by aggregating finding severities (Critical = 30 pts, High = 15 pts, Medium = 6 pts, Low = 2 pts) adjusted by detection confidence and exposed attack surfaces. This directly informs our Worst-Case Disaster Exposure model to calculate real dollar liabilities.",
  },
  {
    keywords: ["disaster", "cost", "financial", "exposure", "money", "dollar", "impact"],
    title: "Worst-Case Disaster Financial Exposure Model",
    answer: "CyberShield's Disaster Exposure model bridges cybersecurity findings with CFO reality. It calculates financial risk across 5 configurable dimensions: Records at Risk, Per-Record Breach Liability ($165), Estimated Downtime Days, Daily Operational Downtime Cost ($25,000), and Regulatory Fine Percentages (15% by default). You can adjust these assumptions dynamically in the report dashboard.",
  },
  {
    keywords: ["language", "languages", "supported", "python", "javascript", "typescript"],
    title: "Supported Programming Languages",
    answer: "CyberShield currently supports JavaScript, TypeScript, Python, Node.js package manifests (`package.json`, `package-lock.json`, `pnpm-lock`), environment configs, and web perimeter headers. Support for Go, Java, and Rust is on our active engineering roadmap.",
  },
  {
    keywords: ["github", "repos", "1-click", "direct audit", "oauth"],
    title: "GitHub Repository Integration",
    answer: "When you log in with your GitHub handle, CyberShield connects to public GitHub API endpoints to display your repositories directly on your dashboard. You can click '1-Click Audit' on any repository to run an instant defensive scan without copying URLs.",
  },
  {
    keywords: ["privacy", "history", "isolation", "tenant", "data", "retention"],
    title: "Data Privacy & Tenant Isolation",
    answer: "CyberShield enforces strict multi-tenant isolation at the database layer. No user can view another user's scan history or vulnerability reports; unauthorized access returns HTTP 403 Forbidden. Source archives are processed ephemerally and wiped after AST parsing.",
  },
  {
    keywords: ["pdf", "export", "report", "download", "executive"],
    title: "Audit PDF Report Exports",
    answer: "Every completed scan report features a 'Export PDF' button. It generates a print-ready, multi-page executive security audit including severity badges, worst-case disaster liabilities, and the full findings ledger with git diff remediation code.",
  },
  {
    keywords: ["account", "password", "delete", "username", "settings"],
    title: "Account Management & Deletion",
    answer: "Under your User Settings profile, you can update your username, change your account password, or permanently delete your account. Deleting your account triggers full deletion of all associated scan history from our SQLite database.",
  },
  {
    keywords: ["billing", "pricing", "free", "subscription", "cost to use"],
    title: "Pricing & Community Access",
    answer: "CyberShield is completely free for open-source repositories and public website perimeter audits. Educational resources, the blog, and standard scanner capabilities are provided at no cost to the security and developer community.",
  },
];

export function findSupportAnswer(userQuestion: string): string {
  const normalized = userQuestion.toLowerCase().trim();

  // Safety & Privacy Guardrail: Never process prompts asking for secrets or private codes
  if (
    normalized.includes("password") ||
    normalized.includes("secret") ||
    normalized.includes("token") ||
    normalized.includes("hack") ||
    normalized.includes("exploit") ||
    normalized.includes("bypass")
  ) {
    return "I am CyberShield's defensive educational assistant. I cannot access private repository contents, generate exploits, or inspect private credentials. For security inquiries regarding sensitive targets or vulnerability disclosures, please contact our human security team directly at support@cybershield.dev.";
  }

  let bestMatch: KnowledgeTopic | null = null;
  let maxScore = 0;

  for (const topic of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of topic.keywords) {
      if (normalized.includes(kw)) {
        score += 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = topic;
    }
  }

  if (bestMatch && maxScore >= 1) {
    return `${bestMatch.answer}\n\nRelated documentation: See our technical specifications in /docs or explore our Blog & Resources Center at /blog.`;
  }

  return "I'm CyberShield's defensive AI assistant. I can answer questions about our dual AST scanning engines, worst-case disaster risk models, supported languages, GitHub 1-click audits, and tenant isolation policies. If you have an inquiry requiring deeper analysis or support, please reach out to our engineering team at support@cybershield.dev.";
}
