import React from "react";
import { Wrench } from "lucide-react";

export const Maintenance: React.FC = () => {
  const tasks = [
    { id: 1, name: "HP LaserJet Printer", issue: "Paper jam error", technician: "Alan Turing", cost: "$50.00", status: "in-progress" },
    { id: 2, name: "Cisco Catalyst Switch", issue: "Firmware upgrade failing", technician: "Ada Lovelace", cost: "$0.00", status: "pending" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Maintenance Tickets</h1>
        <p className="text-sm text-muted-foreground mt-1">Operational repair orders and technician calendars</p>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 border rounded-xl bg-card text-card-foreground shadow-sm flex items-center justify-between hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{task.name}</p>
                <p className="text-xs text-muted-foreground">{task.issue} • Tech: {task.technician}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted">{task.cost}</span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                task.status === "in-progress"
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}>
                {task.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
