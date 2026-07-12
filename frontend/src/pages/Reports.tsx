import React, { useState } from "react";
import { FileText, Download } from "lucide-react";
import { db } from "../services/mockDb";
import type { MockReportDocument } from "../data/mockReports";
import toast from "react-hot-toast";

function downloadReport(doc: MockReportDocument) {
  const content = `Report: ${doc.title}\nGenerated: ${new Date().toISOString()}\n\nThis is a simulated ${doc.type} report file for demonstration purposes.`;
  const blob = new Blob([content], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.title;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Downloading ${doc.title}`);
}

export const Reports: React.FC = () => {
  const [documents] = useState<MockReportDocument[]>(() => db.reports.getAll());

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
            <button onClick={() => downloadReport(doc)} className="p-2 hover:bg-primary/10 text-primary rounded-lg" title="Download">
              <Download className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
