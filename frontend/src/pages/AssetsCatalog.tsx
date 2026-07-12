import React, { useState } from "react";
import { Plus, Search, Filter, Trash2, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetService } from "../services/dataService";
import toast from "react-hot-toast";
import { mockAssets } from "../data/mockAssets";
import { useAuthStore } from "../stores/authStore";

const CATEGORIES = ["Laptops", "Monitors", "Network Switch", "Tablets", "Printers", "Infrastructure"];
const STATUSES = ["available", "allocated", "maintenance"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];

export const AssetsCatalog: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "", serial_number: "", category: "Laptops",
    purchase_cost: 0, purchase_date: "", status: "available", condition: "Excellent",
  });

  const { data: dbAssets, isLoading } = useQuery({
    queryKey: ["assets", searchTerm],
    queryFn: () => assetService.getAssets({ search_term: searchTerm }),
  });

  const assetsList = dbAssets && dbAssets.length > 0
    ? dbAssets.map(a => ({
        id: a.id, name: a.name, serial: a.serial_number,
        category: mockAssets.find(m => m.id === a.id)?.category || "Equipment",
        cost: `$${a.purchase_cost.toLocaleString()}`,
        status: a.status, condition: mockAssets.find(m => m.id === a.id)?.condition || "Good",
      }))
    : [];

  const createMutation = useMutation({
    mutationFn: () => assetService.createAsset({
      name: form.name,
      serial_number: form.serial_number,
      category_id: `cat-${form.category.toLowerCase().replace(/\s+/g, "-")}`,
      purchase_cost: form.purchase_cost,
      purchase_date: form.purchase_date || new Date().toISOString().split("T")[0],
      salvage_value: 0,
      useful_life_years: 5,
      location_id: "loc-hq",
    }),
    onSuccess: () => {
      toast.success("Asset registered!");
      setShowModal(false);
      setForm({ name: "", serial_number: "", category: "Laptops", purchase_cost: 0, purchase_date: "", status: "available", condition: "Excellent" });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: () => toast.error("Failed to register asset"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetService.deleteAsset(id),
    onSuccess: () => {
      toast.success("Asset deleted");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">General ledger registry and physical equipment tracking</p>
        </div>
        {(user?.role === "admin" || user?.role === "manager") && (
          <button onClick={() => setShowModal(true)} className="py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow hover:bg-primary/90 flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Register Asset</span>
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name, serial number or tag..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <button className="py-2.5 px-4 border bg-card hover:bg-muted text-sm font-medium rounded-lg flex items-center gap-2 justify-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span>Filters</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="border rounded-xl bg-card text-card-foreground shadow-sm overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                <th className="p-4">Asset Name</th>
                <th className="p-4">Serial Number</th>
                <th className="p-4">Category</th>
                <th className="p-4">Acquisition Cost</th>
                <th className="p-4">Status</th>
                <th className="p-4">Condition</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assetsList.map((asset) => (
                <tr key={asset.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-semibold">{asset.name}</td>
                  <td className="p-4 text-muted-foreground">{asset.serial}</td>
                  <td className="p-4">{asset.category}</td>
                  <td className="p-4">{asset.cost}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                      asset.status === "available" ? "bg-green-500/10 text-green-500 border border-green-500/20"
                      : asset.status === "allocated" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}>{asset.status}</span>
                  </td>
                  <td className="p-4">{asset.condition}</td>
                  <td className="p-4 text-right">
                    {user?.role === "admin" && (
                      <button onClick={() => { if (confirm("Delete this asset?")) deleteMutation.mutate(asset.id); }} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {assetsList.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No assets found. Register a new asset to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Register New Asset</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Asset Name *</label>
                <input required type="text" placeholder="e.g. MacBook Pro 16" className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Serial Number *</label>
                <input required type="text" placeholder="e.g. SN-MBP-9021" className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Category</label>
                  <select className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div><label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Purchase Cost ($)</label>
                  <input type="number" min={0} className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.purchase_cost} onChange={(e) => setForm({ ...form, purchase_cost: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Purchase Date</label>
                  <input type="date" className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
                <div><label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Condition</label>
                  <select className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted">Cancel</button>
                <button onClick={() => createMutation.mutate()} disabled={!form.name || !form.serial_number || createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {createMutation.isPending ? "Registering..." : "Register Asset"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
