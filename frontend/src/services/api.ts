import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const API_BASE_URL = "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically inject JWT tokens into all outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface AssetPayload {
  name: string;
  serial_number: string;
  category_id: string;
  purchase_cost: number;
  purchase_date: string;
  salvage_value?: number;
  useful_life_years: number;
  location_id: string;
  custom_metadata?: Record<string, any>;
}

export interface AssetResponse {
  id: string;
  name: string;
  serial_number: string;
  category_id: string;
  purchase_cost: number;
  purchase_date: string;
  salvage_value: number;
  useful_life_years: number;
  location_id: string;
  status: string;
  is_deleted: boolean;
  version_number: number;
  created_at: string;
  updated_at: string;
  custom_metadata?: Record<string, any>;
}

export interface SearchParams {
  search_term?: string;
  category_id?: string;
  location_id?: string;
  status?: string;
  min_cost?: number;
  max_cost?: number;
  skip?: number;
  limit?: number;
}

export const assetService = {
  getAssets: async (params?: SearchParams): Promise<AssetResponse[]> => {
    const response = await apiClient.get<AssetResponse[]>("/assets", { params });
    return response.data;
  },

  getAssetById: async (id: string): Promise<AssetResponse> => {
    const response = await apiClient.get<AssetResponse>(`/assets/${id}`);
    return response.data;
  },

  createAsset: async (payload: AssetPayload): Promise<AssetResponse> => {
    const response = await apiClient.post<AssetResponse>("/assets", payload);
    return response.data;
  },

  updateAsset: async (id: string, payload: Partial<AssetPayload & { status: string }>): Promise<AssetResponse> => {
    const response = await apiClient.patch<AssetResponse>(`/assets/${id}`, payload);
    return response.data;
  },

  deleteAsset: async (id: string): Promise<AssetResponse> => {
    const response = await apiClient.delete<AssetResponse>(`/assets/${id}`);
    return response.data;
  },

  getDepreciationSchedule: async (id: string, method = "STRAIGHT_LINE") => {
    const response = await apiClient.get(`/assets/${id}/depreciation`, { params: { method } });
    return response.data;
  },

  getAssetHistory: async (id: string) => {
    const response = await apiClient.get(`/assets/${id}/history`);
    return response.data;
  },

  bulkUpdate: async (assetIds: string[], status?: string, locationId?: string) => {
    const response = await apiClient.post("/assets/bulk-update", {
      asset_ids: assetIds,
      status,
      location_id: locationId,
    });
    return response.data;
  },

  bulkDelete: async (assetIds: string[]) => {
    const response = await apiClient.post("/assets/bulk-delete", {
      asset_ids: assetIds,
    });
    return response.data;
  },
};

export interface AllocationPayload {
  asset_id: string;
  employee_id: string;
  expected_return_at?: string;
  notes?: string;
  condition_on_allocation?: string;
}

export interface ReturnPayload {
  condition_on_return?: string;
  notes?: string;
}

export interface TransferPayload {
  asset_id: string;
  target_employee_id: string;
  notes?: string;
}

export interface TransferResponse {
  id: string;
  asset_id: string;
  source_employee_id: string;
  target_employee_id: string;
  requested_by: string;
  status: string;
  requested_at: string;
  actioned_at?: string;
  rejection_reason?: string;
}

export const operationsService = {
  allocateAsset: async (payload: AllocationPayload) => {
    const response = await apiClient.post("/operations/allocate", payload);
    return response.data;
  },

  returnAsset: async (assetId: string, payload: ReturnPayload) => {
    const response = await apiClient.post(`/operations/return/${assetId}`, payload);
    return response.data;
  },

  requestTransfer: async (payload: TransferPayload) => {
    const response = await apiClient.post("/operations/transfer", payload);
    return response.data;
  },

  getPendingTransfers: async (): Promise<TransferResponse[]> => {
    const response = await apiClient.get<TransferResponse[]>("/operations/transfers/pending");
    return response.data;
  },

  actionTransfer: async (id: string, action: "APPROVED" | "REJECTED", rejectionReason?: string) => {
    const response = await apiClient.post(`/operations/transfers/${id}/action`, {
      status: action,
      rejection_reason: rejectionReason,
    });
    return response.data;
  },
};

export interface BookingPayload {
  asset_id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
}

export interface BookingResponseData {
  id: string;
  asset_id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  status: string;
}

export const bookingsService = {
  createBooking: async (payload: BookingPayload): Promise<BookingResponseData> => {
    const response = await apiClient.post<BookingResponseData>("/bookings", payload);
    return response.data;
  },

  getBookings: async (params?: { asset_id?: string; employee_id?: string }): Promise<BookingResponseData[]> => {
    const response = await apiClient.get<BookingResponseData[]>("/bookings", { params });
    return response.data;
  },

  cancelBooking: async (id: string): Promise<BookingResponseData> => {
    const response = await apiClient.delete<BookingResponseData>(`/bookings/${id}`);
    return response.data;
  },
};

// ──────────────────────────────────────────────────────────────
// MAINTENANCE SERVICE
// ──────────────────────────────────────────────────────────────

export type MaintenanceType =
  | "corrective" | "preventive" | "emergency" | "inspection"
  | "calibration" | "cleaning" | "scheduled" | "predictive"
  | "vendor" | "amc";

export type MaintenancePriority = "critical" | "high" | "medium" | "low";

export type MaintenanceStatus =
  | "draft" | "pending_approval" | "approved" | "assigned"
  | "started" | "waiting_parts" | "in_progress" | "qa_inspection"
  | "resolved" | "closed" | "rejected" | "cancelled";

export interface PartItem {
  name: string;
  quantity: number;
  unit_cost: number;
  status: string;
}

export interface MaintenanceSummary {
  id: string;
  title: string;
  maintenance_type: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  asset_id: string;
  assigned_technician_id?: string;
  estimated_cost: number;
  actual_cost: number;
  sla_due_at?: string;
  actual_start_at?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface MaintenanceResponse extends MaintenanceSummary {
  description?: string;
  category_tag?: string;
  requested_by_id?: string;
  approved_by_id?: string;
  vendor_id?: string;
  scheduled_date?: string;
  actual_end_at?: string;
  resolved_at?: string;
  closed_at?: string;
  downtime_start?: string;
  downtime_end?: string;
  labor_hours: number;
  resolution_notes?: string;
  rejection_reason?: string;
  cancellation_reason?: string;
  parts_required: PartItem[];
  is_recurring: boolean;
  version_number: number;
  attachments: MaintenanceAttachmentData[];
  comments: MaintenanceCommentData[];
  status_logs: MaintenanceStatusLogData[];
}

export interface MaintenanceListResponse {
  items: MaintenanceSummary[];
  total: number;
  skip: number;
  limit: number;
}

export interface MaintenanceAttachmentData {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  mime_type?: string;
  file_size_kb?: number;
  description?: string;
  created_at: string;
}

export interface MaintenanceCommentData {
  id: string;
  body: string;
  is_internal: boolean;
  author_id?: string;
  created_at: string;
}

export interface MaintenanceStatusLogData {
  id: string;
  from_status?: string;
  to_status: string;
  reason?: string;
  changed_by_id?: string;
  created_at: string;
}

export interface MaintenanceAnalytics {
  total_requests: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  avg_resolution_hours?: number;
  sla_compliance_pct?: number;
  total_actual_cost: number;
  total_estimated_cost: number;
  total_labor_hours: number;
  open_requests: number;
  overdue_count: number;
}

export interface MaintenanceCreatePayload {
  title: string;
  description?: string;
  asset_id: string;
  maintenance_type: MaintenanceType;
  priority: MaintenancePriority;
  category_tag?: string;
  estimated_cost?: number;
  scheduled_date?: string;
  vendor_id?: string;
  is_recurring?: boolean;
}

export const maintenanceService = {
  create: async (payload: MaintenanceCreatePayload): Promise<MaintenanceResponse> => {
    const response = await apiClient.post<MaintenanceResponse>("/maintenance", payload);
    return response.data;
  },

  list: async (params?: {
    status?: string; priority?: string; maintenance_type?: string;
    asset_id?: string; technician_id?: string; search_term?: string;
    sla_breached?: boolean; skip?: number; limit?: number;
  }): Promise<MaintenanceListResponse> => {
    const response = await apiClient.get<MaintenanceListResponse>("/maintenance", { params });
    return response.data;
  },

  getById: async (id: string): Promise<MaintenanceResponse> => {
    const response = await apiClient.get<MaintenanceResponse>(`/maintenance/${id}`);
    return response.data;
  },

  update: async (id: string, payload: Partial<MaintenanceCreatePayload>): Promise<MaintenanceResponse> => {
    const response = await apiClient.patch<MaintenanceResponse>(`/maintenance/${id}`, payload);
    return response.data;
  },

  approve: async (id: string, notes?: string): Promise<MaintenanceResponse> => {
    const response = await apiClient.post<MaintenanceResponse>(`/maintenance/${id}/approve`, { notes });
    return response.data;
  },

  reject: async (id: string, rejection_reason: string): Promise<MaintenanceResponse> => {
    const response = await apiClient.post<MaintenanceResponse>(`/maintenance/${id}/reject`, { rejection_reason });
    return response.data;
  },

  assign: async (id: string, technician_id: string): Promise<MaintenanceResponse> => {
    const response = await apiClient.post<MaintenanceResponse>(`/maintenance/${id}/assign`, { technician_id });
    return response.data;
  },

  startWork: async (id: string): Promise<MaintenanceResponse> => {
    const response = await apiClient.post<MaintenanceResponse>(`/maintenance/${id}/start`);
    return response.data;
  },

  pauseWork: async (id: string, reason?: string): Promise<MaintenanceResponse> => {
    const response = await apiClient.post<MaintenanceResponse>(`/maintenance/${id}/pause`, { reason });
    return response.data;
  },

  resumeWork: async (id: string): Promise<MaintenanceResponse> => {
    const response = await apiClient.post<MaintenanceResponse>(`/maintenance/${id}/resume`);
    return response.data;
  },

  completeWork: async (id: string, payload: {
    resolution_notes: string; actual_cost?: number; labor_hours?: number;
  }): Promise<MaintenanceResponse> => {
    const response = await apiClient.post<MaintenanceResponse>(`/maintenance/${id}/complete`, payload);
    return response.data;
  },

  resolve: async (id: string, notes?: string): Promise<MaintenanceResponse> => {
    const p = notes ? { params: { notes } } : {};
    const response = await apiClient.post<MaintenanceResponse>(`/maintenance/${id}/resolve`, null, p);
    return response.data;
  },

  close: async (id: string, final_notes?: string): Promise<MaintenanceResponse> => {
    const response = await apiClient.post<MaintenanceResponse>(`/maintenance/${id}/close`, { final_notes });
    return response.data;
  },

  cancel: async (id: string, cancellation_reason: string): Promise<MaintenanceResponse> => {
    const response = await apiClient.post<MaintenanceResponse>(`/maintenance/${id}/cancel`, { cancellation_reason });
    return response.data;
  },

  getAnalytics: async (): Promise<MaintenanceAnalytics> => {
    const response = await apiClient.get<MaintenanceAnalytics>("/maintenance/analytics/summary");
    return response.data;
  },

  getOverdue: async (): Promise<MaintenanceSummary[]> => {
    const response = await apiClient.get<MaintenanceSummary[]>("/maintenance/overdue");
    return response.data;
  },

  getTimeline: async (id: string): Promise<MaintenanceStatusLogData[]> => {
    const response = await apiClient.get<MaintenanceStatusLogData[]>(`/maintenance/${id}/timeline`);
    return response.data;
  },

  addComment: async (id: string, body: string, is_internal = false): Promise<MaintenanceCommentData> => {
    const response = await apiClient.post<MaintenanceCommentData>(`/maintenance/${id}/comments`, { body, is_internal });
    return response.data;
  },

  getComments: async (id: string): Promise<MaintenanceCommentData[]> => {
    const response = await apiClient.get<MaintenanceCommentData[]>(`/maintenance/${id}/comments`);
    return response.data;
  },

  bulkAction: async (maintenance_ids: string[], action: string, reason?: string) => {
    const response = await apiClient.post("/maintenance/bulk-action", { maintenance_ids, action, reason });
    return response.data;
  },
};
