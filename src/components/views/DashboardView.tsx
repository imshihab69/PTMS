"use client";

import type { PhoneRecord, AuditEntry } from "@/components/Dashboard";
import { IconPunchBlock, IconSignalWave, IconUsers, IconTimeline, IconRefresh } from "@/components/Icons";

export function DashboardView({
  phones,
  auditEntries,
  userCount,
  onRefresh,
}: {
  phones: PhoneRecord[];
  auditEntries: AuditEntry[];
  userCount: number;
  onRefresh?: () => void;
}) {
  const activeCount = phones.filter((p) => p.status === "active").length;
  const inactiveCount = phones.filter((p) => p.status === "inactive").length;
  const maintenanceCount = phones.filter((p) => p.status === "maintenance").length;

  const departments = new Set(phones.map((p) => p.department).filter(Boolean));

  const recentAudit = auditEntries.slice(0, 5);

  const kpis = [
    {
      label: "Total Lines",
      value: phones.length,
      icon: IconPunchBlock,
      accent: "text-neon-cyan",
      glow: "text-glow-cyan",
      border: "border-neon-cyan/20",
      bg: "bg-neon-cyan/5",
    },
    {
      label: "Active",
      value: activeCount,
      icon: IconSignalWave,
      accent: "text-neon-green",
      glow: "",
      border: "border-neon-green/20",
      bg: "bg-neon-green/5",
    },
    {
      label: "Maintenance",
      value: maintenanceCount,
      icon: IconTimeline,
      accent: "text-neon-amber",
      glow: "",
      border: "border-neon-amber/20",
      bg: "bg-neon-amber/5",
    },
    {
      label: "Users",
      value: userCount || "—",
      icon: IconUsers,
      accent: "text-neon-blue",
      glow: "",
      border: "border-neon-blue/20",
      bg: "bg-neon-blue/5",
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Command Center</h2>
          <p className="text-space-200 text-sm mt-1">Infrastructure overview &amp; system metrics</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn-magnetic flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-glass-border text-space-100 hover:text-neon-cyan hover:border-neon-cyan/20 text-sm font-medium transition-all"
            title="Refresh data (Alt+R)"
          >
            <IconRefresh className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`glass rounded-xl md:rounded-2xl p-4 md:p-6 border ${kpi.border} ${kpi.bg} relative overflow-hidden group`}
          >
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity hidden md:block">
              <kpi.icon className="w-16 h-16" />
            </div>
            <div className={`w-8 md:w-9 h-8 md:h-9 rounded-lg ${kpi.bg} border ${kpi.border} flex items-center justify-center mb-3 md:mb-4`}>
              <kpi.icon className={`w-4 h-4 ${kpi.accent}`} />
            </div>
            <div className={`text-2xl md:text-4xl font-extrabold ${kpi.glow}`} style={{
              background: "linear-gradient(135deg, #fff 0%, var(--color-space-100) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
            </div>
            <p className="text-[10px] md:text-xs tracking-widest uppercase text-space-300 mt-1 md:mt-2">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Department breakdown */}
        <div className="glass rounded-2xl p-5 md:p-6 border border-glass-border">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <IconPunchBlock className="w-4 h-4 text-neon-cyan" />
            Department Distribution
          </h3>
          {departments.size === 0 ? (
            <p className="text-space-300 text-sm">No records yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Array.from(departments).slice(0, 8).map((dept) => {
                const count = phones.filter((p) => p.department === dept).length;
                const pct = Math.round((count / phones.length) * 100);
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-space-100 truncate pr-2">{dept}</span>
                      <span className="text-neon-cyan font-mono text-xs whitespace-nowrap">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-space-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neon-cyan to-neon-blue rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {departments.size > 8 && (
                <p className="text-xs text-space-400 mt-2">+{departments.size - 8} more departments</p>
              )}
            </div>
          )}

          {/* Status breakdown */}
          <div className="mt-6 pt-4 border-t border-glass-border">
            <div className="flex flex-wrap gap-3 md:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-neon-green" />
                <span className="text-xs text-space-200">Active: {activeCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-space-300" />
                <span className="text-xs text-space-200">Inactive: {inactiveCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-neon-amber" />
                <span className="text-xs text-space-200">Maintenance: {maintenanceCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="glass rounded-2xl p-5 md:p-6 border border-glass-border">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <IconTimeline className="w-4 h-4 text-neon-cyan" />
            Recent Activity
          </h3>
          {recentAudit.length === 0 ? (
            <p className="text-space-300 text-sm">No activity recorded</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentAudit.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-space-800/50 border border-glass-border hover:border-neon-cyan/10 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    entry.action === "CREATE" ? "bg-neon-green/10 text-neon-green border border-neon-green/20" :
                    entry.action === "UPDATE" ? "bg-neon-blue/10 text-neon-blue border border-neon-blue/20" :
                    entry.action === "DELETE" ? "bg-neon-rose/10 text-neon-rose border border-neon-rose/20" :
                    entry.action === "EXPORT" || entry.action === "IMPORT" ? "bg-neon-amber/10 text-neon-amber border border-neon-amber/20" :
                    "bg-space-600 text-space-200 border border-glass-border"
                  }`}>
                    {entry.action.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{entry.description}</p>
                    <p className="text-[10px] text-space-300 mt-0.5">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
         
  );
}
