# 02. CyberShield — Requirements & Scope

## 1. Functional Requirements (User Stories)

### MVP (Milestone 1 — Core Working Scan Platform)
- **US-01 [Repo Submission]**: As a user, I can paste a public GitHub URL (e.g., `https://github.com/owner/repo`) so that the system validates its accessibility and queues it for analysis.
  - *Acceptance Criteria*: Rejects private or invalid URLs with clear error messages; clones or downloads the default branch archive safely; blocks symlink traversals and zip bombs.
- **US-02 [Known Vulnerabilities Scan]**: As a developer, I want my repository analyzed by industry-standard SAST, secret detection, and SCA tools.
  - *Acceptance Criteria*: Executes Gitleaks for secrets, Semgrep for code patterns, and OSV-Scanner / Trivy for package dependencies; normalizes findings into a unified format.
- **US-03 [Novel Bug Hypotheses]**: As an AppSec engineer, I want the system to hypothesize undocumented logic bugs and taint flows.
  - *Acceptance Criteria*: Identifies unvalidated data flows from entry points to dangerous sinks; queries AI reasoning with code context; labels novel bugs with internal IDs (`CYBER-NOVEL-xxxxx`) and `Needs Verification` status.
- **US-04 [Findings Explorer & Evidence Viewer]**: As a user, I can filter and drill down into findings by severity, category, tool, and file location.
  - *Acceptance Criteria*: Displays exact line numbers, code snippets with syntax highlighting, CWE/OWASP tags, and confidence scores.
- **US-05 [Risk & Disaster Cost Estimator]**: As an engineering lead, I can see a 0-100 technical risk score and an estimated worst-case disaster cost.
  - *Acceptance Criteria*: Explains technical score methodology; provides sliders for records at risk, downtime hourly rate, and incident response overhead with low/expected/worst-case ranges.
- **US-06 [Remediation & Export]**: As a developer, I can view suggested code patches and export the report to PDF, JSON, and SARIF.
  - *Acceptance Criteria*: Shows clean unified diffs with explanations; downloads valid SARIF 2.1.0 and printable executive PDF summaries.

### v1.0 (Milestone 2 — Deep Analysis & Collaboration)
- **US-07 [Branch & Commit Selection]**: Users can scan specific branches, tags, or commit SHAs.
- **US-08 [Scan History & Diffs]**: Compare two scans of the same repository to verify resolved findings and highlight new regressions.
- **US-09 [Controlled Dynamic Fuzzing / Property Testing]**: In an isolated container, run property-based fuzz tests against identified parsers and serializers to confirm crashes.
- **US-10 [Team Workspaces & Role-Based Access]**: Invite team members with Read-Only, Auditor, or Admin permissions.

### Later / Backlog (v2.0)
- **US-11 [Private Repository Integration]**: OAuth integration for private GitHub, GitLab, and Bitbucket repos.
- **US-12 [Automated Pull Request Checks]**: GitHub Action / Webhook bot commenting security reviews directly on PRs.
- **US-13 [Interactive Sandbox Debugger]**: Browser-based ephemeral debugger stepping through taint propagation traces.

---

## 2. Non-Functional Requirements (NFRs)

| Dimension | Metric / Target | Verification Method |
| :--- | :--- | :--- |
| **Performance (TTFR)** | Initial status and dependency inventory visible within **< 45 seconds**. | Automated end-to-end benchmark on standard fixture repo. |
| **Performance (Max Scan Time)** | Complete multi-engine scan for standard repo (<10k LoC) in **< 4 minutes**; absolute timeout at **10 minutes**. | Worker timeout enforcement and queue telemetry. |
| **Scalability** | Horizontal worker scaling capable of processing **1,000 scans/month** with zero database contention. | Load testing with simulated concurrent scan queues. |
| **Reliability & Resilience** | Graceful degradation: if one scanner fails, remaining tools complete and report partial success with logged warning. | Fault injection tests (mocking scanner crash). |
| **Accessibility** | **WCAG 2.1 AA** compliance: 4.5:1 text contrast, keyboard navigation, screen reader ARIA labels, and severity indicators that never rely solely on color. | Automated Axe tests and manual keyboard traversal. |
| **Privacy & Security** | Source code is purged from ephemeral worker storage immediately post-scan; only metadata, line snippets, and hashes persist. Secrets are automatically masked. | Storage audit and automated sanitization unit tests. |
| **Cost Efficiency** | Target infrastructure and AI operational cost of **< $0.25 per scan** on average. | Token budgeting and caching of dependency lookups. |

---

## 3. Explicit Scope & Constraints for MVP

1. **Repository Access**: Public repositories hosted on `github.com` only. No private authentication or self-hosted Git instances in MVP.
2. **Repository Size & File Limits**:
   - Maximum repository download size: **100 MB** compressed / **250 MB** uncompressed.
   - Maximum total files scanned: **10,000 files**.
   - Maximum individual file size analyzed: **2 MB** (skips minified bundles, binary assets, and large generated code).
3. **Supported Languages for Deep AST & Novel Analysis (MVP)**:
   - **TypeScript / JavaScript** (Node.js, React, Express, Next.js)
   - **Python** (FastAPI, Flask, Django)
   - **Go** (Standard library, Gin, Fiber)
   - *Generic SCA & Secret Scanning*: Supports all languages via Gitleaks and Trivy/OSV package lockfile inspection (npm, pip, go.mod, Cargo, Gemfile, Maven).
