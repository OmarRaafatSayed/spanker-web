/**
 * /src/modules/admin — public barrel
 * ====================================
 * Import everything admin-related from here.
 */

// Services — server-side guards (used in API routes)
export { requireAdminAuth, requireAdminOnly } from "./services/admin-auth";
export type { AdminAuthResult, AdminAuthSuccess, AdminAuthFailure } from "./services/admin-auth";

// Stores
export { useAdminStore }     from "./store/adminStore";
export { useAnalyticsStore } from "./store/analyticsStore";

// Components
export { NotificationDropdown } from "./components/NotificationDropdown";
export { CrmStatusPill }        from "./components/CrmStatusPill";
