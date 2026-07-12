import React, { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { db, generateId } from "../services/mockDb";
import type { MockAuditCycle } from "../data/mockAudits";
import { mockAuditCycles } from "../data/mockAudits";
import toast from "react-hot-toast";
import { useAuthStore } from "../stores/authStore";

export const Audits: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [cycles, setCycles] = useState<MockAuditCycle[]>(() => db.audits.getAll());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    const now = new Date();
    const cycle = db.audits.create({
      id: generateId(),
      title: form.title,
      start: now.toISOString().split("T")[0],
      progress: "0%",
      status: "scheduled",
      description: form.description,
    });
    setCycles(db.audits.getAll());
    setShowModal(false);
    setForm({ title: "", description: "" });
    toast.success("Audit cycle created!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Audits</h1>
          <p className="text-sm text-muted-foreground mt-1">Physical verification logs and scanner schedules</p>
        </div>
        {(user?.role === "admin" || user?.role === "auditor") && (
          <button onClick={() => setShowModal(true)} className="py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow hover:bg-primary/90 flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Cycle</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cycles.map((c) => (
          <div key={c.id} className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{c.title}</h3>
                {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase ${
                c.status === "active" ? "bg-green-500/10 text-green-500 border border-green-500/20"
                : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
              }`}>{c.status}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Verification Progress</span>
                <span className="font-semibold text-foreground">{c.progress}</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: c.progress }} />
              </div>
              <p className="text-xs text-muted-foreground">Started: {c.start}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">New Audit Cycle</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Title *</label>
                <input type="text" placeholder="e.g. Q4 Server Room Audit" className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</label>
                <textarea rows={3} placeholder="Optional description..." className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted">Cancel</button>
                <button onClick={handleCreate} disabled={!form.title.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
                  <Plus className="h-4 w-4" /> Create Cycle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
