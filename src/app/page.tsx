"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Shield,
  Search,
  AlertTriangle,
  FileCode,
  DollarSign,
  CheckCircle2,
  Lock,
  ChevronDown,
  TrendingUp,
  Cpu,
  Sparkles,
  Sliders,
  Globe,
  GitBranch,
  Clock,
  RefreshCw,
  XCircle,
  Copy,
  Check,
  Terminal,
  Zap,
  Eye,
  Layers,
  BarChart3,
  ExternalLink,
  User,
  LogOut,
  Settings,
  ShieldAlert,
  Download,
  Github,
} from "lucide-react";
import { Finding, ScanReport } from "@/types/security";
import { exportReportToPdf } from "@/lib/pdf-generator";
import AuthModal from "@/components/AuthModal";
import ProfileModal from "@/components/ProfileModal";
import HistoryModal from "@/components/HistoryModal";
import AdminModal from "@/components/AdminModal";
import ScanSkeleton from "@/components/ScanSkeleton";
import {
  OfflineBanner,
  SessionExpiredModal,
  PermissionDeniedModal,
  StructuredErrorCard,
} from "@/components/StateBanners";

type ScanStage =
  | "IDLE"
  | "FETCHING"
  | "ANALYZING"
  | "NOVEL_DISCOVERY"
  | "SCORING"
  | "COMPLETED"
  | "FAILED";

const SCAN_STAGES: { key: ScanStage; label: string; icon: React.ReactNode }[] =
  [
    { key: "FETCHING", label: "Target Ingestion", icon: <Globe className="h-3.5 w-3.5" /> },
    { key: "ANALYZING", label: "AST Vulnerability Scan", icon: <Terminal className="h-3.5 w-3.5" /> },
    { key: "NOVEL_DISCOVERY", label: "Novel Bug Discovery", icon: <Cpu className="h-3.5 w-3.5" /> },
    { key: "SCORING", label: "Risk & Impact Scoring", icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { key: "COMPLETED", label: "Audit Complete", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  ];

const STAGE_ORDER: ScanStage[] = [
  "FETCHING",
  "ANALYZING",
  "NOVEL_DISCOVERY",
  "SCORING",
  "COMPLETED",
];

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    CRITICAL: "bg-rose-50 text-rose-700 border-rose-200",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    LOW: "bg-blue-50 text-blue-700 border-blue-200",
    INFO: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${map[severity] ?? map.INFO}`}
    >
      {severity}
    </span>
  );
}

function RiskGauge({ score }: { score: number }) {
  const color =
    score >= 70 ? "#e11d48" : score >= 40 ? "#ea580c" : score >= 20 ? "#d97706" : "#16a34a";
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" className="transform -rotate-90">
      <circle cx="45" cy="45" r={r} stroke="#e2e8f0" strokeWidth="8" fill="none" />
      <circle
        cx="45"
        cy="45"
        r={r}
        stroke={color}
        strokeWidth="8"
        fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function groupByCategory(findings: Finding[]): Record<string, Finding[]> {
  const groups: Record<string, Finding[]> = {};
  for (const f of findings) {
    const cat = f.owaspCategory || "Uncategorized";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(f);
  }
  return groups;
}

function categoryTopSeverity(findings: Finding[]): string {
  const order = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
  for (const s of order) {
    if (findings.some((f) => f.severity === s)) return s;
  }
  return "INFO";
}

function FindingRow({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        onClick={() => setOpen((v) => !v)}
        className="border-b border-slate-200/80 cursor-pointer hover:bg-slate-50/80 transition group"
      >
        <td className="px-4 py-3.5 w-8">
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${open ? "" : "-rotate-90"}`}
          />
        </td>
        <td className="px-3 py-3.5">
          <SeverityBadge severity={finding.severity} />
        </td>
        <td className="px-3 py-3.5 max-w-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-900 font-semibold leading-tight line-clamp-1">
              {finding.title}
            </span>
            {finding.isNovel && (
              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                NOVEL
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-3.5 hidden md:table-cell">
          <span className="text-[11px] font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {finding.toolName}
          </span>
        </td>
        <td className="px-3 py-3.5 hidden lg:table-cell">
          <div className="flex flex-wrap gap-1">
            {finding.cweIds.slice(0, 2).map((c) => (
              <span key={c} className="text-[10px] font-mono font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                {c}
              </span>
            ))}
            {finding.cveId && (
              <span className="text-[10px] font-mono font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                {finding.cveId}
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-3.5 hidden xl:table-cell">
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
            <FileCode className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate max-w-[170px]">{finding.location.filePath}</span>
            <span className="text-slate-400">:{finding.location.startLine}</span>
          </div>
        </td>
        <td className="px-3 py-3.5">
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline font-medium">
            {finding.confidence}
          </span>
        </td>
      </tr>

      {open && (
        <tr className="border-b border-slate-200 bg-slate-50/70">
          <td colSpan={7} className="px-6 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: Context & Remediation */}
              <div className="flex flex-col gap-3.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Vulnerability Description
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{finding.description}</p>
                </div>

                {finding.attackNarrative && (
                  <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Threat Attack Narrative
                    </div>
                    <p className="text-xs text-rose-700 leading-relaxed">
                      {finding.attackNarrative}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Rule:</span>
                  <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                    {finding.ruleId}
                  </span>
                  {finding.owaspCategory && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 font-medium">OWASP:</span>
                      <span className="font-mono text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-medium">
                        {finding.owaspCategory}
                      </span>
                    </>
                  )}
                  <span className="text-slate-300">•</span>
                  <span className={`font-mono font-medium ${finding.engineType === "NOVEL_DISCOVERY" ? "text-indigo-700" : "text-sky-700"}`}>
                    {finding.engineType === "NOVEL_DISCOVERY" ? "Engine 2 – Novel Discovery" : "Engine 1 – SAST"}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Remediation Patch
                    </span>
                    <CopyButton text={finding.remediation.patchDiff} />
                  </div>
                  <pre className="bg-white border border-emerald-200 rounded-xl p-3.5 text-xs font-mono text-emerald-900 overflow-x-auto leading-relaxed shadow-sm whitespace-pre-wrap">
                    {finding.remediation.patchDiff}
                  </pre>
                </div>
              </div>

              {/* Right Column: Code Evidence */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-700 flex items-center gap-1">
                    <FileCode className="h-3.5 w-3.5 text-slate-400" />
                    {finding.location.filePath} · L{finding.location.startLine}–{finding.location.endLine}
                  </span>
                  <CopyButton text={finding.codeSnippet} />
                </div>
                <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto shadow-sm border border-slate-800 flex-1">
                  <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="ml-2">AST Evidence Viewer</span>
                  </div>
                  <pre className="text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {finding.codeSnippet}
                  </pre>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

interface GithubRepoItem {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  stars: number;
  updatedAt: string;
  isFork: boolean;
}

export default function CyberShieldLightApp() {
  const [targetUrl, setTargetUrl] = useState("");
  const [scanStage, setScanStage] = useState<ScanStage>("IDLE");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);

  // User Authentication & Modals
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    email: string | null;
    role: "USER" | "ADMIN";
    githubUsername?: string | null;
  } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  // GitHub Repositories for logged in GitHub user
  const [userRepos, setUserRepos] = useState<GithubRepoItem[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");

  // States: Skeleton progress, slow network, session expired, permission denied
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [scanProgressPercent, setScanProgressPercent] = useState<number>(0);
  const [scanProgressText, setScanProgressText] = useState<string>("");
  const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);
  const [permissionDeniedOpen, setPermissionDeniedOpen] = useState(false);

  const fetchUserRepos = useCallback(async (ghUsername: string) => {
    if (!ghUsername) return;
    setReposLoading(true);
    setReposError(null);
    try {
      const res = await fetch(`/api/user/github-repos?username=${encodeURIComponent(ghUsername)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load GitHub repositories");
      }
      setUserRepos(data.repos || []);
    } catch (err: unknown) {
      setReposError(err instanceof Error ? err.message : "Could not fetch GitHub repositories");
    } finally {
      setReposLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser?.githubUsername) {
      fetchUserRepos(currentUser.githubUsername);
    } else {
      setUserRepos([]);
    }
  }, [currentUser?.githubUsername, fetchUserRepos]);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setUserRepos([]);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }

  function handleSelectHistoricalScan(selectedReport: ScanReport) {
    setReport(selectedReport);
    setScanStage("COMPLETED");
    if (selectedReport.costAssumptions) {
      setRecordsCount(selectedReport.costAssumptions.recordsAtRisk);
      setDowntimeDays(selectedReport.costAssumptions.downtimeDays);
      setDowntimeCostPerDay(selectedReport.costAssumptions.downtimeCostPerDay);
      setIncidentResponseCost(selectedReport.costAssumptions.incidentResponseCost);
      setRegulatoryPercent(selectedReport.costAssumptions.regulatoryRatePercent);
    }
  }
  // Filters
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterEngine, setFilterEngine] = useState<string>("ALL");

  // Dynamic Disaster Model sliders
  const [recordsCount, setRecordsCount] = useState(15000);
  const [downtimeDays, setDowntimeDays] = useState(3);
  const [downtimeCostPerDay, setDowntimeCostPerDay] = useState(25000);
  const [incidentResponseCost, setIncidentResponseCost] = useState(45000);
  const [regulatoryPercent, setRegulatoryPercent] = useState(15);

  const scanActiveRef = useRef(false);

  const advanceStage = useCallback(async () => {
    const steps: { stage: ScanStage; text: string; pct: number }[] = [
      { stage: "FETCHING", text: "Target Ingestion: Fetching & unzipping target source files (1 of 4)", pct: 25 },
      { stage: "ANALYZING", text: "AST Analysis: Running 14+ vulnerability detectors (2 of 4)", pct: 50 },
      { stage: "NOVEL_DISCOVERY", text: "Engine 2: AST taint tracking & novel bug investigation (3 of 4)", pct: 75 },
      { stage: "SCORING", text: "Disaster Model: Computing risk score & financial sensitivity (4 of 4)", pct: 95 },
    ];
    const delays = [500, 600, 600, 400];
    for (let i = 0; i < steps.length; i++) {
      if (!scanActiveRef.current) return;
      setScanStage(steps[i].stage);
      setScanProgressText(steps[i].text);
      setScanProgressPercent(steps[i].pct);
      await new Promise((r) => setTimeout(r, delays[i]));
    }
  }, []);

  const executeScan = useCallback(async (urlToScan: string) => {
    const trimmed = urlToScan.trim();
    if (!trimmed) return;

    setTargetUrl(trimmed);
    setReport(null);
    setErrorMsg(null);
    setActiveCategory("ALL");
    scanActiveRef.current = true;
    advanceStage();

    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: trimmed,
          assumptions: {
            recordsAtRisk: recordsCount,
            downtimeDays,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setSessionExpiredOpen(true);
        } else if (res.status === 403) {
          setPermissionDeniedOpen(true);
        }
        throw new Error(data.error?.message || "Audit failed. Please verify the URL and try again.");
      }
      if (data.report) {
        scanActiveRef.current = false;
        if (data.report.costAssumptions) {
          setRecordsCount(data.report.costAssumptions.recordsAtRisk);
          setDowntimeDays(data.report.costAssumptions.downtimeDays);
          setDowntimeCostPerDay(data.report.costAssumptions.downtimeCostPerDay);
          setIncidentResponseCost(data.report.costAssumptions.incidentResponseCost);
          setRegulatoryPercent(data.report.costAssumptions.regulatoryRatePercent);
        }
        setReport(data.report);
        setScanStage("COMPLETED");
      }
    } catch (err: unknown) {
      scanActiveRef.current = false;
      const msg = err instanceof Error ? err.message : "Security scan failed";
      setErrorMsg(msg);
      setScanStage("FAILED");
    }
  }, [advanceStage, downtimeDays, recordsCount]);

  async function handleScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    await executeScan(targetUrl);
  }

  const isLoading = scanStage !== "IDLE" && scanStage !== "COMPLETED" && scanStage !== "FAILED";

  const allFindings = report?.findings ?? [];
  const filteredFindings = allFindings.filter((f) => {
    if (activeCategory !== "ALL" && (f.owaspCategory || "Uncategorized") !== activeCategory)
      return false;
    if (filterSeverity !== "ALL" && f.severity !== filterSeverity) return false;
    if (filterEngine !== "ALL" && f.engineType !== filterEngine) return false;
    return true;
  });
  const grouped = groupByCategory(allFindings);
  const categories = Object.keys(grouped).sort();

  // Financial model calculations
  const hasExfil = allFindings.some(
    (f) => f.severity === "CRITICAL" || f.cweIds.includes("CWE-89") || f.toolName === "gitleaks"
  );
  const breachProb = hasExfil ? 0.85 : 0.2;
  const recordsLoss = Math.round(recordsCount * 165 * breachProb);
  const outageLoss = Math.round(downtimeDays * downtimeCostPerDay);
  const directLosses = recordsLoss + outageLoss + incidentResponseCost;
  const regulatoryLoss = Math.round(directLosses * (regulatoryPercent / 100));
  const estimatedCost = allFindings.length === 0 ? 0 : directLosses + regulatoryLoss;
  const lowCost = Math.round(estimatedCost * 0.35);
  const worstCost = Math.round(estimatedCost * 2.2);

  const riskColor =
    (report?.riskScore ?? 0) >= 70
      ? "text-rose-600"
      : (report?.riskScore ?? 0) >= 40
      ? "text-orange-600"
      : (report?.riskScore ?? 0) >= 20
      ? "text-amber-600"
      : "text-emerald-600";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 4. No Internet State (Offline Banner + Cached indicator) */}
      <OfflineBanner />

      {/* ── Top Navigation Bar ────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-600/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900">CyberShield</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                ENTERPRISE SCANNER
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">AST Vulnerability Analysis & Disaster Risk Modeling</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <div className="hidden lg:flex items-center gap-1.5 text-slate-500 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-full font-medium shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Zero-Execution Sandbox Active
          </div>

          {/* History Button (Visible only when user is logged in) */}
          {currentUser && (
            <button
              onClick={() => setHistoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer shadow-2xs"
            >
              <Clock className="h-3.5 w-3.5 text-sky-600" />
              <span>Scan History</span>
            </button>
          )}

          {/* Admin Console Button (Visible for Admin only) */}
          {currentUser?.role === "ADMIN" && (
            <button
              onClick={() => setAdminModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 font-bold transition cursor-pointer shadow-2xs"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
              <span>Admin Console</span>
            </button>
          )}

          {/* Auth State Button */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
              <button
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition cursor-pointer"
                title="Profile & Settings"
              >
                <div className="h-6 w-6 rounded-full bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center font-mono uppercase">
                  {currentUser.username.substring(0, 2)}
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800 font-mono text-[11px] leading-none">
                      {currentUser.username}
                    </span>
                    {currentUser.githubUsername && (
                      <Github className="h-3 w-3 text-slate-700" />
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono leading-none mt-0.5">
                    {currentUser.githubUsername ? `@${currentUser.githubUsername}` : currentUser.role}
                  </span>
                </div>
                <Settings className="h-3.5 w-3.5 text-slate-400 ml-1" />
              </button>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold text-xs text-white shadow-xs transition cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Hero Search Section ───────────────────────────── */}
      <section className="bg-gradient-to-b from-white via-sky-50/30 to-slate-50 border-b border-slate-200/90 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-medium mb-3 shadow-2xs">
              <Zap className="h-3.5 w-3.5 text-sky-600" /> DUAL DEFENSIVE ENGINES · PUBLIC REPOS & SITES
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
              Security Vulnerability & Risk Intelligence
            </h1>
            <p className="text-slate-600 text-sm max-w-xl mx-auto">
              Scan any public GitHub repository or web domain for known CVEs, novel logic bugs,
              and security misconfigurations with concrete remediation diffs.
            </p>
          </div>

          {/* Input Box */}
          <form onSubmit={handleScanSubmit} className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://github.com/owner/repo   or   https://example.com"
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 font-mono text-slate-900 placeholder:text-slate-400 transition shadow-xs disabled:bg-slate-100"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !targetUrl.trim()}
              className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold text-sm text-white shadow-md shadow-sky-600/20 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer min-w-[170px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Start Audit</span>
                </>
              )}
            </button>
          </form>

          {/* ── User's Connected GitHub Repositories (1-Click Direct Audit) ── */}
          {currentUser?.githubUsername ? (
            <div className="mt-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Github className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Your GitHub Repositories</h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                        @{currentUser.githubUsername}
                      </span>
                      {userRepos.length > 0 && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          ({userRepos.length} public repos)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Directly audit your public repositories with 1-click. Zero installation, zero execution sandbox.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {userRepos.length > 4 && (
                    <input
                      type="text"
                      placeholder="Filter repos..."
                      value={repoSearchQuery}
                      onChange={(e) => setRepoSearchQuery(e.target.value)}
                      className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:outline-none focus:border-sky-500"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => fetchUserRepos(currentUser.githubUsername!)}
                    disabled={reposLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                    title="Refresh repositories list"
                  >
                    <RefreshCw className={`h-3 w-3 ${reposLoading ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Repos Content */}
              {reposLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="p-3.5 border border-slate-200 rounded-xl animate-pulse bg-slate-50/50 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-5/6" />
                      <div className="flex justify-between items-center pt-2">
                        <div className="h-3 bg-slate-200 rounded w-1/4" />
                        <div className="h-6 bg-slate-200 rounded w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : reposError ? (
                <div className="pt-4 text-center py-6">
                  <p className="text-xs text-rose-600 mb-2">{reposError}</p>
                  <button
                    type="button"
                    onClick={() => fetchUserRepos(currentUser.githubUsername!)}
                    className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                  >
                    Try fetching repositories again
                  </button>
                </div>
              ) : userRepos.length === 0 ? (
                <div className="pt-4 text-center py-6 text-xs text-slate-500">
                  No public repositories found for @{currentUser.githubUsername}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 max-h-96 overflow-y-auto pr-1">
                  {userRepos
                    .filter((r) =>
                      repoSearchQuery
                        ? r.name.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
                          (r.description && r.description.toLowerCase().includes(repoSearchQuery.toLowerCase()))
                        : true
                    )
                    .map((repo) => {
                      const isCurrentAuditing = isLoading && targetUrl === repo.htmlUrl;
                      return (
                        <div
                          key={repo.id}
                          className="bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between transition hover:shadow-xs group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="font-semibold text-xs text-slate-900 group-hover:text-sky-600 transition truncate" title={repo.fullName}>
                                {repo.name}
                              </span>
                              <a
                                href={repo.htmlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-slate-700 transition p-0.5"
                                title="Open repository in GitHub"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>

                            <p className="text-[11px] text-slate-500 line-clamp-2 mb-2 min-h-[30px]" title={repo.description || "No description"}>
                              {repo.description || "No description provided"}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              {repo.language && (
                                <span className="font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {repo.language}
                                </span>
                              )}
                              <span className="flex items-center gap-0.5 text-slate-400">
                                ★ {repo.stars}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => executeScan(repo.htmlUrl)}
                              disabled={isLoading}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer ${
                                isCurrentAuditing
                                  ? "bg-sky-100 text-sky-700 border border-sky-300"
                                  : "bg-sky-600 hover:bg-sky-500 text-white"
                              } disabled:opacity-50`}
                            >
                              {isCurrentAuditing ? (
                                <>
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  <span>Auditing...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="h-3 w-3 text-amber-300" />
                                  <span>1-Click Audit</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ) : !currentUser ? (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <Github className="h-3.5 w-3.5" />
                <span>Sign in with GitHub to view and 1-click audit all your personal repositories</span>
              </button>
            </div>
          ) : null}

          {/* HostedScan-style Stepper */}
          {(isLoading || scanStage === "COMPLETED" || scanStage === "FAILED") && (
            <div className="mt-8 max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-100 z-0" />
                {SCAN_STAGES.map((stage, i) => {
                  const stageIdx = STAGE_ORDER.indexOf(stage.key);
                  const currentIdx = STAGE_ORDER.indexOf(
                    scanStage === "FAILED" ? "FETCHING" : scanStage
                  );
                  const done = stageIdx < currentIdx || scanStage === "COMPLETED";
                  const active = stage.key === scanStage;
                  const failed = scanStage === "FAILED" && i === 0;
                  return (
                    <div key={stage.key} className="flex flex-col items-center gap-2 z-10">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all shadow-xs ${
                          failed
                            ? "bg-rose-50 border-rose-500 text-rose-600"
                            : done
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : active
                            ? "bg-sky-50 border-sky-600 text-sky-600 animate-pulse ring-4 ring-sky-50"
                            : "bg-white border-slate-200 text-slate-400"
                        }`}
                      >
                        {done && !failed ? (
                          <Check className="h-4 w-4 stroke-[3]" />
                        ) : (
                          stage.icon
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-medium text-center hidden sm:block ${
                          done
                            ? "text-emerald-700 font-semibold"
                            : active
                            ? "text-sky-700 font-semibold"
                            : "text-slate-400"
                        }`}
                      >
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Structured Error State (What went wrong, whose fault, and how to fix it) */}
          {errorMsg && (
            <div className="mt-6">
              <StructuredErrorCard
                errorMsg={errorMsg}
                onRetry={() => {
                  setErrorMsg(null);
                  executeScan(targetUrl);
                }}
                onFillSample={(sampleUrl) => {
                  setErrorMsg(null);
                  setTargetUrl(sampleUrl);
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── 2. Loading State (Skeleton Placeholders matching layout) & 5. Slow Network ── */}
      {isLoading && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
          <ScanSkeleton
            progressText={scanProgressText}
            progressPercent={scanProgressPercent}
            onSwitchLite={() => setIsLiteMode(true)}
          />
        </main>
      )}

      {/* ── 1. Empty State — "Nothing saved yet." Explain why and give next steps ── */}
      {scanStage === "IDLE" && !report && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-6">
          <div className="h-16 w-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mb-4 text-sky-600 shadow-sm">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-1">Nothing saved yet.</h2>
          <p className="text-sm text-slate-600 text-center max-w-lg mb-8 leading-relaxed">
            You haven’t run any repository or website security audits yet. Paste any public GitHub repo URL or domain name above, or click one of the verified open-source targets below to see the platform in action.
          </p>

          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Recommended Next Step: Choose a Target to Audit
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
            {[
              {
                title: "expressjs/express",
                type: "Node.js Framework",
                desc: "Discover real SQLi, path traversal and novel AST logic flaws in seconds.",
                url: "https://github.com/expressjs/express",
                badge: "High Severity",
                badgeCls: "bg-orange-50 text-orange-700 border-orange-200",
              },
              {
                title: "https://example.com",
                type: "Web Perimeter",
                desc: "Audit CSP headers, HSTS enforcement, and server banner leakages.",
                url: "https://example.com",
                badge: "Perimeter",
                badgeCls: "bg-amber-50 text-amber-700 border-amber-200",
              },
              {
                title: "octocat/Hello-World",
                type: "Clean Baseline",
                desc: "Demonstrate a zero-risk clean repository baseline with $0 exposure.",
                url: "https://github.com/octocat/Hello-World",
                badge: "Zero Risk",
                badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
              },
            ].map((sample) => (
              <button
                key={sample.title}
                type="button"
                onClick={() => setTargetUrl(sample.url)}
                className="bg-white hover:bg-sky-50/40 border border-slate-200 hover:border-sky-300 rounded-xl p-5 shadow-xs flex flex-col gap-2.5 text-left transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${sample.badgeCls}`}>
                    {sample.badge}
                  </span>
                  <span className="text-[11px] font-semibold text-sky-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Select target &rarr;
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition font-mono">
                    {sample.title}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">{sample.type}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{sample.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Audit Results View ────────────────────────────── */}
      {report && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
          {/* Target Metadata Header */}
          <div className="bg-white border border-slate-200 px-5 py-3.5 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  report.targetType === "WEBSITE"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-sky-50 text-sky-800 border-sky-200"
                }`}
              >
                {report.targetType === "WEBSITE" ? "LIVE WEBSITE AUDIT" : "GITHUB REPOSITORY"}
              </span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                {report.targetType === "WEBSITE" ? (
                  <Globe className="h-4 w-4 text-amber-600" />
                ) : (
                  <GitBranch className="h-4 w-4 text-sky-600" />
                )}
                {report.repoFullName}
              </div>
              {report.defaultBranch && (
                <span className="text-slate-500 font-mono">Branch: {report.defaultBranch}</span>
              )}
              {report.commitSha && (
                <span className="text-slate-400 font-mono hidden md:inline">
                  Commit: {report.commitSha.slice(0, 8)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-500 font-mono font-medium">
                <Clock className="h-3.5 w-3.5" />
                Duration: {(report.durationMs / 1000).toFixed(1)}s
              </div>
              <button
                type="button"
                onClick={() => exportReportToPdf(report)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold text-xs transition cursor-pointer shadow-2xs"
                title="Download executive PDF audit report"
              >
                <Download className="h-3.5 w-3.5 text-sky-600" />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>

          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Risk Gauge Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Overall Risk Score
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl font-black ${riskColor}`}>
                    {report.riskScore}
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-medium">/ 100</span>
                </div>
                <span className="text-xs font-semibold text-slate-600 mt-1 block">
                  {report.riskScore >= 70
                    ? "Critical Risk"
                    : report.riskScore >= 40
                    ? "High Exposure"
                    : report.riskScore >= 20
                    ? "Moderate Risk"
                    : "Low Exposure"}
                </span>
              </div>
              <div className="relative">
                <RiskGauge score={report.riskScore} />
              </div>
            </div>

            {/* Severity Pill Counters */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Severity Breakdown
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {report.summary.total} Total
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 my-2">
                {[
                  { label: "Critical", count: report.summary.critical, cls: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
                  { label: "High", count: report.summary.high, cls: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
                  { label: "Medium", count: report.summary.medium, cls: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
                  { label: "Low", count: report.summary.low, cls: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() =>
                      setFilterSeverity(filterSeverity === s.label.toUpperCase() ? "ALL" : s.label.toUpperCase())
                    }
                    className={`px-2 py-1 rounded-lg border text-xs font-mono font-bold transition flex items-center justify-between cursor-pointer ${s.cls} ${
                      filterSeverity === s.label.toUpperCase() ? "ring-2 ring-sky-500" : ""
                    }`}
                  >
                    <span>{s.label}</span>
                    <span>{s.count}</span>
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400">Click severity pill to filter table</span>
            </div>

            {/* Novel Bug Discovery Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Novel Engine
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                  Engine 2
                </span>
              </div>
              <div className="my-1">
                <span className="text-3xl font-black text-indigo-700">{report.summary.novelCount}</span>
                <p className="text-xs text-slate-500 mt-0.5">Undocumented logic bugs</p>
              </div>
              <button
                onClick={() =>
                  setFilterEngine(filterEngine === "NOVEL_DISCOVERY" ? "ALL" : "NOVEL_DISCOVERY")
                }
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                {filterEngine === "NOVEL_DISCOVERY" ? "View all findings" : "Filter novel findings"}
              </button>
            </div>

            {/* Disaster Loss Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-amber-600" /> Disaster Loss
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200">
                  Impact
                </span>
              </div>
              <div className="my-1">
                <span className="text-2xl font-black text-amber-700">
                  ${estimatedCost.toLocaleString()}
                </span>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Range: ${lowCost.toLocaleString()} – ${worstCost.toLocaleString()}
                </p>
              </div>
              <span className="text-[11px] text-slate-400">Breach, downtime & compliance</span>
            </div>
          </div>

          {/* ── Main Findings Panel (HostedScan & Pentest-Tools style) ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Category Navigation Tabs */}
            <div className="border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
              <div className="flex items-center px-4 min-w-max">
                <button
                  onClick={() => setActiveCategory("ALL")}
                  className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                    activeCategory === "ALL"
                      ? "border-sky-600 text-sky-700 bg-white"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  All Findings
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
                    {allFindings.length}
                  </span>
                </button>
                {categories.map((cat) => {
                  const catFindings = grouped[cat];
                  const topSev = categoryTopSeverity(catFindings);
                  const sevDot: Record<string, string> = {
                    CRITICAL: "bg-rose-500",
                    HIGH: "bg-orange-500",
                    MEDIUM: "bg-amber-500",
                    LOW: "bg-blue-500",
                    INFO: "bg-slate-400",
                  };
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                        activeCategory === cat
                          ? "border-sky-600 text-sky-700 bg-white"
                          : "border-transparent text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${sevDot[topSev]}`} />
                      {cat}
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
                        {catFindings.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter and Count Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <TrendingUp className="h-3.5 w-3.5 text-sky-600" />
                <span>
                  Showing <strong className="text-slate-900 font-bold">{filteredFindings.length}</strong> findings
                </span>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-sky-600"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="INFO">Info</option>
                </select>
                <select
                  value={filterEngine}
                  onChange={(e) => setFilterEngine(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-sky-600"
                >
                  <option value="ALL">All Engines</option>
                  <option value="KNOWN_VULNERABILITY">Engine 1 – SAST</option>
                  <option value="NOVEL_DISCOVERY">Engine 2 – Novel Discovery</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {filteredFindings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3 w-8" />
                      <th className="px-3 py-3">Severity</th>
                      <th className="px-3 py-3">Finding</th>
                      <th className="px-3 py-3 hidden md:table-cell">Tool</th>
                      <th className="px-3 py-3 hidden lg:table-cell">References</th>
                      <th className="px-3 py-3 hidden xl:table-cell">Location</th>
                      <th className="px-3 py-3">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFindings.map((f) => (
                      <FindingRow key={f.id} finding={f} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No findings match current filters</p>
                <p className="text-xs text-slate-400 mt-0.5">Try clearing the selected severity or category filter</p>
              </div>
            )}
          </div>

          {/* ── Disaster Impact Model Panel ──────────────────── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-200 gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Risk-Driven Disaster Model & Sensitivity Tuning
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  {allFindings.length === 0 ? "CLEAN POSTURE" : "AUTO-CALIBRATED TO VULNERABILITIES"}
                </span>
              </div>
              <span className="text-xs text-slate-500">Simulate exposure and downtime scenarios</span>
            </div>

            {/* Three Scenario Columns */}
            <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50/50">
              <div className="flex flex-col items-center py-5 px-4 text-center">
                <span className="text-xs font-semibold text-slate-500 mb-1">Conservative (35th)</span>
                <span className="text-2xl font-black text-sky-700">
                  ${lowCost.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">Low blast radius</span>
              </div>
              <div className="flex flex-col items-center py-5 px-4 text-center bg-amber-50/40">
                <span className="text-xs font-bold text-amber-800 mb-1">Expected Baseline</span>
                <span className="text-2xl font-black text-amber-700">
                  ${estimatedCost.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-700 font-mono mt-0.5">Median industry loss</span>
              </div>
              <div className="flex flex-col items-center py-5 px-4 text-center">
                <span className="text-xs font-semibold text-slate-500 mb-1">Worst-Case (220th)</span>
                <span className="text-2xl font-black text-rose-700">
                  ${worstCost.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">Full exfiltration & class-action</span>
              </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
              {[
                {
                  label: "Records Exposed",
                  value: recordsCount,
                  display: recordsCount.toLocaleString(),
                  onChange: setRecordsCount,
                  min: 0, max: 100000, step: 1000,
                  accent: "accent-sky-600",
                  sub: "Benchmark: $165 / record",
                  color: "text-sky-700",
                },
                {
                  label: "Outage Duration",
                  value: downtimeDays,
                  display: `${downtimeDays} Days`,
                  onChange: setDowntimeDays,
                  min: 0, max: 14, step: 0.5,
                  accent: "accent-indigo-600",
                  sub: `$${downtimeCostPerDay.toLocaleString()} / day`,
                  color: "text-indigo-700",
                },
                {
                  label: "Incident Response",
                  value: incidentResponseCost,
                  display: `$${incidentResponseCost.toLocaleString()}`,
                  onChange: setIncidentResponseCost,
                  min: 5000, max: 150000, step: 5000,
                  accent: "accent-amber-600",
                  sub: "Forensic audit & crisis PR",
                  color: "text-amber-700",
                },
                {
                  label: "Regulatory Penalty",
                  value: regulatoryPercent,
                  display: `${regulatoryPercent}%`,
                  onChange: setRegulatoryPercent,
                  min: 0, max: 35, step: 1,
                  accent: "accent-rose-600",
                  sub: "GDPR / CCPA / HIPAA fines",
                  color: "text-rose-700",
                },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{s.label}</span>
                    <span className={`font-mono ${s.color}`}>{s.display}</span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={s.value}
                    onChange={(e) => s.onChange(Number(e.target.value))}
                    className={`w-full ${s.accent} bg-slate-200 rounded-lg cursor-pointer h-1.5`}
                  />
                  <span className="text-[10px] text-slate-500">{s.sub}</span>
                </div>
              ))}
            </div>

            {/* Breakdown summary */}
            <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono font-medium text-slate-600">
              <div>Records loss: <strong className="text-slate-900">${recordsLoss.toLocaleString()}</strong></div>
              <div>Outage loss: <strong className="text-slate-900">${outageLoss.toLocaleString()}</strong></div>
              <div>IR cost: <strong className="text-slate-900">${incidentResponseCost.toLocaleString()}</strong></div>
              <div>Regulatory: <strong className="text-slate-900">${regulatoryLoss.toLocaleString()}</strong></div>
            </div>
          </div>
        </main>
      )}

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-2 mt-auto">
        <span>CyberShield · Defensive Cybersecurity Platform</span>
        <span>Zero-Execution Sandbox · Public Targets Only · No Exploit Generation</span>
      </footer>

      {/* ── Modals ────────────────────────────────────────── */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      {currentUser && (
        <ProfileModal
          isOpen={profileModalOpen}
          user={currentUser}
          onClose={() => setProfileModalOpen(false)}
          onUserUpdated={(u) => setCurrentUser(u)}
          onAccountDeleted={() => setCurrentUser(null)}
        />
      )}

      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        onSelectScan={handleSelectHistoricalScan}
      />

      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />

      {/* 8. Session Expired State */}
      <SessionExpiredModal
        isOpen={sessionExpiredOpen}
        onSignIn={() => {
          setSessionExpiredOpen(false);
          setAuthModalOpen(true);
        }}
        onDismiss={() => setSessionExpiredOpen(false)}
      />

      {/* 7. Permission Denied State */}
      <PermissionDeniedModal
        isOpen={permissionDeniedOpen}
        onClose={() => setPermissionDeniedOpen(false)}
        onAdminLogin={() => {
          setPermissionDeniedOpen(false);
          setAuthModalOpen(true);
        }}
        onTryPublic={() => {
          setPermissionDeniedOpen(false);
          setTargetUrl("https://github.com/expressjs/express");
        }}
      />
    </div>
  );
}
