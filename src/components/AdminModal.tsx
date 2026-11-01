"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Trash2, X, RefreshCw, UserCheck, AlertCircle, Check } from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  _count: { scans: number };
}

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

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

  async function handleDeleteUser(id: string, username: string) {
    if (username === "pranavfirame") {
      setMsg({ type: "error", text: "Master administrator account cannot be deleted." });
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${username}" and all their scans?`)) {
      return;
    }

    setDeletingId(id);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      setMsg({ type: "success", text: `User "${username}" was successfully deleted.` });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to delete user" });
    } finally {
      setDeletingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Admin Control Center</h3>
              <p className="text-[11px] text-slate-500">Manage registered users, permissions & system scans</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadUsers}
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

        {/* Banner notification */}
        {msg && (
          <div className={`px-6 py-2.5 text-xs flex items-center gap-2 border-b ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}>
            {msg.type === "success" ? <Check className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Users Table */}
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
                  const isDeleting = deletingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 font-mono">{u.username}</span>
                          <span className="text-[11px] text-slate-400">{u.email || "No email linked"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          u.role === "ADMIN"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
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
      </div>
    </div>
  );
}
