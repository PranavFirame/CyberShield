import { ScanReport } from "@/types/security";

/**
 * Generates an executive, print-optimized cybersecurity PDF report.
 * Opens an isolated print preview window and triggers native browser PDF rendering.
 */
export function exportReportToPdf(report: ScanReport) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate and download your PDF audit report.");
    return;
  }

  const generatedDate = new Date().toLocaleString();
  const lowCost = Math.round(report.costModel.lowLoss || report.costModel.expectedLoss * 0.35);
  const worstCost = Math.round(report.costModel.worstCaseLoss || report.costModel.expectedLoss * 2.2);

  const riskBadgeColor =
    report.riskScore >= 70
      ? "#e11d48"
      : report.riskScore >= 40
      ? "#ea580c"
      : report.riskScore >= 20
      ? "#d97706"
      : "#16a34a";

  const riskLabel =
    report.riskScore >= 70
      ? "CRITICAL RISK"
      : report.riskScore >= 40
      ? "HIGH RISK"
      : report.riskScore >= 20
      ? "MODERATE RISK"
      : "LOW RISK";

  const findingsHtml = report.findings
    .map(
      (f, idx) => `
      <div class="finding-card ${f.severity.toLowerCase()}">
        <div class="finding-header">
          <div class="finding-title-group">
            <span class="index-num">#${idx + 1}</span>
            <span class="severity-pill ${f.severity.toLowerCase()}">${f.severity}</span>
            ${f.isNovel ? '<span class="novel-pill">NOVEL BUG</span>' : ""}
            <h3 class="finding-title">${f.title}</h3>
          </div>
          <span class="tool-tag">${f.toolName} · ${f.ruleId}</span>
        </div>

        <p class="finding-desc">${f.description}</p>

        ${
          f.attackNarrative
            ? `<div class="attack-narrative">
                <strong>Threat Attack Narrative:</strong> ${f.attackNarrative}
              </div>`
            : ""
        }

        <div class="finding-meta-row">
          <span><strong>Location:</strong> <code>${f.location.filePath}:${f.location.startLine}-${f.location.endLine}</code></span>
          ${f.cweIds.length ? `<span><strong>CWE:</strong> ${f.cweIds.join(", ")}</span>` : ""}
          ${f.cveId ? `<span><strong>CVE:</strong> ${f.cveId}</span>` : ""}
          ${f.owaspCategory ? `<span><strong>OWASP:</strong> ${f.owaspCategory}</span>` : ""}
          <span><strong>Confidence:</strong> ${f.confidence}</span>
        </div>

        <div class="code-box">
          <div class="code-title">Source Code Evidence</div>
          <pre><code>${escapeHtml(f.codeSnippet)}</code></pre>
        </div>

        <div class="patch-box">
          <div class="patch-title">Suggested Remediation Patch (Git Unified Diff)</div>
          <pre><code>${escapeHtml(f.remediation.patchDiff)}</code></pre>
        </div>
      </div>
    `
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>CyberShield Security Audit — ${escapeHtml(report.repoFullName)}</title>
      <style>
        @page {
          size: letter;
          margin: 18mm 16mm 18mm 16mm;
          @bottom-right {
            content: "Page " counter(page) " of " counter(pages);
          }
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          line-height: 1.5;
          margin: 0;
          padding: 24px;
          font-size: 13px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0284c7;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .shield-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #0284c7, #4f46e5);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 18px;
        }

        .brand-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .brand-sub {
          font-size: 11px;
          color: #64748b;
          margin: 0;
        }

        .report-meta {
          text-align: right;
          font-size: 11px;
          color: #64748b;
        }

        .target-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .target-name {
          font-size: 16px;
          font-weight: 700;
          font-family: monospace;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .target-details {
          font-size: 11px;
          color: #64748b;
          font-family: monospace;
        }

        .risk-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 14px;
          color: #ffffff;
          background-color: ${riskBadgeColor};
          text-align: center;
        }

        .section-title {
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #334155;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 6px;
          margin: 24px 0 14px 0;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .kpi-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 14px;
          text-align: center;
        }

        .kpi-val {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 2px;
        }

        .kpi-label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 700;
        }

        .disaster-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 12px;
        }

        .disaster-table th {
          background: #f1f5f9;
          padding: 8px 12px;
          text-align: left;
          border: 1px solid #cbd5e1;
          font-size: 11px;
        }

        .disaster-table td {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
        }

        .finding-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }

        .finding-card.critical { border-left: 5px solid #e11d48; }
        .finding-card.high { border-left: 5px solid #ea580c; }
        .finding-card.medium { border-left: 5px solid #d97706; }
        .finding-card.low { border-left: 5px solid #2563eb; }

        .finding-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .finding-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .index-num {
          font-family: monospace;
          font-weight: 700;
          color: #94a3b8;
          font-size: 11px;
        }

        .severity-pill {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 800;
          font-family: monospace;
          text-transform: uppercase;
        }

        .severity-pill.critical { background: #ffe4e6; color: #be123c; }
        .severity-pill.high { background: #ffedd5; color: #c2410c; }
        .severity-pill.medium { background: #fef3c7; color: #b45309; }
        .severity-pill.low { background: #dbeafe; color: #1d4ed8; }

        .novel-pill {
          background: #ede9fe;
          color: #6d28d9;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 800;
          font-family: monospace;
        }

        .finding-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .tool-tag {
          font-family: monospace;
          font-size: 10px;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .finding-desc {
          font-size: 12px;
          color: #334155;
          margin: 6px 0 10px 0;
        }

        .attack-narrative {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 6px;
          padding: 8px 12px;
          color: #9f1239;
          font-size: 11px;
          margin-bottom: 10px;
        }

        .finding-meta-row {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: #64748b;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .finding-meta-row code {
          background: #f1f5f9;
          padding: 1px 4px;
          border-radius: 3px;
          color: #0f172a;
        }

        .code-box, .patch-box {
          margin-top: 8px;
          border-radius: 6px;
          overflow: hidden;
          font-size: 11px;
        }

        .code-title, .patch-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 4px 8px;
        }

        .code-title {
          background: #e2e8f0;
          color: #475569;
        }

        .code-box pre {
          background: #0f172a;
          color: #f8fafc;
          padding: 8px 12px;
          margin: 0;
          overflow-x: auto;
          font-family: monospace;
          line-height: 1.4;
          white-space: pre-wrap;
        }

        .patch-title {
          background: #dcfce7;
          color: #166534;
        }

        .patch-box pre {
          background: #f0fdf4;
          color: #14532d;
          border: 1px solid #bbf7d0;
          padding: 8px 12px;
          margin: 0;
          overflow-x: auto;
          font-family: monospace;
          line-height: 1.4;
          white-space: pre-wrap;
        }

        .footer {
          margin-top: 36px;
          border-top: 1px solid #cbd5e1;
          padding-top: 12px;
          font-size: 10px;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
        }

        .print-btn-bar {
          background: #0284c7;
          color: white;
          padding: 10px 16px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .print-btn {
          background: white;
          color: #0284c7;
          border: none;
          padding: 6px 14px;
          font-weight: 700;
          border-radius: 6px;
          cursor: pointer;
        }

        @media print {
          .print-btn-bar {
            display: none;
          }
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-bar">
        <span><strong>CyberShield Print Preview:</strong> Save as PDF or print this executive audit report.</span>
        <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
      </div>

      <div class="header">
        <div class="logo-area">
          <div class="shield-icon">🛡</div>
          <div>
            <h1 class="brand-title">CyberShield</h1>
            <p class="brand-sub">Defensive Security Intelligence & Disaster Risk Audit</p>
          </div>
        </div>
        <div class="report-meta">
          <div><strong>Generated:</strong> ${generatedDate}</div>
          <div><strong>Scan ID:</strong> <code>${report.scanId}</code></div>
          <div><strong>Status:</strong> COMPLETED (${(report.durationMs / 1000).toFixed(1)}s)</div>
        </div>
      </div>

      <div class="target-card">
        <div>
          <h2 class="target-name">${escapeHtml(report.repoFullName)}</h2>
          <div class="target-details">
            Target Type: ${report.targetType}
            ${report.defaultBranch ? ` · Branch: ${report.defaultBranch}` : ""}
            ${report.commitSha ? ` · Commit: ${report.commitSha.slice(0, 8)}` : ""}
            · URL: ${escapeHtml(report.repoUrl)}
          </div>
        </div>
        <div>
          <div class="risk-badge">${riskLabel} (${report.riskScore}/100)</div>
        </div>
      </div>

      <div class="section-title">Executive Vulnerability Summary</div>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-val" style="color: ${riskBadgeColor}">${report.riskScore}</div>
          <div class="kpi-label">Risk Posture (/100)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #0f172a">${report.summary.total}</div>
          <div class="kpi-label">Total Findings</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #e11d48">${report.summary.critical}</div>
          <div class="kpi-label">Critical Vulnerabilities</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val" style="color: #6366f1">${report.summary.novelCount}</div>
          <div class="kpi-label">Novel Engine Bugs</div>
        </div>
      </div>

      <div class="section-title">Disaster Impact & Financial Loss Exposure</div>
      <table class="disaster-table">
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Estimated Loss</th>
            <th>Blast Radius Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Conservative (35th)</strong></td>
            <td><strong>$${lowCost.toLocaleString()}</strong></td>
            <td>Contained blast radius, minimal forensic audit overhead.</td>
          </tr>
          <tr style="background: #fefce8">
            <td><strong>Expected Baseline</strong></td>
            <td><strong style="color: #b45309">$${report.costModel.expectedLoss.toLocaleString()}</strong></td>
            <td>Industry standard exfiltration, downtime (${report.costAssumptions?.downtimeDays || 3} days) & regulatory surcharge.</td>
          </tr>
          <tr>
            <td><strong>Worst-Case (220th)</strong></td>
            <td><strong style="color: #be123c">$${worstCost.toLocaleString()}</strong></td>
            <td>Max records exfiltration, complete service outage, GDPR / CCPA legal penalties.</td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">Verified Findings & Remediation Ledger (${report.findings.length})</div>
      ${report.findings.length > 0 ? findingsHtml : '<p style="color: #16a34a; font-weight: 600;">✓ No vulnerabilities detected for this target.</p>'}

      <div class="footer">
        <span>Confidential Security Audit Report · CyberShield Defensive Intelligence</span>
        <span>Zero-Execution Sandbox · Public Targets Only · No Exploit Generation</span>
      </div>

      <script>
        // Automatically trigger print dialog on window load
        window.addEventListener("load", () => {
          setTimeout(() => {
            window.print();
          }, 350);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
