import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";

export const metadata = {
  title: "Responsible Vulnerability Disclosure | CyberShield",
  description: "Guidelines and safe harbor commitments for security researchers reporting potential vulnerabilities in CyberShield.",
};

export default function ResponsibleDisclosurePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      <PublicNavbar />
      <div className="bg-white border-b border-slate-200 py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to CyberShield Home</span>
          </Link>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold tracking-wider font-mono uppercase">
              COORDINATED VULNERABILITY DISCLOSURE
            </span>
            <span className="text-xs text-slate-400">· Version 1.2</span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Responsible Security Disclosure
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
            We value the contributions of ethical security researchers and developers. If you discover a vulnerability in CyberShield, we commit to safe harbor and rapid coordinated remediation.
          </p>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex-1">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">1. Safe Harbor Commitment</h2>
            <p>
              If you conduct ethical security research in good faith and comply with these guidelines, CyberShield will not pursue civil or criminal action against you or request law enforcement investigation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">2. Research Ground Rules</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Do not access, modify, or destroy user data or scan reports that do not belong to you.</li>
              <li>Do not execute Denial of Service (DoS/DDoS) attacks against production infrastructure.</li>
              <li>Do not use physical security attacks, social engineering, or spam techniques against CyberShield personnel.</li>
              <li>Provide reasonable time for our team to resolve the issue before public disclosure (coordinated 90-day window).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">3. How to Submit a Report</h2>
            <p>
              Please submit detailed technical findings including step-by-step reproduction instructions and proof-of-concept diffs to:
              <br />
              <a href="mailto:security@cybershield.dev" className="text-sky-600 font-bold hover:underline">
                security@cybershield.dev
              </a>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Our defensive incident response team acknowledges all initial submissions within 24 hours.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
