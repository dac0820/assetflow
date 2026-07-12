import React from "react";
import { Save } from "lucide-react";

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure global application variables and limits</p>
      </div>

      <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Company Name</label>
          <input
            type="text"
            defaultValue="AssetFlow Enterprise Inc."
            className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Default Currency</label>
          <select className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary">
            <option>USD ($)</option>
            <option>EUR (€)</option>
            <option>GBP (£)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Failed Login Attemps Limit</label>
          <input
            type="number"
            defaultValue={5}
            className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button className="py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow hover:bg-primary/90 flex items-center justify-center gap-2">
          <Save className="h-4 w-4" />
          <span>Save Configuration</span>
        </button>
      </div>
    </div>
  );
};
