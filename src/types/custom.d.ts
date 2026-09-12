/**
 * Custom Type Definitions & Aliases
 * Bridges gaps between DB types and application types
 */

import type { Database } from './database';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Service Result Pattern
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ServiceResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: string };

export function success<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(error: string): ServiceResult<T> {
  return { ok: false, error };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Document Checklist Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface DocumentChecklistItem {
  type: string;
  label: string;
  required: boolean;
  uploaded?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface DocumentChecklist {
  required: DocumentChecklistItem[];
  optional: DocumentChecklistItem[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Travel Request Extended Type
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type TravelRequestDB = Database['public']['Tables']['travel_requests']['Row'];

export interface TravelRequest extends Omit<TravelRequestDB, 'document_checklist'> {
  document_checklist?: DocumentChecklist | null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Banner Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type BannerRow = Database['public']['Tables']['content_banners']['Row'];
export type BannerInsert = Database['public']['Tables']['content_banners']['Insert'];
export type BannerUpdate = Database['public']['Tables']['content_banners']['Update'];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type SingleResult = { data: any; error: any };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Global Type Augmentation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

declare global {
  type TravelType = 'tourism' | 'business' | 'study' | 'transit' | 'other';
  
  // Re-export for global use
  type ServiceResult<T> = import('./custom').ServiceResult<T>;
  type TravelRequest = import('./custom').TravelRequest;
  type DocumentChecklist = import('./custom').DocumentChecklist;
}

export {};
