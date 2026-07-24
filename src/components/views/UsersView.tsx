"use client";

import { useState, type FormEvent } from "react";
import type { UserRecord } from "@/components/Dashboard";
import type { SessionUser } from "@/app/page";
import { showToast } from "@/components/Toast";
import { IconPlus, IconEdit, IconClose, IconShield, IconUsers, IconSearch, IconRefresh } from "@/components/Icons";

type DrawerMode = "create" | "edit" | null;

const emptyForm = {
  username: "",
  password: "",
  fullName: "",
  role: "viewer",
};

export function UsersView({
  users,
  currentUser,
  onRefresh,
}: {
  users: UserRecord[];
  currentUser: SessionUser;
  onRefresh: () => void;
}) {
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const openCreate = () => {
    setForm(emptyForm);
    setDrawerMode("create");
    setEditUserId(null);
  };

  const openEdit = (u: UserRecord) => {
    setForm({
      username: u.username,
      password: "",
      fullName: u.fullName,
      role: u.role,
    });
    setEditUserId(u.id);
    setDrawerMode("edit");
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setEditUserId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (drawerMode === "create") {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Failed to create user", "error");
        } else {
          showToast(`User ${form.fullName} created`, "success");
          closeDrawer();
          onRefresh();
        }
      } else if (drawerMode === "edit" && editUserId) {
        const payload: Record<string, string> = {
          fullName: form.fullName,
          role: form.role,
        };
        if (form.password) payload.password = form.password;

        const res = await fetch(`/api/users/${editUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Failed to update user", "error");
        } else {
          showToast(`User ${form.fullName} updated`, "success");
          closeDrawer();
          onRefresh();
        }
      }
    } catch {
      showToast("Connection error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (u: UserRecord) => {
    const newActive = !u.active;
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to toggle status", "error");
      } else {
        showToast(
          `${u.fullName} ${newActive ? "activated" : "deactivated"}`,
          newActive ? "success" : "info"
        );
        onRefresh();
      }
    } catch {
      showToast("Connection error", "error");
    }
  };

  // Check if user is last admin
  const activeAdminCount = users.filter((u) => u.role === "admin" && u.active).length;

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = search === "" ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">User Control</h2>
          <p className="text-space-200 text-sm mt-1">Manage system users &amp; access levels</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="btn-magnetic flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-glass-border text-space-100 hover:text-neon-cyan hover:border-neon-cyan/20 text-sm font-medium transition-all"
          >
            <IconRefresh className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={openCreate}
            className="btn-magnetic flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-white text-sm font-semibold transition-all"
          >
            <IconPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add User</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl border border-glass-border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-space-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "admin", "viewer"].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  roleFilter === role
                    ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                    : "text-space-300 hover:text-white border border-transparent hover:border-glass-border"
                }`}
              >
                {role === "all" ? "All Roles" : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6 text-xs text-space-400">
        <span>Total: {users.length}</span>
        <span>•</span>
        <span>Active: {users.filter(u => u.active).length}</span>
        <span>•</span>
        <span>Admins: {users.filter(u => u.role === "admin").length}</span>
      </div>

      {/* User cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full glass rounded-2xl border border-glass-border p-16 text-center">
            <IconUsers className="w-12 h-12 text-space-400 mx-auto mb-4" />
            <p className="text-space-300">
              {users.length === 0 ? "No users yet" : "No users match your filters"}
            </p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isSelf = u.id === currentUser.id;
            const isLastAdmin = u.role === "admin" && u.active && activeAdminCount <= 1;
            const canDeactivate = !isSelf && !isLastAdmin;

            return (
              <div
                key={u.id}
                className={`glass rounded-2xl p-5 border transition-all ${
                  u.active
                    ? "border-glass-border hover:border-neon-cyan/15"
                    : "border-neon-rose/10 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                        u.active
                          ? "bg-gradient-to-br from-neon-cyan/20 to-neon-blue/20 text-neon-cyan border border-neon-cyan/20"
                          : "bg-space-700 text-space-300 border border-glass-border"
                      }`}
                    >
                      {u.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{u.fullName}</p>
                      <p className="text-xs text-space-300 font-mono truncate">@{u.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {u.role === "admin" && (
                      <div className="w-6 h-6 rounded-md bg-neon-amber/10 border border-neon-amber/20 flex items-center justify-center" title="Admin">
                        <IconShield className="w-3 h-3 text-neon-amber" />
                      </div>
                    )}
                    <div
                      className={`w-2 h-2 rounded-full ${u.active ? "bg-neon-green pulse-dot" : "bg-space-400"}`}
                      title={u.active ? "Active" : "Inactive"}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-space-300 mb-4">
                  <IconUsers className="w-3 h-3" />
                  {u.role === "admin" ? "Administrator" : "Viewer"}
                  <span className="mx-1">•</span>
                  {u.active ? "Active" : "Deactivated"}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(u)}
                    className="btn-magnetic flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-semibold hover:bg-neon-blue/20 transition-all"
                  >
                    <IconEdit className="w-3 h-3" />
                    Edit
                  </button>

                  {u.active ? (
                    <button
                      onClick={() => canDeactivate && toggleActive(u)}
                      disabled={!canDeactivate}
                      title={
                        isSelf
                          ? "Cannot deactivate your own account"
                          : isLastAdmin
                          ? "Cannot deactivate the last admin"
                          : "Deactivate user"
                      }
                      className={`btn-magnetic flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        canDeactivate
                          ? "bg-neon-rose/10 border border-neon-rose/20 text-neon-rose hover:bg-neon-rose/20"
                          : "bg-space-700 border border-glass-border text-space-400 cursor-not-allowed opacity-50"
                      }`}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleActive(u)}
                      className="btn-magnetic flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-semibold hover:bg-neon-green/20 transition-all"
                    >
                      Activate
                    </button>
                  )}
                </div>

                {isSelf && (
                  <div className="mt-3 text-[9px] text-space-300 text-center tracking-wider uppercase">
                    ← This is you
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── User Drawer ─────────────────────────────────────────── */}
      {drawerMode && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={closeDrawer}
          />
          <div className="fixed top-0 right-0 h-screen w-full max-w-lg glass-strong border-l border-glass-border z-[70] drawer-enter flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-glass-border">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {drawerMode === "create" ? "New User" : "Edit User"}
                </h3>
                <p className="text-xs text-space-300 mt-0.5">
                  {drawerMode === "create"
                    ? "Create a new system user"
                    : `Editing @${form.username}`}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="btn-magnetic w-9 h-9 rounded-xl bg-space-700 border border-glass-border flex items-center justify-center text-space-200 hover:text-white transition-all"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
              {drawerMode === "create" && (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">Username</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="e.g., jsmith"
                    required
                    className="w-full"
                    autoComplete="off"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g., John Smith"
                  required
                  className="w-full"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">
                  Password {drawerMode === "edit" && <span className="text-space-400">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required={drawerMode === "create"}
                  className="w-full"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full"
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Administrator</option>
                </select>
                <p className="text-xs text-space-400 mt-2">
                  {form.role === "admin" 
                    ? "Administrators can manage users, import data, and perform all actions" 
                    : "Viewers can view and manage phone records, but cannot manage users"}
                </p>
              </div>

              <div className="flex gap-3 pt-2 mt-auto">
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="btn-magnetic flex-1 py-3 rounded-xl glass border border-glass-border text-space-200 font-medium text-sm hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-magnetic flex-1 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-white font-semibold text-sm disabled:opacity-50 transition-all"
                >
                  {submitting ? "Saving..." : drawerMode === "create" ? "Create User" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
