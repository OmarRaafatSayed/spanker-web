/**
 * lib/api.ts — COMPATIBILITY SHIM
 * =================================
 * All API endpoints have been moved to their feature modules.
 * This file re-exports everything for backward compatibility.
 *
 * Prefer importing directly from feature modules:
 *   import { login, signup }          from "@/modules/auth";
 *   import { getMyVisaApplications }  from "@/modules/visa";
 *   import { crmAdapter }             from "@/modules/crm";
 *   import { travelRequestsApi }      from "@/modules/travel";
 *
 * @deprecated Use feature-module imports above instead.
 */

export { login, signup }                    from "@/modules/auth";
export { getMyVisaApplications }            from "@/modules/visa";
export {
  travelRequestsApi,
  documentRequirementsApi,
  documentsApi,
  realtimeApi,
  crmApi,
}                                           from "@/modules/travel";

// Remaining endpoints still in lib/api/
export { searchFlights }                    from "./api/flight-endpoints";
export { getProfile, updateProfile }        from "./api/profile-endpoints";
export { getMyPayments }                    from "./api/payment-endpoints";
export { saveSession, clearSession, getToken } from "./api/api-utils";
