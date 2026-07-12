import React, { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { assetService } from "../services/api";

export const AssetsCatalog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const mockAssets = [
    { id: "1", name: "MacBook Pro 16", serial: "SN-MBP-9021", category: "Laptops", cost: "$2,499.00", status: "allocated", condition: "Excellent" },
    { id: "2", name: "Dell UltraSharp 32 Monitor", serial: "SN-DEL-3382", category: "Monitors", cost: "$899.00", status: "available", condition: "Good" },
    { id: "3", name: "Cisco Catalyst Switch 9300", serial: "SN-CIS-0019", category: "Network Switch", cost: "$4,200.00", status: "maintenance", condition: "Fair" },
    { id: "4", name: "iPad Pro 12.9", serial: "SN-IPD-8821", category: "Tablets", cost: "$1,099.00", status: "available", condition: "Excellent" },
  ];

  const { data: dbAssets } = useQuery({
    queryKey: ["assets", searchTerm],
    queryFn: () => assetService.getAssets({ search_term: searchTerm }),
  });

  const assetsList = dbAssets && dbAssets.length > 0 
    ? dbAssets.map(asset => ({
        id: asset.id,
        name: asset.name,
        serial: asset.serial_number,
        category: "Equipment",
        cost: `$${asset.purchase_cost.toLocaleString()}`,
        status: asset.status,
        condition: "Excellent"
      }))
    : mockAssets.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.serial.toLowerCase().includes(searchTerm.toLowerCase()));


  return (
    <div className="space-y-6">
      {/* Directory Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">General ledger registry and physical equipment tracking</p>
        </div>
        <button className="py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow hover:bg-primary/90 flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Register Asset</span>
        </button>
      </div>

      {/* Filters & Actions Panel */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, serial number or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button className="py-2.5 px-4 border bg-card hover:bg-muted text-sm font-medium rounded-lg flex items-center gap-2 justify-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span>Filters</span>
        </button>
      </div>

      {/* Directory Table */}
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
                    asset.status === "available"
                      ? "bg-green-500/10 text-green-500 border border-green-500/20"
                      : asset.status === "allocated"
                      ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}>
                    {asset.status}
                  </span>
                </td>
                <td className="p-4">{asset.condition}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
