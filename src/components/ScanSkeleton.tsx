"use client";

export default function ScanSkeleton({ progressText, progressPercent, onSwitchLite }: { progressText?: string; progressPercent?: number; onSwitchLite?: () => void }) {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Slow network progress indicator */}
      {progressText && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
            <div>
              <span className="font-bold">{progressText}</span>
              {progressPercent !== undefined && (
                <span className="ml-2 font-mono text-[11px] text-sky-700 font-semibold">({progressPercent}%)</span>
              )}
            </div>
          </div>
          {onSwitchLite && (
            <button
              onClick={onSwitchLite}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-white border border-sky-300 hover:bg-sky-100 font-semibold text-xs text-sky-700 transition cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              ⚡ Switch to Lite Scan Mode
            </button>
          )}
        </div>
      )}

      {/* Target Meta Banner Skeleton */}
      <div className="bg-white border border-slate-200 px-5 py-3.5 rounded-xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-5 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="h-4 w-20 bg-slate-100 rounded hidden md:block" />
        </div>
        <div className="h-4 w-28 bg-slate-200 rounded" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Risk Gauge Skeleton */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-300 rounded" />
            <div className="h-3 w-20 bg-slate-200 rounded" />
          </div>
          <div className="h-16 w-16 rounded-full bg-slate-200" />
        </div>

        {/* Severity Count Skeleton */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-3 w-12 bg-slate-200 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-2 my-2">
            <div className="h-6 bg-slate-200 rounded-lg" />
            <div className="h-6 bg-slate-200 rounded-lg" />
            <div className="h-6 bg-slate-200 rounded-lg" />
            <div className="h-6 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-3 w-32 bg-slate-100 rounded" />
        </div>

        {/* Novel Bug Discovery Skeleton */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-3 w-20 bg-slate-200 rounded" />
            <div className="h-4 w-14 bg-slate-200 rounded" />
          </div>
          <div className="my-2 space-y-1.5">
            <div className="h-8 w-12 bg-slate-300 rounded" />
            <div className="h-3 w-28 bg-slate-200 rounded" />
          </div>
          <div className="h-3 w-24 bg-slate-100 rounded" />
        </div>

        {/* Disaster Exposure Skeleton */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-12 bg-slate-200 rounded" />
          </div>
          <div className="my-2 space-y-1.5">
            <div className="h-7 w-28 bg-slate-300 rounded" />
            <div className="h-3 w-36 bg-slate-200 rounded" />
          </div>
          <div className="h-3 w-32 bg-slate-100 rounded" />
        </div>
      </div>

      {/* Main Table Skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Category Tabs Skeleton */}
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex gap-3">
          <div className="h-6 w-24 bg-slate-200 rounded-lg" />
          <div className="h-6 w-28 bg-slate-200 rounded-lg" />
          <div className="h-6 w-20 bg-slate-200 rounded-lg" />
          <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="p-4 flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-slate-200 rounded" />
                <div className="h-5 w-16 bg-slate-300 rounded" />
                <div className="space-y-1">
                  <div className="h-4 w-64 bg-slate-300 rounded" />
                  <div className="h-3 w-36 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-20 bg-slate-200 rounded hidden md:block" />
                <div className="h-4 w-24 bg-slate-200 rounded hidden lg:block" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
