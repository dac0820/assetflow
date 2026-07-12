import React from "react";
import { ArrowRight, Check, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { operationsService } from "../services/api";
import toast from "react-hot-toast";

export const Transfers: React.FC = () => {
  const queryClient = useQueryClient();

  const mockTransfers = [
    { id: "1", name: "iPad Pro 12.9", from: "Warehouse A", to: "HQ Office", requestedBy: "Jack R.", date: "2026-07-10", status: "requested" },
    { id: "2", name: "Dell Latitude 5420", from: "HQ Office", to: "Branch B", requestedBy: "Alice W.", date: "2026-07-12", status: "requested" },
  ];

  const { data: dbTransfers, isLoading } = useQuery({
    queryKey: ["pendingTransfers"],
    queryFn: () => operationsService.getPendingTransfers(),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "APPROVED" | "REJECTED" }) =>
      operationsService.actionTransfer(id, action),
    onSuccess: (_, variables) => {
      toast.success(`Transfer Request ${variables.action.toLowerCase()} successfully!`);
      queryClient.invalidateQueries({ queryKey: ["pendingTransfers"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to process transfer request.");
    },
  });

  const transfersList = dbTransfers && dbTransfers.length > 0
    ? dbTransfers.map((req) => ({
        id: req.id,
        name: "Asset Item", // Placeholder asset name
        from: "Current Custodian",
        to: "Target Employee",
        requestedBy: "Manager Reviewer",
        date: new Date(req.requested_at).toLocaleDateString(),
        status: req.status,
      }))
    : mockTransfers;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transfer Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Inter-departmental movement logs and location audits</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="border rounded-xl bg-card text-card-foreground shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                <th className="p-4">Asset</th>
                <th className="p-4">Source Custodian</th>
                <th className="p-4">Target Destination</th>
                <th className="p-4">Requested By</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfersList.map((req) => (
                <tr key={req.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-semibold">{req.name}</td>
                  <td className="p-4">{req.from}</td>
                  <td className="p-4 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span>{req.to}</span>
                  </td>
                  <td className="p-4">{req.requestedBy}</td>
                  <td className="p-4">{req.date}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => actionMutation.mutate({ id: req.id, action: "APPROVED" })}
                        disabled={actionMutation.isPending}
                        className="p-1.5 bg-green-500/10 hover:bg-green-500/25 text-green-500 rounded-lg transition-colors"
                        title="Approve Transfer"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => actionMutation.mutate({ id: req.id, action: "REJECTED" })}
                        disabled={actionMutation.isPending}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-500 rounded-lg transition-colors"
                        title="Reject Transfer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

