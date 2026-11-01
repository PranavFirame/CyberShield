"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Trash2,
  X,
  RefreshCw,
  AlertCircle,
  Check,
  Users,
  BookOpen,
  HelpCircle,
  Mail,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  _count: { scans: number };
}

interface AdminArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: "DRAFT" | "PUBLISHED";
  readingTimeMinutes: number;
  publishedAt: string | null;
  createdAt: string;
}

interface AdminFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPublished: number;
  orderIndex: number;
}

interface AdminSubscriber {
  id: string;
  email: string;
  status: "ACTIVE" | "UNSUBSCRIBED";
  consentTimestamp: string;
  source: string;
}

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [tab, setTab] = useState<"USERS" | "ARTICLES" | "FAQS">("USERS");

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Articles state
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Vulnerability Research");
  const [newSummary, setNewSummary] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newStatus, setNewStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");

  // FAQs state
  const [faqs, setFaqs] = useState<AdminFaq[]>([]);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newFaqCategory, setNewFaqCategory] = useState("Repository Scanning");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (tab === "USERS") loadUsers();
      else if (tab === "ARTICLES") loadArticles();
      else if (tab === "FAQS") loadFaqs();
    }
  }, [isOpen, tab]);

  async function loadUsers() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load user list");
      setUsers(data.users || []);
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Load failed" });
    } finally {
      setLoading(false);
    }
  }

  async function loadArticles() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/articles");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load articles");
      setArticles(data.articles || []);
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Load failed" });
    } finally {
      setLoading(false);
    }
  }

  async function loadFaqs() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/faqs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load FAQs");
      setFaqs(data.faqs || []);
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Load failed" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(id: string, username: string) {
    if (username === "pranavfirame") {
      setMsg({ type: "error", text: "Master administrator account cannot be deleted." });
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${username}" and all their scans?`)) return;

    setDeletingUserId(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      setMsg({ type: "success", text: `User "${username}" was deleted.` });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to delete user" });
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handleCreateArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          summary: newSummary,
          content: newContent,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create article");

      setMsg({ type: "success", text: `Article "${newTitle}" created successfully.` });
      setShowAddArticle(false);
      setNewTitle("");
      setNewSummary("");
      setNewContent("");
      loadArticles();
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Create article failed" });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleArticleStatus(article: AdminArticle) {
    const nextStatus = article.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, status: nextStatus } : a))
      );
      setMsg({ type: "success", text: `Article set to ${nextStatus}.` });
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Update failed" });
    }
  }

  async function handleDeleteArticle(id: string, title: string) {
    if (!confirm(`Delete article "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setMsg({ type: "success", text: `Article "${title}" deleted.` });
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Delete failed" });
    }
  }

  async function handleCreateFaq(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: newQuestion,
          answer: newAnswer,
          category: newFaqCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create FAQ");

      setMsg({ type: "success", text: "New FAQ published." });
      setShowAddFaq(false);
      setNewQuestion("");
      setNewAnswer("");
      loadFaqs();
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Create FAQ failed" });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFaqPublish(faq: AdminFaq) {
    const nextVal = faq.isPublished === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/admin/faqs/${faq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: nextVal }),
      });
      if (!res.ok) throw new Error("Failed to update FAQ");
      setFaqs((prev) =>
        prev.map((f) => (f.id === faq.id ? { ...f, isPublished: nextVal } : f))
      );
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Update failed" });
    }
  }

  async function handleDeleteFaq(id: string) {
    if (!confirm("Delete this FAQ question?")) return;
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      setMsg({ type: "success", text: "FAQ deleted." });
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Delete failed" });
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Admin Control Center</h3>
              <p className="text-[11px] text-slate-500">Manage users, blog articles, and FAQ knowledge items</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (tab === "USERS") loadUsers();
                else if (tab === "ARTICLES") loadArticles();
                else if (tab === "FAQS") loadFaqs();
              }}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="grid grid-cols-3 border-b border-slate-200 text-xs font-semibold text-center bg-slate-50/30">
          <button
            onClick={() => setTab("USERS")}
            className={`py-3 flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
              tab === "USERS"
                ? "border-indigo-600 text-indigo-700 bg-indigo-50/20"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Users & RBAC ({users.length})</span>
          </button>

          <button
            onClick={() => setTab("ARTICLES")}
            className={`py-3 flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
              tab === "ARTICLES"
                ? "border-indigo-600 text-indigo-700 bg-indigo-50/20"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Blog CMS ({articles.length})</span>
          </button>

          <button
            onClick={() => setTab("FAQS")}
            className={`py-3 flex items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
              tab === "FAQS"
                ? "border-indigo-600 text-indigo-700 bg-indigo-50/20"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>FAQ Hub ({faqs.length})</span>
          </button>
        </div>

        {/* Banner notification */}
        {msg && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center gap-2 border-b ${
              msg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {msg.type === "success" ? <Check className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Tab 1: Users Table */}
        {tab === "USERS" && (
          <div className="flex-1 overflow-y-auto">
            {loading && users.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">Loading user registry...</div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">No users found in database</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Scans Performed</th>
                    <th className="px-4 py-3">Member Since</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isMaster = u.username === "pranavfirame";
                    const isDeleting = deletingUserId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 font-mono">{u.username}</span>
                            <span className="text-[11px] text-slate-400">{u.email || "No email linked"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              u.role === "ADMIN"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700 font-medium">
                          {u._count.scans} audits
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {isMaster ? (
                            <span className="text-[10px] text-slate-400 font-mono italic">Protected Admin</span>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              disabled={isDeleting}
                              className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3 text-rose-600" />
                              {isDeleting ? "Deleting..." : "Delete User"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Blog CMS */}
        {tab === "ARTICLES" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Published & Draft Security Research
              </span>
              <button
                onClick={() => setShowAddArticle((v) => !v)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{showAddArticle ? "Cancel" : "New Article"}</span>
              </button>
            </div>

            {showAddArticle && (
              <form onSubmit={handleCreateArticle} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Article Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. In-Depth Analysis of AST Call Graph Taint"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
                    >
                      <option value="Vulnerability Research">Vulnerability Research</option>
                      <option value="Application Security">Application Security</option>
                      <option value="API Security">API Security</option>
                      <option value="DevSecOps">DevSecOps</option>
                      <option value="Dependency Security">Dependency Security</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as "DRAFT" | "PUBLISHED")}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
                    >
                      <option value="PUBLISHED">Published (Live immediately)</option>
                      <option value="DRAFT">Draft (Under Review)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Summary / SEO Description</label>
                  <input
                    type="text"
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="Brief 1-2 sentence executive overview"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Content (Markdown supported)</label>
                  <textarea
                    required
                    rows={6}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="### Heading&#10;&#10;Write detailed technical research with code blocks..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Save & Publish Article
                </button>
              </form>
            )}

            <div className="space-y-2">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          art.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {art.status}
                      </span>
                      <span className="font-bold text-slate-900 truncate">{art.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {art.category} · {art.readingTimeMinutes} min read · /blog/{art.slug}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleArticleStatus(art)}
                      className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1 cursor-pointer"
                      title="Toggle Draft/Published"
                    >
                      {art.status === "PUBLISHED" ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      <span>{art.status === "PUBLISHED" ? "Unpublish" : "Publish"}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteArticle(art.id, art.title)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition rounded hover:bg-rose-50 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: FAQs Hub */}
        {tab === "FAQS" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                FAQ Knowledge Base Questions
              </span>
              <button
                onClick={() => setShowAddFaq((v) => !v)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{showAddFaq ? "Cancel" : "New Question"}</span>
              </button>
            </div>

            {showAddFaq && (
              <form onSubmit={handleCreateFaq} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Question</label>
                  <input
                    type="text"
                    required
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="e.g. How do I configure my scan budget?"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={newFaqCategory}
                    onChange={(e) => setNewFaqCategory(e.target.value)}
                    placeholder="e.g. Repository Scanning, AI Analysis, Risk Scoring"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Answer</label>
                  <textarea
                    required
                    rows={4}
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="Clear, authoritative explanation..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Save Question
                </button>
              </form>
            )}

            <div className="space-y-2">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          faq.isPublished
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {faq.isPublished ? "PUBLISHED" : "HIDDEN"}
                      </span>
                      <span className="font-bold text-slate-900 truncate">{faq.question}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{faq.answer}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleFaqPublish(faq)}
                      className="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-[11px] cursor-pointer"
                    >
                      {faq.isPublished ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition rounded hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
