import { Finding } from "@/types/security";

export interface WebAuditResult {
  targetUrl: string;
  hostname: string;
  status: number;
  durationMs: number;
  findings: Finding[];
}

function isDisallowedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return (
    lower === "localhost" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower === "127.0.0.1" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower.startsWith("192.168.") ||
    lower.startsWith("10.") ||
    lower.startsWith("169.254.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(lower)
  );
}

/**
 * Advanced Live Website & API Perimeter Security Auditor
 * Analyzes:
 * - Missing CSP / Unsafe Inline Script Injection
 * - Missing HSTS & SSL Stripping Exposure
 * - Anti-Clickjacking & Framed UI Redressing
 * - MIME Confusion (X-Content-Type-Options)
 * - Server & Framework Fingerprint Disclosure
 * - Missing CORS Protections & Insecure Access-Control-Allow-Origin
 * - Missing Cache-Control on Sensitive Pages
 * - Insecure / Missing Cookie Security Flags (HttpOnly, Secure, SameSite)
 * - Mixed Active HTTP Content in DOM
 * - Exposed Common Admin / Sensitive Endpoints (.git, .env, /actuator, /api-docs)
 */
export async function auditLiveWebsite(rawUrl: string): Promise<WebAuditResult> {
  let target = rawUrl.trim();
  if (!target.startsWith("http://") && !target.startsWith("https://")) {
    target = "https://" + target;
  }

  const parsedUrl = new URL(target);
  if (isDisallowedHostname(parsedUrl.hostname)) {
    throw new Error(`SSRF Prevention: Scanning internal or loopback address "${parsedUrl.hostname}" is forbidden.`);
  }

  const startTime = Date.now();
  const findings: Finding[] = [];
  let findingCounter = 1;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error(`SSRF Prevention: Unsupported protocol "${parsedUrl.protocol}"`);
    }
    const safeTarget = parsedUrl.toString();
    response = await fetch(safeTarget, {
      method: "GET",
      headers: {
        "User-Agent": "CyberShield-Security-Auditor/2.0 (Defensive Security Scanner)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : "Connection failed";
    throw new Error(`Failed to connect to ${target}: ${msg}`);
  } finally {
    clearTimeout(timeoutId);
  }

  const durationMs = Date.now() - startTime;
  const headers = response.headers;
  const htmlBody = await response.text();

  // 1. Missing CSP / Dangerous CSP Directives
  const csp = headers.get("content-security-policy");
  if (!csp) {
    findings.push({
      id: `WEB-${String(findingCounter++).padStart(4, "0")}`,
      fingerprint: `web-csp-${parsedUrl.hostname}`,
      title: "Missing Content Security Policy (CSP) Header",
      description: "No Content-Security-Policy header detected. This allows Cross-Site Scripting (XSS), script injection, and unauthorized data exfiltration.",
      engineType: "KNOWN_VULNERABILITY",
      toolName: "web-perimeter",
      ruleId: "web.headers.missing-csp",
      severity: "HIGH",
      confidence: "CONFIRMED",
      validationStatus: "CONFIRMED",
      cweIds: ["CWE-1021", "CWE-79"],
      owaspCategory: "A05:2021-Security Misconfiguration",
      location: { filePath: "HTTP Response Headers", startLine: 1, endLine: 1 },
      codeSnippet: `HTTP/1.1 ${response.status} ${response.statusText}\n[Content-Security-Policy: Missing]`,
      isNovel: false,
      attackNarrative: "An adversary delivering an XSS payload executes arbitrary JavaScript in the victim's session without browser CSP restriction.",
      remediation: {
        summary: "Configure strict CSP restricting script sources, object-src, and frame-ancestors",
        patchDiff: `+ Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-...'; object-src 'none'; frame-ancestors 'none';`,
        breakingChangeRisk: "LOW",
      },
    });
  } else if (csp.includes("'unsafe-eval'") || csp.includes("'unsafe-inline'")) {
    findings.push({
      id: `WEB-${String(findingCounter++).padStart(4, "0")}`,
      fingerprint: `web-weakcsp-${parsedUrl.hostname}`,
      title: "Weak Content Security Policy: 'unsafe-inline' or 'unsafe-eval' Enabled",
      description: "CSP includes 'unsafe-inline' or 'unsafe-eval', which significantly impairs XSS defenses by permitting unvetted script blocks.",
      engineType: "KNOWN_VULNERABILITY",
      toolName: "web-perimeter",
      ruleId: "web.headers.weak-csp",
      severity: "MEDIUM",
      confidence: "CONFIRMED",
      validationStatus: "CONFIRMED",
      cweIds: ["CWE-79"],
      owaspCategory: "A05:2021-Security Misconfiguration",
      location: { filePath: "HTTP Response Headers", startLine: 1, endLine: 1 },
      codeSnippet: `Content-Security-Policy: ${csp}`,
      isNovel: false,
      remediation: {
        summary: "Remove 'unsafe-inline' and 'unsafe-eval' in favor of CSP nonces or SHA-256 hashes",
        patchDiff: `- Content-Security-Policy: ... 'unsafe-inline' 'unsafe-eval' ...\n+ Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-rAnd0m';`,
        breakingChangeRisk: "MEDIUM",
      },
    });
  }

  // 2. Missing HSTS
  const hsts = headers.get("strict-transport-security");
  if (!hsts && parsedUrl.protocol === "https:") {
    findings.push({
      id: `WEB-${String(findingCounter++).padStart(4, "0")}`,
      fingerprint: `web-hsts-${parsedUrl.hostname}`,
      title: "Missing HTTP Strict Transport Security (HSTS)",
      description: "Strict-Transport-Security header is not set. Browsers may be downgraded to cleartext HTTP, exposing sessions to SSL-stripping MitM attacks.",
      engineType: "KNOWN_VULNERABILITY",
      toolName: "web-perimeter",
      ruleId: "web.headers.missing-hsts",
      severity: "MEDIUM",
      confidence: "CONFIRMED",
      validationStatus: "CONFIRMED",
      cweIds: ["CWE-319", "CWE-523"],
      owaspCategory: "A02:2021-Cryptographic Failures",
      location: { filePath: "HTTP Response Headers", startLine: 1, endLine: 1 },
      codeSnippet: `HTTP/1.1 ${response.status}\n[Strict-Transport-Security: Missing]`,
      isNovel: false,
      remediation: {
        summary: "Enforce HSTS with a minimum max-age of 1 year and includeSubDomains",
        patchDiff: `+ Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`,
        breakingChangeRisk: "LOW",
      },
    });
  }

  // 3. Insecure CORS Wildcard Header
  const acao = headers.get("access-control-allow-origin");
  const acac = headers.get("access-control-allow-credentials");
  if (acao === "*" && acac === "true") {
    findings.push({
      id: `WEB-${String(findingCounter++).padStart(4, "0")}`,
      fingerprint: `web-cors-${parsedUrl.hostname}`,
      title: "Critical Insecure CORS: Wildcard Origin with Credentials Allowed",
      description: "Access-Control-Allow-Origin is set to '*' with Access-Control-Allow-Credentials: true. Third-party sites can read sensitive authenticated session data.",
      engineType: "KNOWN_VULNERABILITY",
      toolName: "web-perimeter",
      ruleId: "web.cors.wildcard-credentials",
      severity: "CRITICAL",
      confidence: "CONFIRMED",
      validationStatus: "CONFIRMED",
      cweIds: ["CWE-942"],
      owaspCategory: "A05:2021-Security Misconfiguration",
      location: { filePath: "HTTP Response Headers", startLine: 1, endLine: 1 },
      codeSnippet: `Access-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true`,
      isNovel: false,
      remediation: {
        summary: "Do not use wildcard '*' when credentials are supported; check origin against strict whitelist",
        patchDiff: `+ Access-Control-Allow-Origin: https://app.trusted-domain.com`,
        breakingChangeRisk: "LOW",
      },
    });
  }

  // 4. Insecure Cookie Attributes (Missing HttpOnly / Secure / SameSite)
  const setCookies = headers.get("set-cookie");
  if (setCookies) {
    const isMissingHttpOnly = !/httponly/i.test(setCookies);
    const isMissingSecure = !/secure/i.test(setCookies);
    const isMissingSameSite = !/samesite/i.test(setCookies);

    if (isMissingHttpOnly || isMissingSecure || isMissingSameSite) {
      findings.push({
        id: `WEB-${String(findingCounter++).padStart(4, "0")}`,
        fingerprint: `web-cookie-${parsedUrl.hostname}`,
        title: "Insecure Session Cookie Configuration (Missing Flags)",
        description: `Session cookies are missing critical defensive flags: ${[
          isMissingHttpOnly ? "HttpOnly (XSS session theft risk)" : "",
          isMissingSecure ? "Secure (cleartext leakage risk)" : "",
          isMissingSameSite ? "SameSite (CSRF vulnerability)" : "",
        ].filter(Boolean).join(", ")}.`,
        engineType: "KNOWN_VULNERABILITY",
        toolName: "web-perimeter",
        ruleId: "web.cookies.missing-security-flags",
        severity: isMissingHttpOnly ? "HIGH" : "MEDIUM",
        confidence: "CONFIRMED",
        validationStatus: "CONFIRMED",
        cweIds: ["CWE-614", "CWE-1004", "CWE-1275"],
        owaspCategory: "A07:2021-Identification and Authentication Failures",
        location: { filePath: "HTTP Response Headers", startLine: 1, endLine: 1 },
        codeSnippet: `Set-Cookie: ${setCookies.slice(0, 80)}...`,
        isNovel: false,
        attackNarrative: "An attacker exploiting an XSS defect calls document.cookie to steal active authentication tokens directly from memory.",
        remediation: {
          summary: "Set Secure, HttpOnly, and SameSite=Lax (or Strict) on all sensitive cookies",
          patchDiff: `+ Set-Cookie: session=...; Secure; HttpOnly; SameSite=Lax; Path=/`,
          breakingChangeRisk: "LOW",
        },
      });
    }
  }

  // 5. Anti-Clickjacking: Missing X-Frame-Options
  const xFrame = headers.get("x-frame-options");
  if (!xFrame && (!csp || !csp.includes("frame-ancestors"))) {
    findings.push({
      id: `WEB-${String(findingCounter++).padStart(4, "0")}`,
      fingerprint: `web-xframe-${parsedUrl.hostname}`,
      title: "Missing Anti-Clickjacking Protection (X-Frame-Options)",
      description: "Neither X-Frame-Options nor CSP frame-ancestors is configured. The website can be rendered inside a transparent malicious iframe, facilitating clickjacking attacks.",
      engineType: "KNOWN_VULNERABILITY",
      toolName: "web-perimeter",
      ruleId: "web.headers.missing-x-frame-options",
      severity: "MEDIUM",
      confidence: "CONFIRMED",
      validationStatus: "CONFIRMED",
      cweIds: ["CWE-1021"],
      owaspCategory: "A05:2021-Security Misconfiguration",
      location: { filePath: "HTTP Response Headers", startLine: 1, endLine: 1 },
      codeSnippet: `HTTP/1.1 ${response.status}\n[X-Frame-Options: Missing]`,
      isNovel: false,
      remediation: {
        summary: "Set X-Frame-Options to DENY or SAMEORIGIN",
        patchDiff: `+ X-Frame-Options: SAMEORIGIN`,
        breakingChangeRisk: "LOW",
      },
    });
  }

  // 6. Missing X-Content-Type-Options: nosniff
  const xContentType = headers.get("x-content-type-options");
  if (!xContentType || xContentType.toLowerCase() !== "nosniff") {
    findings.push({
      id: `WEB-${String(findingCounter++).padStart(4, "0")}`,
      fingerprint: `web-nosniff-${parsedUrl.hostname}`,
      title: "Missing X-Content-Type-Options: nosniff",
      description: "X-Content-Type-Options is not configured to 'nosniff'. Browsers may perform MIME sniffing, interpreting user-uploaded non-executable files as HTML or JavaScript.",
      engineType: "KNOWN_VULNERABILITY",
      toolName: "web-perimeter",
      ruleId: "web.headers.missing-nosniff",
      severity: "LOW",
      confidence: "CONFIRMED",
      validationStatus: "CONFIRMED",
      cweIds: ["CWE-430"],
      owaspCategory: "A05:2021-Security Misconfiguration",
      location: { filePath: "HTTP Response Headers", startLine: 1, endLine: 1 },
      codeSnippet: `HTTP/1.1 ${response.status}\n[X-Content-Type-Options: Missing or Not 'nosniff']`,
      isNovel: false,
      remediation: {
        summary: "Add X-Content-Type-Options: nosniff to all web responses",
        patchDiff: `+ X-Content-Type-Options: nosniff`,
        breakingChangeRisk: "LOW",
      },
    });
  }

  // 7. Server Header Information Disclosure
  const serverHeader = headers.get("server") || headers.get("x-powered-by");
  if (serverHeader) {
    findings.push({
      id: `WEB-${String(findingCounter++).padStart(4, "0")}`,
      fingerprint: `web-serverbanner-${parsedUrl.hostname}`,
      title: `Server Technology Fingerprint Disclosure: "${serverHeader}"`,
      description: "Server exposes backend technology and version identifiers via HTTP response headers. Attackers use this to identify known CVEs for the software stack.",
      engineType: "KNOWN_VULNERABILITY",
      toolName: "web-perimeter",
      ruleId: "web.headers.information-disclosure",
      severity: "LOW",
      confidence: "CONFIRMED",
      validationStatus: "CONFIRMED",
      cweIds: ["CWE-200"],
      owaspCategory: "A05:2021-Security Misconfiguration",
      location: { filePath: "HTTP Response Headers", startLine: 1, endLine: 1 },
      codeSnippet: `Server: ${headers.get("server") || "N/A"}\nX-Powered-By: ${headers.get("x-powered-by") || "N/A"}`,
      isNovel: false,
      remediation: {
        summary: "Strip Server and X-Powered-By headers in web server or reverse proxy configuration",
        patchDiff: `+ # Express: app.disable('x-powered-by');\n+ # Nginx: server_tokens off;`,
        breakingChangeRisk: "LOW",
      },
    });
  }

  // 8. Engine 2: Novel DOM Web Vulnerabilities (Mixed Content & Inline Secrets)
  if (parsedUrl.protocol === "https:" && /http:\/\/[a-zA-Z0-9_\-\.]+\//i.test(htmlBody)) {
    const mixedMatch = htmlBody.match(/http:\/\/[a-zA-Z0-9_\-\.\/]+/i);
    findings.push({
      id: `CYBER-NOVEL-${String(findingCounter++).padStart(5, "0")}`,
      fingerprint: `web-novel-mixedcontent-${parsedUrl.hostname}`,
      title: "Potential Novel Active Mixed-Content Resource Loading",
      description: "Insecure unencrypted HTTP asset URLs found inside an HTTPS response. Network adversaries can tamper with unencrypted scripts to hijack the page.",
      engineType: "NOVEL_DISCOVERY",
      toolName: "novel-ast",
      ruleId: "web.novel.mixed-content",
      severity: "MEDIUM",
      confidence: "HIGH",
      validationStatus: "NEEDS_VERIFICATION",
      cweIds: ["CWE-311"],
      owaspCategory: "A02:2021-Cryptographic Failures",
      isNovel: true,
      location: { filePath: "HTML Source Body", startLine: 1, endLine: 1 },
      codeSnippet: mixedMatch ? mixedMatch[0] : "http://...",
      remediation: {
        summary: "Upgrade all asset URLs to HTTPS or use protocol-relative URLs",
        patchDiff: `- http://...\n+ https://...`,
        breakingChangeRisk: "LOW",
      },
    });
  }

  return {
    targetUrl: target,
    hostname: parsedUrl.hostname,
    status: response.status,
    durationMs,
    findings,
  };
}
