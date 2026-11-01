"use client";

import { useState } from "react";
import { User, KeyRound, Trash2, X, AlertTriangle, Check, Shield } from "lucide-react";

interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  role: "USER" | "ADMIN";
}

interface ProfileModalProps {
  isOpen: boolean;
  user: AuthUser;
  onClose: () => void;
  onUserUpdated: (updatedUser: AuthUser) => void;
  onAccountDeleted: () => void;
}

export default function ProfileModal({
  isOpen,
  user,
  onClose,
  onUserUpdated,
  onAccountDeleted,
}: ProfileModalProps) {
  const [newUsername, setNewUsername] = useState(user.username);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [usernameLoading, setUsernameLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const isMasterAdmin = user.username === "pranavfirame";

  async function handleUpdateUsername(e: React.FormEvent) {
    e.preventDefault();
    setUsernameLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update username");

      onUserUpdated(data.user);
      setMsg({ type: "success", text: "Username updated successfully!" });
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setUsernameLoading(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ type: "error", text: "New passwords do not match" });
      return;
    }

    setPasswordLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMsg({ type: "success", text: "Password changed successfully!" });
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Password update failed" });
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/user/delete-account", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");

      onAccountDeleted();
      onClose();
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Deletion failed" });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-sky-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Settings & Security</h3>
              <p className="text-[11px] text-slate-500">Manage credentials and profile controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {msg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                msg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {msg.type === "success" ? <Check className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Account Role Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Signed in as</span>
              <span className="text-sm font-bold text-slate-900 font-mono">{user.username}</span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border ${
              user.role === "ADMIN"
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-sky-50 text-sky-700 border-sky-200"
            }`}>
              {user.role === "ADMIN" ? "ADMINISTRATOR" : "STANDARD USER"}
            </span>
          </div>

          {/* 1. Update Username */}
          <form onSubmit={handleUpdateUsername} className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" /> Change Username
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-600"
              />
              <button
                type="submit"
                disabled={usernameLoading || newUsername === user.username}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 font-semibold text-xs text-white rounded-xl disabled:opacity-40 transition cursor-pointer"
              >
                {usernameLoading ? "Updating..." : "Save Username"}
              </button>
            </div>
          </form>

          <hr className="border-slate-200" />

          {/* 2. Change Password */}
          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-slate-400" /> Change Password
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-600"
              />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-600"
              />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-sky-600"
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading || !currentPassword || !newPassword}
              className="mt-1 py-2 bg-sky-600 hover:bg-sky-500 font-semibold text-xs text-white rounded-xl disabled:opacity-40 transition cursor-pointer"
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>

          <hr className="border-slate-200" />

          {/* 3. Danger Zone: Delete Account */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 flex flex-col gap-3">
            <div>
              <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Danger Zone: Delete Account
              </h4>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                {isMasterAdmin
                  ? "The master administrator account (pranavfirame) is protected and cannot be deleted."
                  : "Permanently delete your profile and associated scan history. This action cannot be undone."}
              </p>
            </div>

            {!isMasterAdmin && (
              <>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="self-start px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition cursor-pointer"
                  >
                    Delete My Account
                  </button>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={deleteLoading}
                      onClick={handleDeleteAccount}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition cursor-pointer"
                    >
                      {deleteLoading ? "Deleting..." : "Yes, Permanently Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
