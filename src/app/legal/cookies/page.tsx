import Link from "next/link";
import { ArrowLeft, Cookie } from "lucide-react";

export const metadata = {
  title: "Cookie & Tracking Policy | CyberShield",
  description: "Disclosures regarding essential authentication cookies and zero third-party advertising tracking on CyberShield.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
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
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold tracking-wider font-mono uppercase">
              COOKIE NOTICE
            </span>
            <span className="text-xs text-slate-400">· Effective Date: November 1, 2026</span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Cookie & Tracking Policy
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
            CyberShield believes in minimal, privacy-first web design. We use strictly necessary cookies to keep you signed in securely.
          </p>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex-1">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">1. Strictly Necessary Cookies</h2>
            <p>
              We only place cookies that are technically essential for you to navigate the website and use core security features:
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-700 text-xs font-bold">
                  <tr>
                    <th className="p-3 border-b border-slate-200">Cookie Name</th>
                    <th className="p-3 border-b border-slate-200">Purpose</th>
                    <th className="p-3 border-b border-slate-200">Lifespan</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-mono font-semibold text-sky-700">cybershield_token</td>
                    <td className="p-3">HTTP-only JWT session cookie used to authenticate user requests and maintain tenant isolation.</td>
                    <td className="p-3">7 Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">2. Zero Third-Party Advertising Trackers</h2>
            <p>
              We do not sell user data, we do not embed third-party advertising tracking pixels (such as Meta Pixel or cross-site retargeting cookies), and we respect your browser's Global Privacy Control (GPC) and Do-Not-Track headers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">3. Managing Your Cookies</h2>
            <p>
              You can control or delete cookies directly within your web browser settings. Please note that disabling the <code>cybershield_token</code> cookie will prevent you from signing in to view your scan history or managing your profile.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
