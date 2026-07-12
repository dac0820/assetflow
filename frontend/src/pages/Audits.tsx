import React from "react";
import { Plus } from "lucide-react";

export const Audits: React.FC = () => {
  const cycles = [
    { id: 1, title: "Q3 physical equipment check", start: "2026-07-01", progress: "85%", status: "active" },
    { id: 2, title: "HQ Network Switch inventory", start: "2026-07-10", progress: "40%", status: "active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Audits</h1>
          <p className="text-sm text-muted-foreground mt-1">Physical verification logs and scanner schedules</p>
        </div>
        <button className="py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow hover:bg-primary/90 flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Create Cycle</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cycles.map((c) => (
          <div key={c.id} className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{c.title}</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20 uppercase">
                {c.status}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Verification Progress</span>
                <span className="font-semibold text-foreground">{c.progress}</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: c.progress }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
