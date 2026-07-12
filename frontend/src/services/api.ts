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


