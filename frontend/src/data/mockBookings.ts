export interface MockBooking {
  id: string;
  asset_id: string;
  asset_name: string;
  employee_id: string;
  employee_name: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

export const mockBookings: MockBooking[] = [
  {
    id: "b-001",
    asset_id: "a-002",
    asset_name: "HQ Boardroom Projector",
    employee_id: "u-004",
    employee_name: "Emily Watson",
    start_time: "2026-07-12T10:00:00Z",
    end_time: "2026-07-12T12:30:00Z",
    status: "approved",
    created_at: "2026-07-11T08:00:00Z",
  },
  {
    id: "b-002",
    asset_id: "a-005",
    asset_name: "Conference Speakerphone",
    employee_id: "u-005",
    employee_name: "David Miller",
    start_time: "2026-07-12T14:00:00Z",
    end_time: "2026-07-12T15:00:00Z",
    status: "approved",
    created_at: "2026-07-11T09:30:00Z",
  },
  {
    id: "b-003",
    asset_id: "a-002",
    asset_name: "HQ Boardroom Projector",
    employee_id: "u-003",
    employee_name: "Michael Chen",
    start_time: "2026-07-13T09:00:00Z",
    end_time: "2026-07-13T11:00:00Z",
    status: "approved",
    created_at: "2026-07-12T07:00:00Z",
  },
];
