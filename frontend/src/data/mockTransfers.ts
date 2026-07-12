export interface MockTransfer {
  id: string;
  asset_id: string;
  asset_name: string;
  source_employee_id: string;
  source_name: string;
  target_employee_id: string;
  target_name: string;
  requested_by: string;
  requestor_name: string;
  status: string;
  notes?: string;
  rejection_reason?: string;
  requested_at: string;
  actioned_at?: string;
}

export const mockTransfers: MockTransfer[] = [
  {
    id: "t-001",
    asset_id: "a-004",
    asset_name: "iPad Pro 12.9",
    source_employee_id: "u-005",
    source_name: "David Miller",
    target_employee_id: "u-004",
    target_name: "Emily Watson",
    requested_by: "u-005",
    requestor_name: "David Miller",
    status: "requested",
    notes: "Needed for field inspection work",
    requested_at: "2026-07-10T09:00:00Z",
  },
  {
    id: "t-002",
    asset_id: "a-008",
    asset_name: "Dell Latitude 5420",
    source_employee_id: "u-004",
    source_name: "Emily Watson",
    target_employee_id: "u-006",
    target_name: "Jane Cooper",
    requested_by: "u-004",
    requestor_name: "Emily Watson",
    status: "requested",
    notes: "Temporary reassignment for HR project",
    requested_at: "2026-07-12T11:30:00Z",
  },
  {
    id: "t-003",
    asset_id: "a-001",
    asset_name: "MacBook Pro 16",
    source_employee_id: "u-002",
    source_name: "Sarah Johnson",
    target_employee_id: "u-005",
    target_name: "David Miller",
    requested_by: "u-002",
    requestor_name: "Sarah Johnson",
    status: "approved",
    notes: "MacBook swap for performance upgrade",
    requested_at: "2026-07-08T14:00:00Z",
    actioned_at: "2026-07-09T10:00:00Z",
  },
];
