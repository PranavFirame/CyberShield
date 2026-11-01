import Link from "next/link";
import { Shield, ArrowLeft, Lock } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | CyberShield Legal & Trust Center",
  description: "CyberShield data collection, zero-execution processing, tenant isolation, and GDPR/CCPA privacy rights.",
};

export default function PrivacyPolicyPage() {
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
              LEGAL & TRUST CENTER
            </span>
            <span className="text-xs text-slate-400">· Effective Date: November 1, 2026</span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            CyberShield Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
            How we protect your personal identity, scan records, repository metadata, and AI assistant interactions under strict zero-execution privacy guarantees.
          </p>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex-1">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">1. The Zero-Execution Sandbox Promise</h2>
            <p>
              CyberShield analyzes publicly accessible repositories and web perimeters. We operate a strict <strong>Zero-Execution Sandbox</strong>.
              We never run package installation scripts (such as <code>npm install</code>, <code>pip install</code>), we do not execute scanned application code, and we do not spin up runtime containers running third-party source files. All scanning is performed via static Abstract Syntax Tree (AST) parsing and taint graph modeling.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Account Credentials:</strong> Username, email (optional for basic accounts), and cryptographically hashed passwords (using bcrypt with work factor 10).</li>
              <li><strong>GitHub Profile Metadata:</strong> When you authenticate with your GitHub handle, we store your public username to fetch your public repositories on demand.</li>
              <li><strong>Scan Records & Reports:</strong> Public target URLs, commit SHAs, calculated risk scores, findings summaries, and disaster exposure assumptions.</li>
              <li><strong>Newsletter Subscriptions:</strong> Email address, explicit marketing consent timestamp, and subscription source.</li>
              <li><strong>Support Inquiries:</strong> Messages delivered to the AI support assistant or human support email.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">3. Strict Multi-Tenant Data Isolation</h2>
            <p>
              Your audit history is private to your authenticated user account. Our database layer strictly enforces tenant scoping (<code>where: {"{ userId: session.id }"}</code>).
              No user can view, search, or inspect scan records belonging to another user. Requests attempting to inspect unowned scan records are rejected with HTTP 403 Forbidden.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">4. AI Support Chatbot Data Handling</h2>
            <p>
              The CyberShield AI Support Assistant is grounded exclusively in public product specifications, technical architecture guides (/docs), and platform FAQs.
              We <strong>never</strong> transmit your repository source code, private scan findings, or database credentials to public LLM training sets or external chat providers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">5. Newsletter Subscriptions & Opt-Out Rights</h2>
            <p>
              Newsletter subscriptions require explicit opt-in consent. We do not automatically subscribe users upon account registration.
              Subscribers can unsubscribe instantly at any time by clicking the unsubscribe link present in every dispatch or via our self-service unsubscribe endpoint at <code>/api/newsletter/unsubscribe</code>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">6. Data Retention & Right to Erasure (GDPR / CCPA)</h2>
            <p>
              You maintain full ownership of your data. Under your Account Settings, you may permanently delete your account at any time.
              Executing an account deletion triggers an irreversible cascade deletion of all user records, sessions, and associated scan reports from our SQLite database.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-2">7. Contact the Security & Privacy Officer</h2>
            <p>
              For privacy inquiries, audit questions, or data protection requests, please contact our team at:
              <br />
              <a href="mailto:privacy@cybershield.dev" className="text-sky-600 font-semibold hover:underline">
                privacy@cybershield.dev
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
