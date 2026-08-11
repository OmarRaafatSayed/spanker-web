/**
 * visa-states.ts
 * ==============
 * Single source of truth for all visa / travel-request state representations.
 *
 * PROBLEM SOLVED:
 *   The CRM (FastAPI + Supabase) stores visa status as an INTEGER (1–7).
 *   The Customer Portal uses STRING slugs ("pending_documents", etc.).
 *   These were being mapped ad-hoc in every component, causing silent mismatches.
 *
 * SOLUTION:
 *   One canonical enum, two bidirectional maps, and strict typed helpers.
 *   All components MUST import from here — never hardcode status literals.
 */

// =============================================================================
// 1. Portal string slugs (used by Next.js UI and Supabase travel_requests table)
// =============================================================================

export const PORTAL_STATUSES = [
  "pending_documents",
  "documents_review",
  "docs_approved",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type PortalStatus = (typeof PORTAL_STATUSES)[number];

// =============================================================================
// 2. CRM integer codes (used by FastAPI visa_applications.status column)
// =============================================================================

export const CRM_STATUS_CODES = [1, 2, 3, 4, 5, 6, 7] as const;
export type CrmStatusCode = (typeof CRM_STATUS_CODES)[number];

// =============================================================================
// 3. Bidirectional maps
//
//  CRM integer  → Portal slug (for reading data from FastAPI)
//  Portal slug  → CRM integer (for writing / filtering via FastAPI)
//
//  Note: The CRM has 7 states; the Portal has 6.
//  CRM 5 "Approved" → Portal "completed"   (terminal success)
//  CRM 6 "Rejected" → Portal "cancelled"   (terminal failure)
//  CRM 7 "Cancelled"→ Portal "cancelled"   (both map to same UI state)
//
//  The reverse map uses the "most canonical" CRM code per portal slug.
// =============================================================================

export const CRM_TO_PORTAL_MAP: Record<CrmStatusCode, PortalStatus> = {
  1: "pending_documents",  // Documents Collected  → waiting on customer
  2: "documents_review",  // In Review             → staff is checking
  3: "in_progress",        // Embassy Appointment   → actively processing
  4: "in_progress",        // Submitted to Consulate→ still in_progress
  5: "completed",          // Approved              → done ✓
  6: "cancelled",          // Rejected              → terminal failure
  7: "cancelled",          // Cancelled             → terminal cancelled
} as const;

export const PORTAL_TO_CRM_MAP: Record<PortalStatus, CrmStatusCode> = {
  pending_documents: 1,   // maps to "Documents Collected"
  documents_review:  2,   // maps to "In Review"
  docs_approved:     2,   // no exact CRM equivalent → stay at "In Review"
  in_progress:       3,   // maps to "Embassy Appointment" (first active step)
  completed:         5,   // maps to "Approved"
  cancelled:         7,   // maps to "Cancelled"
} as const;

// =============================================================================
// 4. Human-readable labels (used in UI badges, dropdowns, tooltips)
// =============================================================================

export const CRM_STATUS_LABELS: Record<CrmStatusCode, string> = {
  1: "Documents Collected",
  2: "In Review",
  3: "Embassy Appointment",
  4: "Submitted to Consulate",
  5: "Approved",
  6: "Rejected",
  7: "Cancelled",
};

export const PORTAL_STATUS_LABELS: Record<PortalStatus, string> = {
  pending_documents: "Pending Documents",
  documents_review:  "Documents Under Review",
  docs_approved:     "Documents Approved",
  in_progress:       "In Progress",
  completed:         "Completed",
  cancelled:         "Cancelled",
};

// =============================================================================
// 5. UI presentation metadata (badge colours, icons hints)
// =============================================================================

export type StatusVariant = "default" | "warning" | "info" | "success" | "destructive";

export const PORTAL_STATUS_VARIANT: Record<PortalStatus, StatusVariant> = {
  pending_documents: "warning",
  documents_review:  "info",
  docs_approved:     "info",
  in_progress:       "default",
  completed:         "success",
  cancelled:         "destructive",
};

// =============================================================================
// 6. Valid FSM transitions
//    Only these transitions are permitted from the Portal side.
//    Staff-initiated transitions via CRM are unrestricted.
// =============================================================================

export const ALLOWED_PORTAL_TRANSITIONS: Record<PortalStatus, PortalStatus[]> = {
  pending_documents: ["documents_review", "cancelled"],
  documents_review:  ["docs_approved", "pending_documents", "cancelled"],
  docs_approved:     ["in_progress", "cancelled"],
  in_progress:       ["completed", "cancelled"],
  completed:         [],        // terminal — no further transitions
  cancelled:         [],        // terminal — no further transitions
};

// =============================================================================
// 7. Strict typed helper functions
// =============================================================================

/**
 * Convert a CRM integer status code to the Portal string slug.
 * Never throws — returns a safe fallback on unknown input.
 *
 * @example
 *   mapCrmStatusToPortal(3) // → "in_progress"
 *   mapCrmStatusToPortal(9) // → "pending_documents" (safe fallback)
 */
export function mapCrmStatusToPortal(statusId: number): PortalStatus {
  if (statusId in CRM_TO_PORTAL_MAP) {
    return CRM_TO_PORTAL_MAP[statusId as CrmStatusCode];
  }
  console.warn(`[visa-states] Unknown CRM status code: ${statusId}. Defaulting to "pending_documents".`);
  return "pending_documents";
}

/**
 * Convert a Portal string status slug to the CRM integer code.
 * Never throws — returns 1 (Documents Collected) on unknown input.
 *
 * @example
 *   mapPortalStatusToCrm("in_progress") // → 3
 *   mapPortalStatusToCrm("bad_value")   // → 1 (safe fallback)
 */
export function mapPortalStatusToCrm(statusEnum: string): CrmStatusCode {
  if (statusEnum in PORTAL_TO_CRM_MAP) {
    return PORTAL_TO_CRM_MAP[statusEnum as PortalStatus];
  }
  console.warn(`[visa-states] Unknown Portal status slug: "${statusEnum}". Defaulting to 1.`);
  return 1;
}

/**
 * Returns true if a given Portal status is a terminal state (no further transitions).
 */
export function isTerminalStatus(status: PortalStatus): boolean {
  return ALLOWED_PORTAL_TRANSITIONS[status].length === 0;
}

/**
 * Returns true if transitioning from `from` to `to` is a valid FSM move.
 */
export function isValidTransition(from: PortalStatus, to: PortalStatus): boolean {
  return ALLOWED_PORTAL_TRANSITIONS[from].includes(to);
}

/**
 * Type guard: check if an arbitrary string is a known PortalStatus.
 */
export function isPortalStatus(value: unknown): value is PortalStatus {
  return typeof value === "string" && (PORTAL_STATUSES as readonly string[]).includes(value);
}

/**
 * Type guard: check if a number is a known CRM status code.
 */
export function isCrmStatusCode(value: unknown): value is CrmStatusCode {
  return typeof value === "number" && (CRM_STATUS_CODES as readonly number[]).includes(value);
}

/**
 * Normalise an incoming status value from any source (string or number)
 * to a typed PortalStatus. Safe to call on raw API payloads.
 */
export function normalizeToPortalStatus(raw: unknown): PortalStatus {
  if (typeof raw === "number") return mapCrmStatusToPortal(raw);
  if (typeof raw === "string") {
    if (isPortalStatus(raw)) return raw;
    // Maybe it's a stringified integer from a legacy source
    const n = Number(raw);
    if (!Number.isNaN(n)) return mapCrmStatusToPortal(n);
  }
  return "pending_documents";
}
