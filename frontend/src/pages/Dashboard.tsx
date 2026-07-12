import React from "react";
import {
  TrendingUp,
  Box,
  Wrench,
  AlertTriangle,
  FileText,
  Plus,
  ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const performanceData = [
  { month: "Jan", valuation: 1.2, cost: 0.9 },
  { month: "Feb", valuation: 1.5, cost: 1.0 },
  { month: "Mar", valuation: 1.4, cost: 1.1 },
  { month: "Apr", valuation: 1.8, cost: 1.2 },
  { month: "May", valuation: 2.1, cost: 1.3 },
  { month: "Jun", valuation: 2.3, cost: 1.4 },
];

export const Dashboard: React.FC = () => {
  const kpis = [
    { label: "Total Assets Value", value: "$2.3M", change: "+12% MoM", icon: TrendingUp, color: "text-blue-500 bg-blue-500/10" },
    { label: "Registered Items", value: "1,240", change: "42 new added", icon: Box, color: "text-green-500 bg-green-500/10" },
    { label: "Active Repairs", value: "18", change: "4 critical items", icon: Wrench, color: "text-amber-500 bg-amber-500/10" },
    { label: "Compliance Overdue", value: "2", change: "Next audit in 3 days", icon: AlertTriangle, color: "text-red-500 bg-red-500/10" },
  ];

  const approvals = [
    { id: 1, title: "MacBook Pro 16 Allocation", requestedBy: "David Miller", department: "Engineering", status: "pending" },
    { id: 2, title: "HQ Office Monitor Transfer", requestedBy: "Emily Watson", department: "Operations", status: "pending" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Analytics Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time valuation summaries and operational metrics</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className="text-2xl font-bold mt-2">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
              </div>
              <div className={`p-3 rounded-lg ${kpi.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Graph & Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Chart */}
        <div className="lg:col-span-2 p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-lg">Valuation Schedule</h3>
            <p className="text-xs text-muted-foreground">Historical cost comparison values (Millions)</p>
          </div>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" stroke="#888888" />
                <YAxis stroke="#888888" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }} />
                <Legend />
                <Line type="monotone" dataKey="valuation" stroke="#3b82f6" strokeWidth={2.5} name="Current Value" />
                <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} name="Purchase Cost" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Approvals and Action Panel */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-bold text-lg">Quick Tasks</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 border rounded-lg hover:bg-muted transition-colors flex flex-col items-center gap-2 text-center text-xs font-medium">
                <Plus className="h-5 w-5 text-primary" />
                <span>Add New Asset</span>
              </button>
              <button className="p-3 border rounded-lg hover:bg-muted transition-colors flex flex-col items-center gap-2 text-center text-xs font-medium">
                <FileText className="h-5 w-5 text-green-500" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Active Approvals */}
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Approvals Pending</h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">2 tasks</span>
            </div>
            <div className="space-y-3">
              {approvals.map((req) => (
                <div key={req.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-sm">{req.title}</p>
                    <p className="text-muted-foreground mt-0.5">By {req.requestedBy} • {req.department}</p>
                  </div>
                  <button className="p-2 hover:bg-primary/15 text-primary rounded-lg">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
