export interface MockAuditCycle {
  id: number;
  title: string;
  start: string;
  progress: string;
  status: string;
  description: string;
}

export const mockAuditCycles: MockAuditCycle[] = [
  {
    id: 1,
    title: "Q3 Physical Equipment Check",
    start: "2026-07-01",
    progress: "85%",
    status: "active",
    description: "Physical verification of all IT assets in HQ and branch offices",
  },
  {
    id: 2,
    title: "HQ Network Switch Inventory",
    start: "2026-07-10",
    progress: "40%",
    status: "active",
    description: "Cataloging and verification of all network equipment in data center",
  },
  {
    id: 3,
    title: "Annual Compliance Review",
    start: "2026-08-01",
    progress: "0%",
    status: "scheduled",
    description: "Full compliance audit against ISO 27001 standards",
  },
];
