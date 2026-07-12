export interface KpiData {
  label: string;
  value: string;
  change: string;
  color: string;
}

export interface PerformanceDataPoint {
  month: string;
  valuation: number;
  cost: number;
}

export interface ApprovalItem {
  id: number;
  title: string;
  requestedBy: string;
  department: string;
  status: string;
}

export interface DashboardData {
  kpis: KpiData[];
  performanceData: PerformanceDataPoint[];
  approvals: ApprovalItem[];
}

export const mockDashboardData: DashboardData = {
  kpis: [
    { label: "Total Assets Value", value: "$2.3M", change: "+12% MoM", color: "text-blue-500 bg-blue-500/10" },
    { label: "Registered Items", value: "1,240", change: "42 new added", color: "text-green-500 bg-green-500/10" },
    { label: "Active Repairs", value: "18", change: "4 critical items", color: "text-amber-500 bg-amber-500/10" },
    { label: "Compliance Overdue", value: "2", change: "Next audit in 3 days", color: "text-red-500 bg-red-500/10" },
  ],
  performanceData: [
    { month: "Jan", valuation: 1.2, cost: 0.9 },
    { month: "Feb", valuation: 1.5, cost: 1.0 },
    { month: "Mar", valuation: 1.4, cost: 1.1 },
    { month: "Apr", valuation: 1.8, cost: 1.2 },
    { month: "May", valuation: 2.1, cost: 1.3 },
    { month: "Jun", valuation: 2.3, cost: 1.4 },
  ],
  approvals: [
    { id: 1, title: "MacBook Pro 16 Allocation", requestedBy: "David Miller", department: "Engineering", status: "pending" },
    { id: 2, title: "HQ Office Monitor Transfer", requestedBy: "Emily Watson", department: "Operations", status: "pending" },
  ],
};
