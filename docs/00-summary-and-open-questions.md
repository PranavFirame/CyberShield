# 00. CyberShield — Executive Summary, Decisions & Open Questions

## Executive Summary
**CyberShield** is an enterprise-grade, defensive code security intelligence platform. It analyzes public GitHub repositories to uncover both **known vulnerabilities** (via signature-based SAST, SCA, and secret detection tools) and **novel/undocumented defects** (via Abstract Syntax Tree analysis, interprocedural taint tracking, AI-assisted code reasoning, and controlled sandbox testing).

Rather than outputting noisy, hard-to-parse lists of theoretical warnings, CyberShield:
1. Validates and contextualizes findings with concrete code evidence and data flows.
2. Distinctly separates **Confidence**, **Severity**, and **Verification Status**.
3. Calculates realistic risk using CVSS, EPSS, CISA KEV, and attack surface exposure.
4. Generates a transparent **Worst-Case Disaster Cost & Impact Model** with customizable financial assumptions.
5. Provides developers with actionable, validated remediation patches and regression test suites.

---

## Key Architectural Decisions

| Decision Area | Chosen Strategy | Justification / Trade-Off |
| :--- | :--- | :--- |
| **Monorepo Architecture** | Turborepo + pnpm workspaces (`apps/web`, `apps/api`, `workers/analysis-worker`, `packages/*`) | Unifies TypeScript contracts across frontend and backend, while isolating Python-based scanner workers into separate modular sub-packages. |
| **Worker Orchestration** | Redis + BullMQ (Node.js) with worker execution in ephemeral, rootless Docker containers | Scanning untrusted user code requires strict isolation (zero host network egress, read-only rootfs, tight memory/CPU caps). BullMQ provides reliable retry, progress streaming, and failure recovery. |
| **Dual-Engine Analysis** | **Engine 1**: Standard SAST/SCA (Semgrep, Gitleaks, OSV-Scanner, Trivy, Bandit)<br>**Engine 2**: Novel Bug Discovery (Tree-sitter AST, data-flow taint analysis, AI reasoning hypotheses, property testing) | Guarantees comprehensive baseline coverage of known CVEs/CWEs while delivering novel discovery capabilities for logic bugs and undocumented vulnerabilities. |
| **AI Layer Architecture** | Provider-agnostic adapter (OpenAI / Anthropic / Gemini / Local Ollama) using Zod/Pydantic structured output validation | Prevents vendor lock-in; ensures AI responses adhere strictly to defined schemas; prevents hallucinated CVE IDs or non-existent file paths. |
| **UI Design System** | Dark-first cybersecurity theme (Deep Slate `#090D16`, Charcoal `#111827`, Electric Indigo `#4F46E5`, Teal/Cyan `#06B6D4`, accessible WCAG AAA severity accents) | Follows UI-UX Pro Max recommendations: avoids flashy neon/glitch anti-patterns while maximizing readability, data density, and operational clarity. |

---

## Open Questions & Recommended Defaults

| # | Question / Ambiguity | Recommended Default | Impact / Notes |
| :- | :--- | :--- | :--- |
| 1 | **Repository Size Limit for MVP Scans** | Maximum **100 MB** or **10,000 files**; timeout at 10 minutes. | Prevents resource exhaustion and runaway cloud costs during public scans. |
| 2 | **Dynamic Fuzzing Execution for Untrusted Code** | Restrict automated dynamic execution/fuzzing to stateless, isolated micro-containers with non-root user, memory limit (512MB), zero network egress, and strict execution timeouts (30s). | Never execute untrusted code on bare-metal host workers. |
| 3 | **Anonymous vs. Authenticated Scans** | Allow 1 anonymous quick scan per IP per 24 hours (limited depth); require free registration for full scans, history, and exports. | Protects system against automated reconnaissance abuse and ensures audit logging. |
| 4 | **AI Token Budget per Scan** | Cap AI context to top-ranked entry points and suspicious sinks (max 50,000 tokens per scan in MVP). | Controls LLM operational costs while ensuring highest-risk code paths receive deep semantic scrutiny. |

---

## Top 5 Project Risks & Mitigations

1. **Host Compromise via Malicious Repositories (Zip bombs, path traversal, exploit payloads)**
   * *Mitigation*: Multi-stage validation, tar/zip decompression safeguards, memory-limited isolated disposable Docker containers with `cap-drop=ALL` and `no-new-privileges`.
2. **Prompt Injection from Scanned Code Overriding AI Evaluators**
   * *Mitigation*: Strict delimiters (`<untrusted_source_code>`), explicit system prompt instructions treating code as passive data, and JSON schema validation rejecting unauthorized outputs.
3. **High False-Positive Noise Eroding User Trust**
   * *Mitigation*: Separate **Confidence** from **Severity**; label AI-generated findings as `Needs Verification` until corroborated by AST taint flows or unit tests.
4. **Third-Party Scanner Version Drift or Breaking Changes**
   * *Mitigation*: Pin scanner versions inside containerized Docker images and define a canonical normalized finding schema (`CyberShieldFinding`).
5. **Abuse for Malicious Attack Reconnaissance**
   * *Mitigation*: CyberShield is strictly defensive: findings report security fixes, defense-in-depth patches, and disaster scenarios. It strictly avoids automated exploit generation or payload crafting.
