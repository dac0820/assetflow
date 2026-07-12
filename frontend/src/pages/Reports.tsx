import React from "react";
import { FileText, Download } from "lucide-react";

export const Reports: React.FC = () => {
  const documents = [
    { id: 1, title: "Q2 Asset Valuation Sheet.pdf", size: "1.4 MB", date: "2026-06-30" },
    { id: 2, title: "Annual Depreciation Schedule.csv", size: "840 KB", date: "2026-07-01" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Calculated valuations schedules and data exports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="p-4 border rounded-xl bg-card text-card-foreground shadow-sm flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{doc.title}</p>
                <p className="text-xs text-muted-foreground">{doc.size} • Created {doc.date}</p>
              </div>
            </div>
            <button className="p-2 hover:bg-primary/10 text-primary rounded-lg">
              <Download className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
