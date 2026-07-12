import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, Plus, Search, BarChart2, Calendar,
  AlertTriangle, Clock, CheckCircle2, XCircle, Pause,
  Play, DollarSign, User, Building2,
  Zap, RefreshCw, TrendingUp,
  ArrowRight, Loader2, X,
  FileText, LayoutGrid, AlignJustify, Settings
} from "lucide-react";
import {
  maintenanceService,
  MaintenanceSummary,
  MaintenanceAnalytics,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceType,
  MaintenanceCreatePayload,
} from "../services/api";

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<MaintenancePriority, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  high:     { label: "High",     color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  medium:   { label: "Medium",   color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  low:      { label: "Low",      color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
};

const STATUS_CONFIG: Record<MaintenanceStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending_approval: { label: "Pending Approval", color: "text-amber-400", bg: "bg-amber-500/10", icon: <Clock className="h-3 w-3" /> },
  approved:         { label: "Approved",         color: "text-blue-400",  bg: "bg-blue-500/10",  icon: <CheckCircle2 className="h-3 w-3" /> },
  assigned:         { label: "Assigned",         color: "text-purple-400",bg: "bg-purple-500/10",icon: <User className="h-3 w-3" /> },
  started:          { label: "Started",          color: "text-cyan-400",  bg: "bg-cyan-500/10",  icon: <Play className="h-3 w-3" /> },
  waiting_parts:    { label: "Waiting Parts",    color: "text-orange-400",bg: "bg-orange-500/10",icon: <Pause className="h-3 w-3" /> },
  in_progress:      { label: "In Progress",      color: "text-indigo-400",bg: "bg-indigo-500/10",icon: <RefreshCw className="h-3 w-3" /> },
  qa_inspection:    { label: "QA Inspection",    color: "text-teal-400",  bg: "bg-teal-500/10",  icon: <Search className="h-3 w-3" /> },
  resolved:         { label: "Resolved",         color: "text-green-400", bg: "bg-green-500/10", icon: <CheckCircle2 className="h-3 w-3" /> },
  closed:           { label: "Closed",           color: "text-slate-400", bg: "bg-slate-500/10", icon: <XCircle className="h-3 w-3" /> },
  rejected:         { label: "Rejected",         color: "text-red-400",   bg: "bg-red-500/10",   icon: <XCircle className="h-3 w-3" /> },
  cancelled:        { label: "Cancelled",        color: "text-slate-400", bg: "bg-slate-500/10", icon: <X className="h-3 w-3" /> },
  draft:            { label: "Draft",            color: "text-slate-400", bg: "bg-slate-500/10", icon: <FileText className="h-3 w-3" /> },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  corrective:  <Wrench className="h-4 w-4" />,
  preventive:  <Settings className="h-4 w-4" />,
  emergency:   <Zap className="h-4 w-4" />,
  inspection:  <Search className="h-4 w-4" />,
  calibration: <BarChart2 className="h-4 w-4" />,
  cleaning:    <RefreshCw className="h-4 w-4" />,
  scheduled:   <Calendar className="h-4 w-4" />,
  predictive:  <TrendingUp className="h-4 w-4" />,
  vendor:      <Building2 className="h-4 w-4" />,
  amc:         <FileText className="h-4 w-4" />,
};

const KANBAN_COLUMNS: { status: MaintenanceStatus; label: string }[] = [
  { status: "pending_approval", label: "Pending" },
  { status: "approved",         label: "Approved" },
  { status: "assigned",         label: "Assigned" },
  { status: "in_progress",      label: "In Progress" },
  { status: "qa_inspection",    label: "QA Review" },
  { status: "resolved",         label: "Resolved" },
];

// ── SLA BADGE ────────────────────────────────────────────────────────────────

function SLABadge({ slaDate }: { slaDate?: string }) {
  if (!slaDate) return null;
  const due = new Date(slaDate);
  const now = new Date();
  const diffH = (due.getTime() - now.getTime()) / 3_600_000;

  if (diffH < 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
      <AlertTriangle className="h-3 w-3" /> SLA BREACHED
    </span>
  );
  if (diffH < 4) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
      <Clock className="h-3 w-3" /> {Math.round(diffH)}h left
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="h-3 w-3" /> On Track
    </span>
  );
}

// ── ANALYTICS PANEL ──────────────────────────────────────────────────────────

function AnalyticsPanel({ analytics }: { analytics: MaintenanceAnalytics }) {
  const kpis = [
    { label: "Total Requests", value: analytics.total_requests, icon: <Wrench />, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Open",           value: analytics.open_requests,   icon: <RefreshCw />, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Overdue",        value: analytics.overdue_count,   icon: <AlertTriangle />, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "SLA Compliance", value: analytics.sla_compliance_pct != null ? `${analytics.sla_compliance_pct}%` : "—", icon: <TrendingUp />, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Avg MTTR",       value: analytics.avg_resolution_hours != null ? `${analytics.avg_resolution_hours}h` : "—", icon: <Clock />, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Total Cost",     value: `$${analytics.total_actual_cost.toFixed(0)}`, icon: <DollarSign />, color: "text-teal-400", bg: "bg-teal-500/10" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border bg-card p-4 flex flex-col gap-2"
          >
            <div className={`w-8 h-8 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
              {React.cloneElement(kpi.icon as React.ReactElement, { className: "h-4 w-4" })}
            </div>
            <p className="text-xl font-bold">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* By Priority Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">By Priority</p>
          <div className="space-y-2">
            {(["critical", "high", "medium", "low"] as MaintenancePriority[]).map((p) => {
              const count = analytics.by_priority[p] || 0;
              const total = analytics.total_requests || 1;
              const pct = Math.round((count / total) * 100);
              const cfg = PRIORITY_CONFIG[p];
              return (
                <div key={p}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${cfg.bg} ${cfg.color.replace("text-", "bg-")}`}
                      style={{ background: "currentColor" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">By Type</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {Object.entries(analytics.by_type).sort(([,a],[,b]) => b - a).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm py-1 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-2 text-muted-foreground capitalize">
                  {TYPE_ICONS[type]}
                  <span>{type}</span>
                </div>
                <span className="font-semibold text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAINTENANCE CARD (Kanban / List) ─────────────────────────────────────────

interface MaintenanceCardProps {
  item: MaintenanceSummary;
  onAction: (id: string, action: string) => void;
  compact?: boolean;
}

function MaintenanceCard({ item, onAction, compact = false }: MaintenanceCardProps) {
  const priority = PRIORITY_CONFIG[item.priority];
  const statusCfg = STATUS_CONFIG[item.status];
  const [expanded, setExpanded] = useState(false);

  const getNextActions = (status: MaintenanceStatus): { action: string; label: string; color: string }[] => {
    const map: Partial<Record<MaintenanceStatus, { action: string; label: string; color: string }[]>> = {
      pending_approval: [
        { action: "approve", label: "Approve", color: "text-green-400 hover:bg-green-500/10" },
        { action: "reject",  label: "Reject",  color: "text-red-400 hover:bg-red-500/10" },
      ],
      approved: [
        { action: "assign", label: "Assign Tech", color: "text-blue-400 hover:bg-blue-500/10" },
      ],
      assigned: [
        { action: "start", label: "Start Work", color: "text-cyan-400 hover:bg-cyan-500/10" },
      ],
      started: [
        { action: "progress", label: "In Progress", color: "text-indigo-400 hover:bg-indigo-500/10" },
        { action: "pause", label: "Pause", color: "text-orange-400 hover:bg-orange-500/10" },
      ],
      waiting_parts: [
        { action: "resume", label: "Resume", color: "text-cyan-400 hover:bg-cyan-500/10" },
      ],
      in_progress: [
        { action: "complete", label: "Complete", color: "text-teal-400 hover:bg-teal-500/10" },
        { action: "pause", label: "Pause", color: "text-orange-400 hover:bg-orange-500/10" },
      ],
      qa_inspection: [
        { action: "resolve", label: "QA Pass ✓", color: "text-green-400 hover:bg-green-500/10" },
        { action: "reopen", label: "Return", color: "text-orange-400 hover:bg-orange-500/10" },
      ],
      resolved: [
        { action: "close", label: "Close", color: "text-slate-400 hover:bg-slate-500/10" },
      ],
    };
    return map[status] || [];
  };

  const actions = getNextActions(item.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border bg-card hover:border-primary/30 transition-all duration-200 overflow-hidden group ${
        item.priority === "critical" ? "border-red-500/30" : "border-border"
      }`}
    >
      <div className={`p-${compact ? "3" : "4"}`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1.5 rounded-lg ${priority.bg} ${priority.color} shrink-0`}>
              {TYPE_ICONS[item.maintenance_type] || <Wrench className="h-3.5 w-3.5" />}
            </div>
            <div className="min-w-0">
              <p className={`font-semibold text-sm leading-tight truncate ${compact ? "max-w-[150px]" : "max-w-[220px]"}`}>
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{item.maintenance_type}</p>
            </div>
          </div>
          <div className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${priority.bg} ${priority.color} ${priority.border}`}>
            {priority.label}
          </div>
        </div>

        {/* Status + SLA */}
        <div className="flex items-center flex-wrap gap-1.5 mb-2">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
            {statusCfg.icon}{statusCfg.label}
          </span>
          <SLABadge slaDate={item.sla_due_at} />
        </div>

        {!compact && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${(item.actual_cost || item.estimated_cost || 0).toFixed(0)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Action buttons */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {actions.map((act) => (
              <button
                key={act.action}
                onClick={() => onAction(item.id, act.action)}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg border border-transparent transition-colors ${act.color}`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── CREATE MODAL ─────────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateModal({ onClose, onCreated }: CreateModalProps) {
  const [form, setForm] = useState<MaintenanceCreatePayload>({
    title: "",
    description: "",
    asset_id: "",
    maintenance_type: "corrective",
    priority: "medium",
    category_tag: "",
    estimated_cost: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await maintenanceService.create(form);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to create maintenance request");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              New Maintenance Request
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Raise a work order for asset maintenance
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Title */}
          <div>
            <label className={labelClass}>Title *</label>
            <input
              required
              type="text"
              placeholder="e.g. HP LaserJet Paper Jam — Floor 3"
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* Asset ID */}
          <div>
            <label className={labelClass}>Asset ID (UUID) *</label>
            <input
              required
              type="text"
              placeholder="Paste asset UUID..."
              className={`${inputClass} font-mono text-xs`}
              value={form.asset_id}
              onChange={(e) => setForm({ ...form, asset_id: e.target.value })}
            />
          </div>

          {/* Type & Priority in grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Maintenance Type *</label>
              <select
                className={inputClass}
                value={form.maintenance_type}
                onChange={(e) => setForm({ ...form, maintenance_type: e.target.value as MaintenanceType })}
              >
                {["corrective","preventive","emergency","inspection","calibration","cleaning","scheduled","predictive","vendor","amc"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority *</label>
              <select
                className={inputClass}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as MaintenancePriority })}
              >
                {["critical","high","medium","low"].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category + Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category Tag</label>
              <input
                type="text"
                placeholder="e.g. Electrical, Mechanical"
                className={inputClass}
                value={form.category_tag}
                onChange={(e) => setForm({ ...form, category_tag: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Estimated Cost ($)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                className={inputClass}
                value={form.estimated_cost}
                onChange={(e) => setForm({ ...form, estimated_cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              rows={3}
              placeholder="Describe the issue in detail..."
              className={inputClass}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Recurring checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={form.is_recurring}
              onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
            />
            <span className="text-sm text-muted-foreground">Recurring Maintenance</span>
          </label>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {loading ? "Creating..." : "Create Request"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── ACTION MODAL (Approve/Reject/Cancel/etc.) ────────────────────────────────

interface ActionModalProps {
  id: string;
  action: string;
  onClose: () => void;
  onDone: () => void;
}

function ActionModal({ id, action, onClose, onDone }: ActionModalProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const config: Record<string, { title: string; placeholder: string; required: boolean; color: string }> = {
    approve:  { title: "Approve Request",    placeholder: "Optional approval notes...", required: false, color: "bg-green-500" },
    reject:   { title: "Reject Request",     placeholder: "Enter rejection reason (required)...", required: true, color: "bg-red-500" },
    cancel:   { title: "Cancel Request",     placeholder: "Enter cancellation reason (required)...", required: true, color: "bg-slate-500" },
    assign:   { title: "Assign Technician",  placeholder: "Enter technician UUID...", required: true, color: "bg-blue-500" },
    complete: { title: "Complete Work",      placeholder: "Resolution notes are required (min 10 chars)...", required: true, color: "bg-teal-500" },
    resolve:  { title: "Pass QA & Resolve",  placeholder: "QA inspection notes...", required: false, color: "bg-green-500" },
    close:    { title: "Close Work Order",   placeholder: "Final closing notes...", required: false, color: "bg-slate-500" },
    pause:    { title: "Pause Work",         placeholder: "Reason for pause...", required: false, color: "bg-orange-500" },
  };

  const cfg = config[action] || { title: action, placeholder: "Notes...", required: false, color: "bg-primary" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (action === "approve") await maintenanceService.approve(id, value);
      else if (action === "reject") await maintenanceService.reject(id, value);
      else if (action === "cancel") await maintenanceService.cancel(id, value);
      else if (action === "assign") await maintenanceService.assign(id, value);
      else if (action === "start" || action === "progress") await maintenanceService.startWork(id);
      else if (action === "pause") await maintenanceService.pauseWork(id, value);
      else if (action === "resume") await maintenanceService.resumeWork(id);
      else if (action === "complete") await maintenanceService.completeWork(id, { resolution_notes: value });
      else if (action === "resolve") await maintenanceService.resolve(id, value);
      else if (action === "close") await maintenanceService.close(id, value);
      onDone();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6"
      >
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${cfg.color}`} />
          {cfg.title}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(action !== "start" && action !== "progress" && action !== "resume") && (
            <textarea
              rows={3}
              required={cfg.required}
              placeholder={cfg.placeholder}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
          {(action === "start" || action === "progress" || action === "resume") && (
            <p className="text-sm text-muted-foreground">Confirm to proceed with this action.</p>
          )}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-muted">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? "Processing..." : "Confirm"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── KANBAN VIEW ───────────────────────────────────────────────────────────────

function KanbanView({ items, onAction }: { items: MaintenanceSummary[]; onAction: (id: string, action: string) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
      {KANBAN_COLUMNS.map(({ status, label }) => {
        const colItems = items.filter(i => i.status === status);
        const statusCfg = STATUS_CONFIG[status];
        return (
          <div key={status} className="flex-shrink-0 w-[260px]">
            <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-xl ${statusCfg.bg}`}>
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${statusCfg.color}`}>
                {statusCfg.icon} {label}
              </div>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color}`}>
                {colItems.length}
              </span>
            </div>
            <div className="space-y-2">
              {colItems.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <p className="text-xs text-muted-foreground">No items</p>
                </div>
              )}
              <AnimatePresence>
                {colItems.map(item => (
                  <MaintenanceCard key={item.id} item={item} onAction={onAction} compact />
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── LIST VIEW ─────────────────────────────────────────────────────────────────

function ListView({ items, onAction }: { items: MaintenanceSummary[]; onAction: (id: string, action: string) => void }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <Wrench className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">No maintenance requests found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="grid grid-cols-[1fr_100px_120px_140px_120px] gap-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 px-4 py-2.5 border-b">
        <span>Request</span><span>Type</span><span>Priority</span><span>Status</span><span>SLA</span>
      </div>
      <div className="divide-y">
        {items.map((item) => {
          const priority = PRIORITY_CONFIG[item.priority];
          const statusCfg = STATUS_CONFIG[item.status];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-[1fr_100px_120px_140px_120px] gap-0 items-center px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0 pr-4">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-xs capitalize">
                {TYPE_ICONS[item.maintenance_type]}
                <span className="truncate">{item.maintenance_type}</span>
              </div>
              <div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.bg} ${priority.color} border ${priority.border}`}>
                  {priority.label}
                </span>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                  {statusCfg.icon}{statusCfg.label}
                </span>
              </div>
              <div>
                <SLABadge slaDate={item.sla_due_at} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export const Maintenance: React.FC = () => {
  const [items, setItems] = useState<MaintenanceSummary[]>([]);
  const [analytics, setAnalytics] = useState<MaintenanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list" | "analytics">("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ id: string; action: string } | null>(null);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, analyticsRes] = await Promise.all([
        maintenanceService.list({
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          maintenance_type: typeFilter || undefined,
          search_term: search || undefined,
          limit: 100,
        }),
        maintenanceService.getAnalytics(),
      ]);
      setItems(listRes.items);
      setTotal(listRes.total);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error("Failed to load maintenance data:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = (id: string, action: string) => {
    setPendingAction({ id, action });
  };

  const selectClass = "px-3 py-1.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              <Wrench className="h-7 w-7" />
            </div>
            Maintenance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise CMMS — {total} total work orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 p-1 bg-muted rounded-lg border border-border">
            {[
              { key: "kanban",    icon: <LayoutGrid className="h-4 w-4" />,    label: "Kanban" },
              { key: "list",      icon: <AlignJustify className="h-4 w-4" />,  label: "List" },
              { key: "analytics", icon: <BarChart2 className="h-4 w-4" />, label: "Analytics" },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key as typeof view)}
                title={label}
                className={`p-2 rounded-md text-sm transition-colors ${
                  view === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            id="create-maintenance-btn"
          >
            <Plus className="h-4 w-4" />
            New Request
          </button>
        </div>
      </div>

      {/* Analytics KPI strip — always visible */}
      {analytics && view !== "analytics" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Open",     value: analytics.open_requests,   color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Overdue",  value: analytics.overdue_count,   color: "text-red-400",   bg: "bg-red-500/10" },
            { label: "SLA %",    value: analytics.sla_compliance_pct != null ? `${analytics.sla_compliance_pct}%` : "—", color: "text-green-400", bg: "bg-green-500/10" },
            { label: "Avg MTTR", value: analytics.avg_resolution_hours != null ? `${analytics.avg_resolution_hours}h` : "—", color: "text-purple-400", bg: "bg-purple-500/10" },
          ].map((kpi, i) => (
            <div key={i} className="rounded-xl border bg-card px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <span className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, description..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={selectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_CONFIG).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s as MaintenanceStatus].label}</option>
          ))}
        </select>
        <select className={selectClass} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          {["critical","high","medium","low"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select className={selectClass} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {Object.keys(TYPE_ICONS).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <button onClick={fetchData} title="Refresh" className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground border border-border">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading maintenance data...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {view === "kanban" && (
            <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <KanbanView items={items} onAction={handleAction} />
            </motion.div>
          )}
          {view === "list" && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ListView items={items} onAction={handleAction} />
            </motion.div>
          )}
          {view === "analytics" && analytics && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnalyticsPanel analytics={analytics} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal
            onClose={() => setShowCreate(false)}
            onCreated={fetchData}
          />
        )}
        {pendingAction && (
          <ActionModal
            id={pendingAction.id}
            action={pendingAction.action}
            onClose={() => setPendingAction(null)}
            onDone={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
