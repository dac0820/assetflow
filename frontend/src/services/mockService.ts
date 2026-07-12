import { db, generateId } from "./mockDb";
import type {
  AssetPayload, AssetResponse, SearchParams,
  AllocationPayload, ReturnPayload, TransferPayload, TransferResponse,
  BookingPayload, BookingResponseData,
  MaintenanceCreatePayload, MaintenanceResponse, MaintenanceListResponse,
  MaintenanceAnalytics, MaintenanceSummary, MaintenanceCommentData,
  MaintenanceStatusLogData,
} from "./api";
import { mockUsers } from "../data/mockUsers";
import type { MockAsset } from "../data/mockAssets";

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function toAssetResponse(a: MockAsset): AssetResponse {
  return {
    id: a.id,
    name: a.name,
    serial_number: a.serial_number,
    category_id: a.category_id,
    purchase_cost: a.purchase_cost,
    purchase_date: a.purchase_date,
    salvage_value: a.salvage_value ?? 0,
    useful_life_years: a.useful_life_years,
    location_id: a.location_id,
    status: a.status,
    is_deleted: a.is_deleted ?? false,
    version_number: a.version_number ?? 1,
    created_at: a.created_at,
    updated_at: a.updated_at,
    custom_metadata: a.custom_metadata,
  };
}

export const mockAssetService = {
  getAssets: async (params?: SearchParams): Promise<AssetResponse[]> => {
    await delay();
    let items = db.assets.getAll().filter((a) => !a.is_deleted);
    if (params?.search_term) {
      const s = params.search_term.toLowerCase();
      items = items.filter((a) => a.name.toLowerCase().includes(s) || a.serial_number.toLowerCase().includes(s));
    }
    if (params?.status) items = items.filter((a) => a.status === params.status);
    if (params?.category_id) items = items.filter((a) => a.category_id === params.category_id);
    return items.map(toAssetResponse);
  },

  getAssetById: async (id: string): Promise<AssetResponse> => {
    await delay();
    const asset = db.assets.getById(id);
    if (!asset) throw new Error("Asset not found");
    return toAssetResponse(asset);
  },

  createAsset: async (payload: AssetPayload): Promise<AssetResponse> => {
    await delay();
    const now = new Date().toISOString();
    const asset = db.assets.create({
      id: generateId(),
      ...payload,
      category: "Equipment",
      condition: "Excellent",
      status: "available",
      is_deleted: false,
      version_number: 1,
      created_at: now,
      updated_at: now,
    } as MockAsset);
    return toAssetResponse(asset);
  },

  updateAsset: async (id: string, payload: Partial<AssetPayload & { status: string }>): Promise<AssetResponse> => {
    await delay();
    const updated = db.assets.update(id, { ...payload, updated_at: new Date().toISOString() } as Partial<MockAsset>);
    if (!updated) throw new Error("Asset not found");
    return toAssetResponse(updated);
  },

  deleteAsset: async (id: string): Promise<AssetResponse> => {
    await delay();
    const asset = db.assets.getById(id);
    if (!asset) throw new Error("Asset not found");
    db.assets.update(id, { is_deleted: true, updated_at: new Date().toISOString() } as Partial<MockAsset>);
    return toAssetResponse(asset);
  },

  getDepreciationSchedule: async (_id: string, _method = "STRAIGHT_LINE") => {
    await delay();
    return [
      { year: 1, depreciation: 2000, book_value: 8000 },
      { year: 2, depreciation: 2000, book_value: 6000 },
    ];
  },

  getAssetHistory: async (_id: string) => {
    await delay();
    return [
      { event: "Asset Created", timestamp: "2026-01-15T10:00:00Z", user: "System" },
      { event: "Status: available \u2192 allocated", timestamp: "2026-02-01T08:00:00Z", user: "Admin" },
    ];
  },

  bulkUpdate: async (assetIds: string[], status?: string, locationId?: string) => {
    await delay();
    assetIds.forEach((id) => db.assets.update(id, { status, location_id: locationId } as Partial<MockAsset>));
    return { success: true, updated_count: assetIds.length };
  },

  bulkDelete: async (assetIds: string[]) => {
    await delay();
    assetIds.forEach((id) => db.assets.update(id, { is_deleted: true } as Partial<MockAsset>));
    return { success: true, deleted_count: assetIds.length };
  },
};

export const mockOperationsService = {
  allocateAsset: async (_payload: AllocationPayload) => {
    await delay();
    return { success: true, message: "Asset allocated" };
  },

  returnAsset: async (_assetId: string, _payload: ReturnPayload) => {
    await delay();
    return { success: true, message: "Asset returned" };
  },

  requestTransfer: async (payload: TransferPayload) => {
    await delay();
    const now = new Date().toISOString();
    return db.transfers.create({
      id: generateId(),
      asset_id: payload.asset_id,
      asset_name: "Unknown",
      source_employee_id: "",
      source_name: "Current Custodian",
      target_employee_id: payload.target_employee_id,
      target_name: "Target Employee",
      requested_by: payload.target_employee_id,
      requestor_name: "Requestor",
      status: "requested",
      notes: payload.notes,
      requested_at: now,
    });
  },

  getPendingTransfers: async (): Promise<TransferResponse[]> => {
    await delay();
    return db.transfers.getAll().map((t) => ({
      id: t.id,
      asset_id: t.asset_id,
      source_employee_id: t.source_employee_id,
      target_employee_id: t.target_employee_id,
      requested_by: t.requested_by,
      status: t.status,
      requested_at: t.requested_at,
      actioned_at: t.actioned_at,
      rejection_reason: t.rejection_reason,
    }));
  },

  actionTransfer: async (id: string, action: "APPROVED" | "REJECTED", rejectionReason?: string) => {
    await delay();
    const t = db.transfers.getById(id);
    if (!t) throw new Error("Transfer not found");
    return db.transfers.update(id, {
      status: action === "APPROVED" ? "approved" : "rejected",
      actioned_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
    });
  },
};

export const mockBookingsService = {
  createBooking: async (payload: BookingPayload): Promise<BookingResponseData> => {
    await delay();
    const now = new Date().toISOString();
    const booking = db.bookings.create({
      id: generateId(),
      asset_id: payload.asset_id,
      asset_name: "Booked Resource",
      employee_id: payload.employee_id,
      employee_name: "Employee",
      start_time: payload.start_time,
      end_time: payload.end_time,
      status: "approved",
      created_at: now,
    });
    return {
      id: booking.id,
      asset_id: booking.asset_id,
      employee_id: booking.employee_id,
      start_time: booking.start_time,
      end_time: booking.end_time,
      status: booking.status,
    };
  },

  getBookings: async (_params?: { asset_id?: string; employee_id?: string }): Promise<BookingResponseData[]> => {
    await delay();
    return db.bookings.getAll().map((b) => ({
      id: b.id,
      asset_id: b.asset_id,
      employee_id: b.employee_id,
      start_time: b.start_time,
      end_time: b.end_time,
      status: b.status,
    }));
  },

  cancelBooking: async (id: string): Promise<BookingResponseData> => {
    await delay();
    const b = db.bookings.getById(id);
    if (!b) throw new Error("Booking not found");
    db.bookings.update(id, { status: "cancelled" });
    return {
      id: b.id,
      asset_id: b.asset_id,
      employee_id: b.employee_id,
      start_time: b.start_time,
      end_time: b.end_time,
      status: "cancelled",
    };
  },
};

export const mockMaintenanceService = {
  create: async (payload: MaintenanceCreatePayload): Promise<MaintenanceResponse> => {
    await delay();
    const now = new Date().toISOString();
    const item = db.maintenance.create({
      id: generateId(),
      title: payload.title,
      description: payload.description || "",
      maintenance_type: payload.maintenance_type,
      priority: payload.priority,
      status: "pending_approval",
      asset_id: payload.asset_id,
      category_tag: payload.category_tag || "",
      estimated_cost: payload.estimated_cost || 0,
      actual_cost: 0,
      labor_hours: 0,
      is_recurring: payload.is_recurring || false,
      is_deleted: false,
      version_number: 1,
      parts_required: [],
      attachments: [],
      comments: [],
      status_logs: [],
      created_at: now,
      updated_at: now,
    } as unknown as MaintenanceSummary);
    return { ...item, description: payload.description || "" } as unknown as MaintenanceResponse;
  },

  list: async (params?: {
    status?: string; priority?: string; maintenance_type?: string;
    asset_id?: string; technician_id?: string; search_term?: string;
    sla_breached?: boolean; skip?: number; limit?: number;
  }): Promise<MaintenanceListResponse> => {
    await delay();
    let items = db.maintenance.getAll().filter((m) => !m.is_deleted);
    if (params?.status) items = items.filter((m) => m.status === params.status);
    if (params?.priority) items = items.filter((m) => m.priority === params.priority);
    if (params?.maintenance_type) items = items.filter((m) => m.maintenance_type === params.maintenance_type);
    if (params?.search_term) {
      const s = params.search_term.toLowerCase();
      items = items.filter((m) => m.title.toLowerCase().includes(s));
    }
    const total = items.length;
    const skip = params?.skip ?? 0;
    const limit = params?.limit ?? 50;
    return { items: items.slice(skip, skip + limit), total, skip, limit };
  },

  getById: async (id: string): Promise<MaintenanceResponse> => {
    await delay();
    const item = db.maintenance.getById(id);
    if (!item) throw new Error("Maintenance request not found");
    return item as unknown as MaintenanceResponse;
  },

  update: async (id: string, payload: Partial<MaintenanceCreatePayload>): Promise<MaintenanceResponse> => {
    await delay();
    const updated = db.maintenance.update(id, { ...payload, updated_at: new Date().toISOString() } as Partial<MaintenanceSummary>);
    if (!updated) throw new Error("Maintenance request not found");
    return updated as unknown as MaintenanceResponse;
  },

  approve: async (id: string, _notes?: string): Promise<MaintenanceResponse> => {
    await delay();
    const updated = db.maintenance.update(id, { status: "approved", updated_at: new Date().toISOString() } as Partial<MaintenanceSummary>);
    if (!updated) throw new Error("Maintenance request not found");
    return updated as unknown as MaintenanceResponse;
  },

  reject: async (id: string, rejection_reason: string): Promise<MaintenanceResponse> => {
    await delay();
    const updated = db.maintenance.update(id, { status: "rejected", rejection_reason, updated_at: new Date().toISOString() } as Partial<MaintenanceSummary>);
    if (!updated) throw new Error("Maintenance request not found");
    return updated as unknown as MaintenanceResponse;
  },

  assign: async (id: string, technician_id: string): Promise<MaintenanceResponse> => {
    await delay();
    const updated = db.maintenance.update(id, { status: "assigned", assigned_technician_id: technician_id, updated_at: new Date().toISOString() } as Partial<MaintenanceSummary>);
    if (!updated) throw new Error("Maintenance request not found");
    return updated as unknown as MaintenanceResponse;
  },

  startWork: async (id: string): Promise<MaintenanceResponse> => {
    await delay();
    const now = new Date().toISOString();
    const updated = db.maintenance.update(id, { status: "started", actual_start_at: now, updated_at: now } as Partial<MaintenanceSummary>);
    if (!updated) throw new Error("Maintenance request not found");
    return updated as unknown as MaintenanceResponse;
  },

  pauseWork: async (id: string, _reason?: string): Promise<MaintenanceResponse> => {
    await delay();
    const updated = db.maintenance.update(id, { status: "waiting_parts", updated_at: new Date().toISOString() } as Partial<MaintenanceSummary>);
    if (!updated) throw new Error("Maintenance request not found");
    return updated as unknown as MaintenanceResponse;
  },

  resumeWork: async (id: string): Promise<MaintenanceResponse> => {
    await delay();
    const updated = db.maintenance.update(id, { status: "started", updated_at: new Date().toISOString() } as Partial<MaintenanceSummary>);
    if (!updated) throw new Error("Maintenance request not found");
    return updated as unknown as MaintenanceResponse;
  },

  completeWork: async (id: string, payload: { resolution_notes: string; actual_cost?: number; labor_hours?: number }): Promise<MaintenanceResponse> => {
    await delay();
    const updated = db.maintenance.update(id, { status: "qa_inspection", ...payload, updated_at: new Date().toISOString() } as Partial<MaintenanceSummary>);
    if (!updated) throw new Error("Maintenance request not found");
    return updated as unknown as MaintenanceResponse;
  },

  resolve: async (id: string, _notes?: string): Promise<MaintenanceResponse> => {
    await delay();
    const now = new Date().toISOString();
    const updated = db.maintenance.update(id, { status: "resolved", resolved_at: now, updated_at: now } as Partial<MaintenanceSummary>);
    if (!updated) throw new Error("Maintenance request not found");
    return updated as unknown as MaintenanceResponse;
  },

  close: async (id: string, _final_notes?: string): Promise<MaintenanceResponse> => {
    await delay();
    const now = new Date().toISOString();
    const updated = db.maintenance.update(id, { status: "closed", closed_at: now, updated_at: now } as Partial<MaintenanceSummary>);
    if (!updated) throw new Error("Maintenance request not found");
    return updated as unknown as MaintenanceResponse;
  },

  cancel: async (id: string, cancellation_reason: string): Promise<MaintenanceResponse> => {
    await delay();
    const updated = db.maintenance.update(id, { status: "cancelled", cancellation_reason, updated_at: new Date().toISOString() } as Partial<MaintenanceSummary>);
    if (!updated) throw new Error("Maintenance request not found");
    return updated as unknown as MaintenanceResponse;
  },

  getAnalytics: async (): Promise<MaintenanceAnalytics> => {
    await delay();
    return { ...db.maintenanceAnalytics };
  },

  getOverdue: async (): Promise<MaintenanceSummary[]> => {
    await delay();
    return db.maintenance.getAll().filter((m) => {
      if (!m.sla_due_at || m.status === "closed" || m.status === "resolved" || m.status === "cancelled") return false;
      return new Date(m.sla_due_at) < new Date();
    });
  },

  getTimeline: async (_id: string): Promise<MaintenanceStatusLogData[]> => {
    await delay();
    return [];
  },

  addComment: async (id: string, body: string, is_internal = false): Promise<MaintenanceCommentData> => {
    await delay();
    return { id: generateId(), body, is_internal, author_id: "u-001", created_at: new Date().toISOString() };
  },

  getComments: async (_id: string): Promise<MaintenanceCommentData[]> => {
    await delay();
    return [];
  },

  bulkAction: async (_maintenance_ids: string[], _action: string, _reason?: string) => {
    await delay();
    return { success: true };
  },
};

export const mockAuthService = {
  login: async (email: string, password: string): Promise<{
    token: string;
    user: { id: string; email: string; role: string; permissions: string[]; name: string };
  } | null> => {
    await delay(800);
    const user = mockUsers.find((u) => u.email === email && u.password === password);
    if (!user) return null;
    return {
      token: "mock-jwt-" + user.id,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        name: user.name,
      },
    };
  },
};

export const mockUtils = {
  clearAllData: () => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("assetflow_mock_"));
    keys.forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  },
};
