export interface MockUser {
  id: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "auditor" | "employee";
  permissions: string[];
  name: string;
  department: string;
}

export const mockUsers: MockUser[] = [
  {
    id: "u-001",
    email: "admin@assetflow.com",
    password: "admin123",
    role: "admin",
    permissions: ["asset:read", "asset:create", "asset:update", "asset:delete", "user:manage", "settings:write"],
    name: "System Admin",
    department: "IT Administration",
  },
  {
    id: "u-002",
    email: "manager@assetflow.com",
    password: "manager123",
    role: "manager",
    permissions: ["asset:read", "asset:create", "asset:update", "approval:handle"],
    name: "Sarah Johnson",
    department: "Operations",
  },
  {
    id: "u-003",
    email: "auditor@assetflow.com",
    password: "auditor123",
    role: "auditor",
    permissions: ["asset:read", "audit:read", "audit:write", "report:read"],
    name: "Michael Chen",
    department: "Compliance",
  },
  {
    id: "u-004",
    email: "employee@assetflow.com",
    password: "employee123",
    role: "employee",
    permissions: ["asset:read"],
    name: "Emily Watson",
    department: "Engineering",
  },
  {
    id: "u-005",
    email: "david@assetflow.com",
    password: "david123",
    role: "employee",
    permissions: ["asset:read"],
    name: "David Miller",
    department: "Engineering",
  },
  {
    id: "u-006",
    email: "jane@assetflow.com",
    password: "jane123",
    role: "manager",
    permissions: ["asset:read", "asset:create", "approval:handle"],
    name: "Jane Cooper",
    department: "Human Resources",
  },
];
