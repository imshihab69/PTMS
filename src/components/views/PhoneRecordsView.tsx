"use client";

import { useState, useCallback, useRef, type FormEvent, type ChangeEvent } from "react";
import type { PhoneRecord } from "@/components/Dashboard";
import type { SessionUser } from "@/app/page";
import { showToast } from "@/components/Toast";
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconExport,
  IconImport,
  IconLock,
  IconClose,
  IconChevronUp,
  IconChevronDown,
  IconRefresh,
} from "@/components/Icons";

type DrawerMode = "create" | "edit" | "import" | null;
type SortField = "phoneNumber" | "department" | "status" | "updatedAt";
type SortDir = "asc" | "desc";

const emptyForm = {
  phoneNumber: "",
  idfPair: "",
  idfBlock: "",
  mdfPair: "",
  mdfCable: "",
  location: "", 
  department: "",
  status: "active",
  note: "",
};

export function PhoneRecordsView({
  phones,
  onRefresh,
  onRefreshAudit,
  user,
}: {
  phones: PhoneRecord[];
  onRefresh: (search?: string) => Promise<void>;
  onRefreshAudit: () => void;
  user: SessionUser;
}) {
  const [search, setSearch] = useState("");
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("phoneNumber");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [importMode, setImportMode] = useState<"skip" | "update">("skip");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const handleSearch = useCallback(
    (val: string) => {
      setSearch(val);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        onRefresh(val);
      }, 300);
    },
    [onRefresh]
  );

  const openCreate = () => {
    setForm(emptyForm);
    setDrawerMode("create");
  };

  const openEdit = (record: PhoneRecord) => {
    setForm({
      phoneNumber: record.phoneNumber,
      idfPair: record.idfPair || "",
      idfBlock: record.idfBlock || "",
      mdfPair: record.mdfPair || "",
      mdfCable: record.mdfCable || "",
      location: record.location || "",
      department: record.department || "",
      status: record.status || "active",
      note: record.note || "",
    });
    setDrawerMode("edit");
  };

  const openImport = () => {
    setDrawerMode("import");
    setImportMode("skip");
  };

  const closeDrawer = () => {
    setDrawerMode(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (drawerMode === "create") {
        const res = await fetch("/api/phones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Failed to create", "error");
        } else {
          showToast(`Phone record ${form.phoneNumber} created`, "success");
          closeDrawer();
          onRefresh(search);
          onRefreshAudit();
        }
      } else if (drawerMode === "edit") {
        const res = await fetch(`/api/phones/${encodeURIComponent(form.phoneNumber)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Failed to update", "error");
        } else {
          showToast(`Phone record ${form.phoneNumber} updated`, "success");
          closeDrawer();
          onRefresh(search);
          onRefreshAudit();
        }
      }
    } catch {
      showToast("Connection error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (phoneNumber: string) => {
    try {
      const res = await fetch(`/api/phones/${encodeURIComponent(phoneNumber)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(`Phone record ${phoneNumber} deleted`, "success");
        setDeleteConfirm(null);
        onRefresh(search);
        onRefreshAudit();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete", "error");
      }
    } catch {
      showToast("Connection error", "error");
    }
  };

  const handleExport = () => {
    window.open("/api/export", "_blank");
    showToast("Exporting phone records to XLSX", "info");
    setTimeout(() => onRefreshAudit(), 1000);
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", importMode);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) {
        showToast(data.error || "Import failed", "error");
      } else {
        const msg = `Import complete: ${data.created} created, ${data.updated} updated, ${data.skipped} skipped`;
        showToast(msg, "success");
        closeDrawer();
        onRefresh(search);
        onRefreshAudit();
      }
    } catch {
      showToast("Import failed", "error");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Sort and filter
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filteredPhones = phones
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      
      switch (sortField) {
        case "phoneNumber":
          aVal = a.phoneNumber;
          bVal = b.phoneNumber;
          break;
        case "department":
          aVal = a.department || "";
          bVal = b.department || "";
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "updatedAt":
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
      }

      if (typeof aVal === "string") {
        return sortDir === "asc" 
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      return sortDir === "asc" ? aVal - (bVal as number) : (bVal as number) - aVal;
    });

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "bg-neon-green/10 text-neon-green border-neon-green/30";
      case "inactive": return "bg-space-500/30 text-space-200 border-space-400/30";
      case "maintenance": return "bg-neon-amber/10 text-neon-amber border-neon-amber/30";
      default: return "bg-space-600 text-space-200 border-space-400/30";
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" 
      ? <IconChevronUp className="w-3 h-3 ml-1 inline" />
      : <IconChevronDown className="w-3 h-3 ml-1 inline" />;
  };

  return (
    <div className="animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Phone Records</h2>
          <p className="text-space-200 text-sm mt-1">Manage terminal infrastructure records</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <button
            onClick={() => onRefresh(search)}
            className="btn-magnetic flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl glass border border-glass-border text-space-100 hover:text-neon-cyan hover:border-neon-cyan/20 text-sm font-medium transition-all"
            title="Refresh"
          >
            <IconRefresh className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {user.role === "admin" && (
            <button
              onClick={openImport}
              className="btn-magnetic flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl glass border border-glass-border text-space-100 hover:text-neon-amber hover:border-neon-amber/20 text-sm font-medium transition-all"
            >
              <IconImport className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
          )}
          <button
            onClick={handleExport}
            className="btn-magnetic flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl glass border border-glass-border text-space-100 hover:text-neon-cyan hover:border-neon-cyan/20 text-sm font-medium transition-all"
          >
            <IconExport className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={openCreate}
            className="btn-magnetic flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-white text-sm font-semibold transition-all"
          >
            <IconPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Record</span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6 relative">
        <div className="glass-strong rounded-xl md:rounded-2xl border border-glass-border p-1 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
          <div className="flex items-center flex-1 gap-3">
            <div className="pl-3 md:pl-4">
              <IconSearch className="w-5 h-5 text-neon-cyan" />
            </div>
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 !bg-transparent !border-none !shadow-none text-sm md:text-base !p-2 md:!p-3"
            />
          </div>
          <div className="flex items-center gap-2 px-2 md:pr-3 pb-2 md:pb-0 overflow-x-auto">
            {(["all", "active", "inactive", "maintenance"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  statusFilter === s
                    ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                    : "text-space-300 hover:text-white border border-transparent"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block glass rounded-2xl border border-glass-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border">
                <th 
                  className="px-5 py-3.5 text-left text-[10px] tracking-widest uppercase text-space-300 font-semibold cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("phoneNumber")}
                >
                  Phone Number <SortIcon field="phoneNumber" />
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] tracking-widest uppercase text-space-300 font-semibold">IDF Pair</th>
                <th className="px-5 py-3.5 text-left text-[10px] tracking-widest uppercase text-space-300 font-semibold">IDF Block</th>
                <th className="px-5 py-3.5 text-left text-[10px] tracking-widest uppercase text-space-300 font-semibold">MDF Pair</th>
                <th className="px-5 py-3.5 text-left text-[10px] tracking-widest uppercase text-space-300 font-semibold">MDF Cable</th>
                <th className="px-5 py-3.5 text-left text-[10px] tracking-widest uppercase text-space-300 font-semibold">Location</th>

                <th 
                  className="px-5 py-3.5 text-left text-[10px] tracking-widest uppercase text-space-300 font-semibold cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("department")}
                >
                  Department <SortIcon field="department" />
                </th>
                <th 
                  className="px-5 py-3.5 text-left text-[10px] tracking-widest uppercase text-space-300 font-semibold cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("status")}
                >
                  Status <SortIcon field="status" />
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] tracking-widest uppercase text-space-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPhones.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-space-300">
                    <div className="flex flex-col items-center gap-2">
                      <IconSearch className="w-8 h-8 text-space-400" />
                      <p className="text-sm">No records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPhones.map((record) => (
                  <tr
                    key={record.phoneNumber}
                    className="border-b border-glass-border/50 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm font-semibold text-neon-cyan">
                        {record.phoneNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-space-100 font-mono">{record.idfPair || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-space-100 font-mono">{record.idfBlock || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-space-100 font-mono">{record.mdfPair || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-space-100 font-mono">{record.mdfCable || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-space-100">{record.location || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-space-100">{record.department || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wider uppercase border ${statusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(record)}
                          className="btn-magnetic w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue hover:bg-neon-blue/20 transition-all"
                          title="Edit"
                        >
                          <IconEdit className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirm === record.phoneNumber ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(record.phoneNumber)}
                              className="btn-magnetic px-2.5 h-8 rounded-lg bg-neon-rose/20 border border-neon-rose/30 text-neon-rose text-xs font-semibold hover:bg-neon-rose/30 transition-all"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="btn-magnetic w-8 h-8 rounded-lg bg-space-600 border border-glass-border flex items-center justify-center text-space-200 hover:text-white transition-all"
                            >
                              <IconClose className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(record.phoneNumber)}
                            className="btn-magnetic w-8 h-8 rounded-lg bg-neon-rose/10 border border-neon-rose/20 flex items-center justify-center text-neon-rose hover:bg-neon-rose/20 transition-all"
                            title="Delete"
                          >
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card view - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredPhones.length === 0 ? (
          <div className="glass rounded-xl border border-glass-border p-8 text-center">
            <IconSearch className="w-8 h-8 text-space-400 mx-auto mb-2" />
            <p className="text-sm text-space-300">No records found</p>
          </div>
        ) : (
          filteredPhones.map((record) => (
            <div
              key={record.phoneNumber}
              className="glass rounded-xl border border-glass-border p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="font-mono text-lg font-bold text-neon-cyan">
                    {record.phoneNumber}
                  </span>
                  <p className="text-xs text-space-300 mt-0.5">{record.department || "No department"}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wider uppercase border ${statusColor(record.status)}`}>
                  {record.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <span className="text-space-400">IDF Pair:</span>{" "}
                  <span className="text-space-100 font-mono">{record.idfPair || "—"}</span>
                </div>
                <div>
                  <span className="text-space-400">IDF Block:</span>{" "}
                  <span className="text-space-100 font-mono">{record.idfBlock || "—"}</span>
                </div>
                <div>
                  <span className="text-space-400">MDF Pair:</span>{" "}
                  <span className="text-space-100 font-mono">{record.mdfPair || "—"}</span>
                </div>
                <div>
                  <span className="text-space-400">MDF Cable:</span>{" "}
                  <span className="text-space-100 font-mono">{record.mdfCable || "—"}</span>
                </div>
                <div>
                  <span className="text-space-400">Location:</span>{" "}
                  <span className="text-space-100 font-mono">{record.location || "—"}</span>
               </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(record)}
                  className="btn-magnetic flex-1 py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(record.phoneNumber)}
                  className="btn-magnetic py-2 px-4 rounded-lg bg-neon-rose/10 border border-neon-rose/20 text-neon-rose text-xs font-semibold"
                >
                  Delete
                </button>
              </div>
              {deleteConfirm === record.phoneNumber && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleDelete(record.phoneNumber)}
                    className="flex-1 py-2 rounded-lg bg-neon-rose text-white text-xs font-semibold"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 rounded-lg bg-space-600 text-space-200 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Count */}
      <div className="mt-3 text-xs text-space-300 px-1">
        Showing {filteredPhones.length} of {phones.length} records
      </div>

      {/* ─── Sliding Drawer ─────────────────────────────────────────── */}
      {drawerMode && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={closeDrawer}
          />
          {/* Drawer panel */}
          <div className="fixed top-0 right-0 h-screen w-full max-w-lg glass-strong border-l border-glass-border z-[70] drawer-enter flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-glass-border">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {drawerMode === "create" ? "New Phone Record" : 
                   drawerMode === "edit" ? "Edit Record" : 
                   "Import Records"}
                </h3>
                <p className="text-xs text-space-300 mt-0.5">
                  {drawerMode === "create"
                    ? "Add a new terminal line"
                    : drawerMode === "edit"
                    ? `Editing ${form.phoneNumber}`
                    : "Import from Excel/CSV file"}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="btn-magnetic w-9 h-9 rounded-xl bg-space-700 border border-glass-border flex items-center justify-center text-space-200 hover:text-white transition-all"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* Import form */}
            {drawerMode === "import" ? (
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white mb-2">Import Mode</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setImportMode("skip")}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                        importMode === "skip"
                          ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                          : "glass border border-glass-border text-space-200"
                      }`}
                    >
                      Skip Existing
                    </button>
                    <button
                      onClick={() => setImportMode("update")}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                        importMode === "update"
                          ? "bg-neon-amber/15 text-neon-amber border border-neon-amber/30"
                          : "glass border border-glass-border text-space-200"
                      }`}
                    >
                      Update Existing
                    </button>
                  </div>
                  <p className="text-xs text-space-400 mt-2">
                    {importMode === "skip" 
                      ? "Existing phone numbers will be skipped" 
                      : "Existing records will be updated with new data"}
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white mb-2">Expected Columns</h4>
                  <div className="glass rounded-lg p-3 text-xs text-space-300 font-mono">
                    Phone Number, IDF Pair, IDF Block, MDF Pair, MDF Cable, Location, Department, Status, Note
                  </div>
                  <p className="text-xs text-space-400 mt-2">
                    Column names are flexible (e.g., &quot;phone&quot;, &quot;Phone Number&quot;, &quot;phone_number&quot; all work)
                  </p>
                </div>

                <div className="border-2 border-dashed border-glass-border rounded-xl p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleImport}
                    className="hidden"
                    id="import-file"
                  />
                  <label
                    htmlFor="import-file"
                    className="cursor-pointer"
                  >
                    <IconImport className="w-10 h-10 text-space-400 mx-auto mb-3" />
                    <p className="text-space-200 text-sm mb-1">
                      {importing ? "Importing..." : "Click to select file"}
                    </p>
                    <p className="text-space-400 text-xs">
                      Supports .xlsx, .xls, .csv
                    </p>
                  </label>
                </div>
              </div>
            ) : (
              /* Create/Edit Form */
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                {/* Phone number — locked on edit */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">
                    Phone Number {drawerMode === "edit" && <span className="text-neon-amber">(Immutable)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      disabled={drawerMode === "edit"}
                      placeholder="e.g., 88500"
                      className={`w-full ${drawerMode === "edit" ? "!opacity-60 cursor-not-allowed" : ""}`}
                      required
                    />
                    {drawerMode === "edit" && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 lock-icon text-neon-amber">
                        <IconLock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">IDF Pair</label>
                    <input
                      type="text"
                      value={form.idfPair}
                      onChange={(e) => setForm({ ...form, idfPair: e.target.value })}
                      placeholder="1 - 400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">IDF Block</label>
                    <input
                      type="text"
                      value={form.idfBlock}
                      onChange={(e) => setForm({ ...form, idfBlock: e.target.value })}
                      placeholder="1 - 6"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">MDF Pair</label>
                    <input
                      type="text"
                      value={form.mdfPair}
                      onChange={(e) => setForm({ ...form, mdfPair: e.target.value })}
                      placeholder="1 - 400"
                    />
                  </div>
                  <div>
                    <label className="cable text-xs uppercase tracking-widest text-space-200 mb-2">MDF Cable</label>
                    <input
                      type="text"
                      value={form.mdfCable}
                      onChange={(e) => setForm({ ...form, mdfCable: e.target.value })}
                      placeholder="1 - 2"
                    />
                  </div>
                </div>
                <div>
                 <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">Location</label>
                 <input
                   type="text"
                   value={form.location}
                   onChange={(e) => setForm({ ...form, location: e.target.value })}
                   placeholder="e.g., TR-41-A, C-16"
                   className="w-full"
                 />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g., ICT"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">Note</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Optional notes..."
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>

                {/* Actions */}
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
                    {submitting ? "Saving..." : drawerMode === "create" ? "Create Record" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
