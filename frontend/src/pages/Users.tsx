import React, { useState } from "react";
import { Plus, Search, Trash2, X, Shield, Users as UsersIcon, Loader2 } from "lucide-react";
import { db, generateId } from "../services/mockDb";
import type { MockUser } from "../data/mockUsers";
import toast from "react-hot-toast";

const ROLES = ["admin", "manager", "auditor", "employee"] as const;
const DEPARTMENTS = ["IT Administration", "Operations", "Compliance", "Engineering", "Human Resources"] as const;

export const Users: React.FC = () => {
  const [users, setUsers] = useState<MockUser[]>(() => db.users.getAll());
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee" as MockUser["role"],
    department: "Engineering",
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    // Assign permissions based on role
    let permissions: string[] = ["asset:read"];
    if (form.role === "admin") {
      permissions = ["asset:read", "asset:create", "asset:update", "asset:delete", "user:manage", "settings:write"];
    } else if (form.role === "manager") {
      permissions = ["asset:read", "asset:create", "asset:update", "approval:handle"];
    } else if (form.role === "auditor") {
      permissions = ["asset:read", "audit:read", "audit:write", "report:read"];
    }

    const newUser = db.users.create({
      id: generateId(),
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      department: form.department,
      permissions,
    });

    setUsers(db.users.getAll());
    setForm({
      name: "",
      email: "",
      password: "",
      role: "employee",
      department: "Engineering",
    });
    setShowModal(false);
    setLoading(false);
    toast.success(`${newUser.name} added successfully!`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove user "${name}"?`)) {
      db.users.delete(id);
      setUsers(db.users.getAll());
      toast.success(`User "${name}" removed.`);
    }
  };

  const filteredUsers = users.filter((u) => {
    const s = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.department.toLowerCase().includes(s);
  });

  const getRoleBadge = (role: MockUser["role"]) => {
    const config = {
      admin: "bg-red-500/10 text-red-400 border border-red-500/20",
      manager: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
      auditor: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      employee: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    };
    return config[role] || config.employee;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <UsersIcon className="h-7 w-7" />
            </div>
            User Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system access, department alignment, and permission credentials
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow hover:bg-primary/90 flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, email or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Directory Table */}
      <div className="border rounded-xl bg-card text-card-foreground shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Department</th>
              <th className="p-4">Role</th>
              <th className="p-4">Permissions</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-4 font-semibold">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span>{user.name}</span>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{user.email}</td>
                <td className="p-4">{user.department}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {user.permissions.map((perm) => (
                      <span key={perm} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                        {perm}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleDelete(user.id, user.name)}
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Remove User"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No matching employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Add New Employee Profile
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Email Address *</label>
                <input
                  required
                  type="email"
                  placeholder="e.g. john@assetflow.com"
                  className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Temporary Password *</label>
                <input
                  required
                  type="password"
                  placeholder="Password..."
                  className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">System Role</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as MockUser["role"] })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Department</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted">Cancel</button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Register Employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
