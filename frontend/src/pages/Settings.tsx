import React, { useState } from "react";
import { Save, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { db } from "../services/mockDb";
import { mockAppSettings } from "../data/mockSettings";
import { useAuthStore } from "../stores/authStore";

const CURRENCIES = ["USD ($)", "EUR (€)", "GBP (£)", "JPY (¥)", "INR (₹)"];

export const Settings: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";

  const [form, setForm] = useState(() => ({
    company_name: db.settings.company_name,
    default_currency: db.settings.default_currency,
    failed_login_attempts_limit: db.settings.failed_login_attempts_limit,
    timezone: db.settings.timezone,
    date_format: db.settings.date_format,
  }));

  const handleSave = () => {
    Object.assign(db.settings, form);
    localStorage.setItem("assetflow_mock_settings", JSON.stringify(db.settings));
    toast.success("Settings saved successfully!");
  };

  const handleReset = () => {
    setForm(mockAppSettings);
    Object.assign(db.settings, mockAppSettings);
    localStorage.setItem("assetflow_mock_settings", JSON.stringify(mockAppSettings));
    toast.success("Settings reset to defaults");
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure global application variables and limits</p>
        </div>
        {isAdmin && (
          <button onClick={handleReset} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground" title="Reset to defaults">
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Company Name</label>
          <input disabled={!isAdmin} type="text" className={inputClass} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Default Currency</label>
          <select disabled={!isAdmin} className={inputClass} value={form.default_currency} onChange={(e) => setForm({ ...form, default_currency: e.target.value })}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Failed Login Attempts Limit</label>
          <input disabled={!isAdmin} type="number" min={1} max={20} className={inputClass} value={form.failed_login_attempts_limit} onChange={(e) => setForm({ ...form, failed_login_attempts_limit: parseInt(e.target.value) || 5 })} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Timezone</label>
          <select disabled={!isAdmin} className={inputClass} value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
            {["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Tokyo", "Asia/Kolkata"].map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Date Format</label>
          <select disabled={!isAdmin} className={inputClass} value={form.date_format} onChange={(e) => setForm({ ...form, date_format: e.target.value })}>
            {["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", "DD.MM.YYYY"].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {isAdmin && (
          <button onClick={handleSave} className="py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow hover:bg-primary/90 flex items-center justify-center gap-2">
            <Save className="h-4 w-4" />
            <span>Save Configuration</span>
          </button>
        )}
      </div>
    </div>
  );
};
