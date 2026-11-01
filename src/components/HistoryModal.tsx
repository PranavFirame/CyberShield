"use client";

import { useState, useEffect } from "react";
import { Clock, Globe, GitBranch, AlertTriangle, CheckCircle2, ChevronRight, X, Search, RefreshCw, Layers, Download } from "lucide-react";
import { ScanReport } from "@/types/security";
import { exportReportToPdf } from "@/lib/pdf-generator";

interface HistoryItem {
  id: string;
  userId: string | null;
  username: string;
  targetType: "REPOSITORY" | "WEBSITE";
  repoUrl: string;
  repoFullName: string;
  riskScore: number;
  durationMs: number;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    novelCount: number;
  };
  findingsCount: number;
  createdAt: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScan: (report: ScanReport) => void;
}

export default function HistoryModal({ isOpen, onClose, onSelectScan }: HistoryModalProps) {
  const [scans, setScans] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [fetchingScanId, setFetchingScanId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await fetch("/api/scans/history");
      const data = await res.json();
      if (res.ok && data.scans) {
        setScans(data.scans);
      }
    } catch (err) {
      console.error("Failed to load scan history:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadReport(scanId: string) {
    setFetchingScanId(scanId);
    try {
      const res = await fetch(`/api/scans?scanId=${scanId}`);
      const data = await res.json();
      if (res.ok && data.report) {
        onSelectScan(data.report);
        onClose();
      }
    } catch (err) {
      console.error("Failed to fetch full report:", err);
    } finally {
      setFetchingScanId(null);
    }
  }

  async function handleDownloadPdf(scanId: string) {
    try {
      const res = await fetch(`/api/scans?scanId=${scanId}`);
      const data = await res.json();
      if (res.ok && data.report) {
        exportReportToPdf(data.report);
      }
    } catch (err) {
      console.error("Failed to download PDF report:", err);
    }
  }

  if (!isOpen) return null;

  const filtered = scans.filter((s) =>
    s.repoFullName.toLowerCase().includes(filterText.toLowerCase()) ||
    s.repoUrl.toLowerCase().includes(filterText.toLowerCase()) ||
    s.username.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-sky-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Historical Scans & Vulnerability Logs</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500">Locate previous reports, findings, and remediation diffs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search previous scans by target or user..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-600"
            />
          </div>
          <button
            onClick={loadHistory}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer transition"
            title="Refresh history"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* List of scans */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {loading && scans.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">Loading previous audits...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center">
              <Layers className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Audits in Your History</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                Audit history is strictly private to each user. Sign in and scan any public target to record personal audits.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isFetching = fetchingScanId === item.id;
              const riskColor =
                item.riskScore >= 70
                  ? "text-rose-600 bg-rose-50 border-rose-200"
                  : item.riskScore >= 40
                  ? "text-orange-600 bg-orange-50 border-orange-200"
                  : item.riskScore >= 20
                  ? "text-amber-600 bg-amber-50 border-amber-200"
                  : "text-emerald-600 bg-emerald-50 border-emerald-200";

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-4 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        item.targetType === "WEBSITE"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-sky-50 text-sky-800 border-sky-200"
                      }`}>
                        {item.targetType}
                      </span>
                      <span className="font-bold text-xs text-slate-900 font-mono truncate">
                        {item.repoFullName}
                      </span>
                      <span className="text-[10px] text-slate-400">by {item.username}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>{new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>{(item.durationMs / 1000).toFixed(1)}s audit</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">{item.findingsCount} findings</span>
                      {item.summary?.critical > 0 && (
                        <span className="text-rose-600 font-bold font-mono text-[10px]">({item.summary.critical} Crit)</span>
                      )}
                      {item.summary?.novelCount > 0 && (
                        <span className="text-indigo-600 font-bold font-mono text-[10px]">({item.summary.novelCount} Novel)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${riskColor}`}>
                      Risk {item.riskScore}
                    </span>
                    <button
                      onClick={() => handleDownloadPdf(item.id)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-sky-600 transition cursor-pointer"
                      title="Download executive PDF audit report"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleLoadReport(item.id)}
                      disabled={isFetching}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 font-semibold text-xs text-white shadow-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isFetching ? "Loading..." : "Inspect Report"}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
