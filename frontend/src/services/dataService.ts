/**
 * dataService.ts — Unified data service layer
 *
 * Set USE_MOCK to true in the config below to use static/mock data (no backend needed).
 * When USE_MOCK is false, real API calls are used.
 *
 * Mock data persists in localStorage under "assetflow_mock_*" keys.
 * Call mockUtils.clearAllData() to reset mock data.
 */

export const USE_MOCK = true;

if (USE_MOCK) {
  console.info("[dataService] Using MOCK data layer — no backend required");
  console.info("[dataService] Credentials: admin@assetflow.com / admin123");
}

// --
// Always export mock services. Pages import from this file.
// To switch to real API, change USE_MOCK above and update the exports below.
// --

export {
  mockAssetService as assetService,
  mockOperationsService as operationsService,
  mockBookingsService as bookingsService,
  mockMaintenanceService as maintenanceService,
} from "./mockService";

export { mockUtils } from "./mockService";

// Re-export mock data types for convenience
export type { MockAsset } from "../data/mockAssets";
export type { MockUser } from "../data/mockUsers";
export type { DashboardData } from "../data/mockDashboard";
export type { MockAuditCycle } from "../data/mockAudits";
export type { MockReportDocument } from "../data/mockReports";
export type { AppSettings } from "../data/mockSettings";
