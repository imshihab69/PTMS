"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SessionUser } from "@/app/page";
import { ToastContainer } from "./Toast";
import { Sidebar } from "./Sidebar";
import { DashboardView } from "./views/DashboardView";
import { PhoneRecordsView } from "./views/PhoneRecordsView";
import { UsersView } from "./views/UsersView";
import { AuditView } from "./views/AuditView";
import { IconMenu, IconClose } from "./Icons";

export type PhoneRecord = {
  phoneNumber: string;
  idfPair: string | null;
  idfCable: string | null;
  mdfPair: string | null;
  mdfBlock: string | null;
  department: string | null;
  status: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditEntry = {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  userId: number;
  userName: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  description: string | null;
  createdAt: string;
};

export type UserRecord = {
  id: number;
  username: string;
  fullName: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ViewType = "dashboard" | "phones" | "users" | "audit";

export function Dashboard({
  user,
  onLogout,
}: {
  user: SessionUser;
  onLogout: () => void;
}) {
  const [view, setView] = useState<ViewType>("dashboard");
  const [phones, setPhones] = useState<PhoneRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Track last refresh times
  const lastRefresh = useRef<{ phones: number; users: number; audit: number }>({
    phones: 0,
    users: 0,
    audit: 0,
  });

  const fetchPhones = useCallback(async (search = "") => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/phones?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPhones(data.records);
        lastRefresh.current.phones = Date.now();
      }
    } catch (error) {
      console.error("Failed to fetch phones:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (user.role !== "admin") return;
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users);
        lastRefresh.current.users = Date.now();
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, [user.role]);

  const fetchAudit = useCallback(async () => {
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        setAuditEntries(data.entries);
        lastRefresh.current.audit = Date.now();
      }
    } catch (error) {
      console.error("Failed to fetch audit:", error);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPhones(), fetchUsers(), fetchAudit()]);
    setLoading(false);
  }, [fetchPhones, fetchUsers, fetchAudit]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto-refresh every 60 seconds when visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchPhones();
        fetchAudit();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchPhones, fetchAudit]);

  // Handle view change
  const handleViewChange = (newView: ViewType) => {
    setView(newView);
    setMobileSidebarOpen(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only if not in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }

      // Alt + number to switch views
      if (e.altKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            setView("dashboard");
            break;
          case "2":
            e.preventDefault();
            setView("phones");
            break;
          case "3":
            if (user.role === "admin") {
              e.preventDefault();
              setView("users");
            }
            break;
          case "4":
            e.preventDefault();
            setView("audit");
            break;
          case "r":
            e.preventDefault();
            refreshAll();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user.role, refreshAll]);

  return (
    <div className="min-h-screen flex">
      <ToastContainer />
      
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-[80] w-10 h-10 rounded-xl glass border border-glass-border flex items-center justify-center text-white"
        aria-label="Toggle menu"
      >
        {mobileSidebarOpen ? (
          <IconClose className="w-5 h-5" />
        ) : (
          <IconMenu className="w-5 h-5" />
        )}
      </button>

      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[45]"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - responsive */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <Sidebar
          user={user}
          currentView={view}
          onViewChange={handleViewChange}
          onLogout={onLogout}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 p-4 md:p-8 overflow-y-auto min-h-screen">
        {/* Mobile header spacing */}
        <div className="h-14 lg:hidden" />
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
              <p className="text-space-200 text-sm">Loading data...</p>
            </div>
          </div>
        ) : (
          <>
            {view === "dashboard" && (
              <DashboardView
                phones={phones}
                auditEntries={auditEntries}
                userCount={allUsers.length}
                onRefresh={refreshAll}
              />
            )}
            {view === "phones" && (
              <PhoneRecordsView
                phones={phones}
                onRefresh={fetchPhones}
                onRefreshAudit={fetchAudit}
                user={user}
              />
            )}
            {view === "users" && user.role === "admin" && (
              <UsersView
                users={allUsers}
                currentUser={user}
                onRefresh={() => {
                  fetchUsers();
                  fetchAudit();
                }}
              />
            )}
            {view === "audit" && (
              <AuditView entries={auditEntries} onRefresh={fetchAudit} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
