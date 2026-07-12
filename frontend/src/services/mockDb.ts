const STORAGE_PREFIX = "assetflow_mock_";

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw) as T;
  } catch { }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch { }
}

class Collection<T extends { id: string }> {
  private items: Map<string, T> = new Map();

  constructor(private name: string, initialData: T[]) {
    const saved = loadFromStorage<T[]>(name, initialData);
    saved.forEach((item) => this.items.set(item.id, item));
  }

  private persist(): void {
    saveToStorage(this.name, Array.from(this.items.values()));
  }

  getAll(): T[] {
    return Array.from(this.items.values());
  }

  getById(id: string): T | undefined {
    return this.items.get(id);
  }

  query(predicate: (item: T) => boolean): T[] {
    return Array.from(this.items.values()).filter(predicate);
  }

  create(data: Omit<T, "id"> & { id?: string }): T {
    const item = { ...data, id: data.id || generateId() } as unknown as T;
    this.items.set(item.id, item);
    this.persist();
    return item;
  }

  update(id: string, data: Partial<T>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, id } as T;
    this.items.set(id, updated);
    this.persist();
    return updated;
  }

  delete(id: string): boolean {
    const result = this.items.delete(id);
    if (result) this.persist();
    return result;
  }

  clear(): void {
    this.items.clear();
    this.persist();
  }

  seed(data: T[]): void {
    data.forEach((item) => this.items.set(item.id, item));
    this.persist();
  }
}

import { mockAssets, type MockAsset } from "../data/mockAssets";
import { mockUsers, type MockUser } from "../data/mockUsers";
import { mockBookings, type MockBooking } from "../data/mockBookings";
import { mockTransfers, type MockTransfer } from "../data/mockTransfers";
import { mockMaintenanceItems, mockMaintenanceAnalytics } from "../data/mockMaintenance";
import type { MaintenanceAnalytics, MaintenanceSummary } from "./api";
import { mockAuditCycles, type MockAuditCycle } from "../data/mockAudits";
import { mockReportDocuments, type MockReportDocument } from "../data/mockReports";
import { mockAppSettings, type AppSettings } from "../data/mockSettings";

export const db = {
  assets: new Collection<MockAsset>("assets", mockAssets),
  users: new Collection<MockUser>("users", mockUsers),
  bookings: new Collection<MockBooking>("bookings", mockBookings),
  transfers: new Collection<MockTransfer>("transfers", mockTransfers),
  maintenance: new Collection<MaintenanceSummary>("maintenance", mockMaintenanceItems),
  maintenanceAnalytics: { ...mockMaintenanceAnalytics },
  audits: new Collection<MockAuditCycle>("audits", mockAuditCycles),
  reports: new Collection<MockReportDocument>("reports", mockReportDocuments),
  settings: loadFromStorage("settings", { ...mockAppSettings }),
};

export { generateId };
