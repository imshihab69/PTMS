"use client";

import { useState } from "react";
import type { AuditEntry } from "@/components/Dashboard";
import { IconTimeline, IconRefresh, IconSearch } from "@/components/Icons";

function DiffDisplay({ before, after }: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }) {
  if (!before && !after) return null;

  const allKeys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);

  // Filter out timestamps and hashes
  const ignoredKeys = new Set(["createdAt", "updatedAt", "passwordHash", "password_hash"]);
  const changedKeys = Array.from(allKeys).filter((key) => {
    if (ignoredKeys.has(key)) return false;
    const bVal = before ? before[key] : undefined;
    const aVal = after ? after[key] : undefined;
    return JSON.stringify(bVal) !== JSON.stringify(aVal);
  });

  if (changedKeys.length === 0) return null;

  const formatKey = (k: string) =>
    k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      {changedKeys.map((key) => {
        const bVal = before ? before[key] : undefined;
        const aVal = after ? after[key] : undefined;
        return (
          <div key={key} className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-space-200 font-medium">{formatKey(key)}:</span>
            {bVal !== undefined && (
              <span className="bg-neon-rose/10 text-neon-rose px-2 py-0.5 rounded-md border border-neon-rose/20 font-mono line-through">
                {String(bVal || "—")}
              </span>
            )}
            {bVal !== undefined && aVal !== undefined && (
              <span className="text-space-400">→</span>
            )}
            {aVal !== undefined && (
              <span className="bg-neon-green/10 text-neon-green px-2 py-0.5 rounded-md border border-neon-green/20 font-mono">
                {String(aVal || "—")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const actionConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  CREATE: { color: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/30", label: "Created" },
  UPDATE: { color: "text-neon-blue", bg: "bg-neon-blue/10", border: "border-neon-blue/30", label: "Updated" },
  DELETE: { color: "text-neon-rose", bg: "bg-neon-rose/10", border: "border-neon-rose/30", label: "Deleted" },
  EXPORT: { color: "text-neon-amber", bg: "bg-neon-amber/10", border: "border-neon-amber/30", label: "Exported" },
  IMPORT: { color: "text-neon-cyan", bg: "bg-neon-cyan/10", border: "border-neon-cyan/30", label: "Imported" },
  ACTIVATE: { color: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/30", label: "Activated" },
  DEACTIVATE: { color: "text-neon-rose", bg: "bg-neon-rose/10", border: "border-neon-rose/30", label: "Deactivated" },
};

export function AuditView({ 
  entries,
  onRefresh 
}: { 
  entries: AuditEntry[];
  onRefresh?: () => void;
}) {
  const [filter, setFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = filter === "" || 
      entry.description?.toLowerCase().includes(filter.toLowerCase()) ||
      entry.entityId.toLowerCase().includes(filter.toLowerCase()) ||
      entry.userName?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesAction = actionFilter === "all" || entry.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  // Group by date
  const grouped: Record<string, AuditEntry[]> = {};
  filteredEntries.forEach((e) => {
    const dateKey = new Date(e.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(e);
  });

  const actionTypes = ["all", "CREATE", "UPDATE", "DELETE", "EXPORT", "IMPORT", "ACTIVATE", "DEACTIVATE"];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Audit Timeline</h2>
          <p className="text-space-200 text-sm mt-1">Complete record of all system changes</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn-magnetic flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-glass-border text-space-100 hover:text-neon-cyan hover:border-neon-cyan/20 text-sm font-medium transition-all w-fit"
          >
            <IconRefresh className="w-4 h-4" />
            Refresh
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="glass rounded-xl border border-glass-border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-space-400" />
            <input
              type="text"
              placeholder="Search audit entries..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          {/* Action filter */}
          <div className="flex flex-wrap gap-2">
            {actionTypes.map((action) => (
              <button
                key={action}
                onClick={() => setActionFilter(action)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  actionFilter === action
                    ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                    : "text-space-300 hover:text-white border border-transparent hover:border-glass-border"
                }`}
              >
                {action === "all" ? "All" : action}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-space-400 mb-4">
        Showing {filteredEntries.length} of {entries.length} entries
      </div>

      {filteredEntries.length === 0 ? (
        <div className="glass rounded-2xl border border-glass-border p-16 text-center">
          <IconTimeline className="w-12 h-12 text-space-400 mx-auto mb-4" />
          <p className="text-space-300">
            {entries.length === 0 ? "No audit entries yet" : "No entries match your filters"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([date, dayEntries]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-neon-cyan/20 to-transparent" />
                <span className="text-xs tracking-widest uppercase text-neon-cyan font-semibold whitespace-nowrap">{date}</span>
                <div className="h-px flex-1 bg-gradient-to-l from-neon-cyan/20 to-transparent" />
              </div>

              {/* Timeline nodes */}
              <div className="flex flex-col gap-0 pl-2">
                {dayEntries.map((entry) => {
                  const config = actionConfig[entry.action] || actionConfig.UPDATE;
                  return (
                    <div key={entry.id} className="timeline-node relative flex gap-4 pb-6">
                      {/* Node dot */}
                      <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center shrink-0 relative z-10`}>
                        <span className={`text-xs font-bold ${config.color}`}>
                          {entry.action.charAt(0)}
                        </span>
                      </div>

                      {/* Content card */}
                      <div className="flex-1 glass rounded-xl p-4 border border-glass-border hover:border-neon-cyan/10 transition-colors min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold tracking-wider uppercase ${config.color}`}>
                              {config.label}
                            </span>
                            <span className="text-[10px] text-space-400 font-mono">
                              {entry.entityType === "phone_record" ? "Phone Record" : "User"}
                            </span>
                          </div>
                          <span className="text-[10px] text-space-400 font-mono whitespace-nowrap">
                            {new Date(entry.createdAt).toLocaleTimeString()}
                          </span>
                        </div>

                        {entry.description && (
                          <p className="text-sm text-space-100 mt-1 break-words">{entry.description}</p>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-[10px] text-space-300 flex-wrap">
                          <span>by</span>
                          <span className="text-neon-cyan font-medium">{entry.userName || "System"}</span>
                          <span>•</span>
                          <span className="font-mono truncate max-w-[200px]">{entry.entityId}</span>
                        </div>

                        {/* Diff display */}
                        <DiffDisplay
                          before={entry.before as Record<string, unknown> | null}
                          after={entry.after as Record<string, unknown> | null}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
