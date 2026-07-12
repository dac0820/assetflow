export interface MockReportDocument {
  id: number;
  title: string;
  size: string;
  date: string;
  type: string;
}

export const mockReportDocuments: MockReportDocument[] = [
  { id: 1, title: "Q2 Asset Valuation Sheet.pdf", size: "1.4 MB", date: "2026-06-30", type: "pdf" },
  { id: 2, title: "Annual Depreciation Schedule.csv", size: "840 KB", date: "2026-07-01", type: "csv" },
  { id: 3, title: "Monthly Maintenance Report - June.xlsx", size: "2.1 MB", date: "2026-07-02", type: "xlsx" },
  { id: 4, title: "Audit Trail - Q2 2026.pdf", size: "3.2 MB", date: "2026-07-05", type: "pdf" },
];
