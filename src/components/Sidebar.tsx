"use client";

import type { SessionUser } from "@/app/page";
import type { ViewType } from "./Dashboard";
import {
  IconDashboard,
  IconPunchBlock,
  IconUsers,
  IconTimeline,
  IconLogout,
  IconTerminal,
  IconSignalWave,
} from "./Icons";

const navItems: { id: ViewType; label: string; shortLabel: string; icon: typeof IconDashboard; adminOnly?: boolean }[] = [
  { id: "dashboard", label: "Command Center", shortLabel: "Dashboard", icon: IconDashboard },
  { id: "phones", label: "Phone Records", shortLabel: "Phones", icon: IconPunchBlock },
  { id: "users", label: "User Control", shortLabel: "Users", icon: IconUsers, adminOnly: true },
{ id: "audit", label: "Audit Timeline", shortLabel: "Audit", icon: IconTimeline, adminOnly: true },];

export function Sidebar({
  user,
  currentView,
  onViewChange,
  onLogout,
}: {
  user: SessionUser;
  currentView: ViewType;
  onViewChange: (v: ViewType) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="h-screen w-64 glass-strong border-r border-glass-border flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-glass-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center">
            <IconTerminal className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">PTMS</h1>
            <div className="flex items-center gap-1">
              <IconSignalWave className="w-3 h-3 text-neon-cyan" />
              <span className="text-[9px] tracking-[0.2em] uppercase text-space-300">TERMINAL MGMT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && user.role !== "admin") return null;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`btn-magnetic flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                isActive
                  ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                  : "text-space-200 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User info & logout */}
      <div className="px-4 py-4 border-t border-glass-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-cyan/60 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
            <p className="text-[10px] tracking-widest uppercase text-space-300">
              {user.role === "admin" ? "Administrator" : "Viewer"}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="btn-magnetic flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-space-200 hover:text-neon-rose hover:bg-neon-rose/10 border border-transparent hover:border-neon-rose/20 transition-all w-full"
        >
          <IconLogout className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
