import React from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Box, Wrench, AlertTriangle, FileText, Plus, ArrowRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { assetService, operationsService } from "../services/dataService";
import { mockDashboardData } from "../data/mockDashboard";
import { useAuthStore } from "../stores/authStore";
import toast from "react-hot-toast";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: assets } = useQuery({ queryKey: ["assets"], queryFn: () => assetService.getAssets() });
  const { data: transfers } = useQuery({ queryKey: ["pendingTransfers"], queryFn: () => operationsService.getPendingTransfers() });

  const assetCount = assets?.length ?? 0;
  const totalValue = assets?.reduce((s, a) => s + a.purchase_cost, 0) ?? 0;
  const activeRepairs = assets?.filter(a => a.status === "maintenance").length ?? 0;

  const formatValuation = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toLocaleString()}`;
  };

  const kpis = [
    { label: "Total Assets Value", value: formatValuation(totalValue), change: `${assetCount} items tracked`, icon: TrendingUp, color: "text-blue-500 bg-blue-500/10" },
    { label: "Registered Items", value: assetCount.toString(), change: `${assets?.filter(a => a.status === "available").length ?? 0} available`, icon: Box, color: "text-green-500 bg-green-500/10" },
    { label: "Active Repairs", value: activeRepairs.toString(), change: `${assets?.filter(a => a.status === "maintenance").length ?? 0} in maintenance`, icon: Wrench, color: "text-amber-500 bg-amber-500/10" },
    { label: "Pending Transfers", value: (transfers?.filter(t => t.status === "requested").length ?? 0).toString(), change: "Awaiting approval", icon: AlertTriangle, color: "text-red-500 bg-red-500/10" },
  ];

  const approvals = (transfers ?? []).filter(t => t.status === "requested").map((t, i) => ({
    id: i + 1, title: `Transfer Request #${t.id.slice(-4)}`,
    requestedBy: "Staff Member", department: "Operations", status: "pending",
  }));

  const performanceData = mockDashboardData.performanceData;
  const showAdminManagerTasks = user?.role === "admin" || user?.role === "manager";
  const showAssetTask = user?.role === "admin" || user?.role === "manager";
  const showMaintenanceTask = user?.role === "admin" || user?.role === "manager" || user?.role === "employee";
  const showBookingTask = user?.role === "admin" || user?.role === "manager";
  const showExportTask = true;

  const visibleTasksCount = (showAssetTask ? 1 : 0) + (showMaintenanceTask ? 1 : 0) + (showBookingTask ? 1 : 0) + (showExportTask ? 1 : 0);
  const taskCols = visibleTasksCount > 1 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Analytics Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time valuation summaries and operational metrics</p>
      </div>

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
              <div className={`p-3 rounded-lg ${kpi.color}`}><Icon className="h-6 w-6" /></div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <div className="space-y-6">
          <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-bold text-lg">Quick Tasks</h3>
            <div className={`grid gap-3 ${taskCols}`}>
              {showAssetTask && (
                <button onClick={() => navigate("/assets")} className="p-3 border rounded-lg hover:bg-muted transition-colors flex flex-col items-center gap-2 text-center text-xs font-medium">
                  <Plus className="h-5 w-5 text-primary" />
                  <span>Add New Asset</span>
                </button>
              )}
              <button onClick={() => { toast.success("Report exported successfully!"); }} className="p-3 border rounded-lg hover:bg-muted transition-colors flex flex-col items-center gap-2 text-center text-xs font-medium">
                <FileText className="h-5 w-5 text-green-500" />
                <span>Export Report</span>
              </button>
              {showMaintenanceTask && (
                <button onClick={() => navigate("/maintenance")} className="p-3 border rounded-lg hover:bg-muted transition-colors flex flex-col items-center gap-2 text-center text-xs font-medium">
                  <Wrench className="h-5 w-5 text-amber-500" />
                  <span>Maintenance</span>
                </button>
              )}
              {showBookingTask && (
                <button onClick={() => navigate("/bookings")} className="p-3 border rounded-lg hover:bg-muted transition-colors flex flex-col items-center gap-2 text-center text-xs font-medium">
                  <Box className="h-5 w-5 text-blue-500" />
                  <span>Book Resource</span>
                </button>
              )}
            </div>
          </div>

          {showAdminManagerTasks && (
            <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Approvals Pending</h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">{approvals.length} tasks</span>
              </div>
              {approvals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No pending approvals</p>
              ) : (
                <div className="space-y-3">
                  {approvals.map((req) => (
                    <div key={req.id} onClick={() => navigate("/transfers")} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between text-xs cursor-pointer">
                      <div>
                        <p className="font-semibold text-sm">{req.title}</p>
                        <p className="text-muted-foreground mt-0.5">By {req.requestedBy} • {req.department}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
