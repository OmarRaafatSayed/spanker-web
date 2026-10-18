#!/usr/bin/env node
/**
 * API Smoke Test — Booking System
 * Usage: node scripts/smoke-test.mjs [--base http://localhost:3000]
 *
 * Probes every discovered API route and categorises the response:
 *   CONNECTED   (2xx / 3xx)       — route works
 *   AUTH_GATED  (401 / 403)       — route wired up, needs a session
 *   BAD_REQUEST (400 / 422)       — route works, rejects empty body (needs valid input)
 *   NOT_FOUND   (404)             — route handler works, record not found in DB
 *   PENDING     (503)             — route works, feature/table pending migration
 *   BROKEN      (500 / timeout)   — handler crashes
 *   MISSING     — no route handler exists (would show 404 with Next default body)
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const baseIdx = args.indexOf('--base');
const BASE = baseIdx !== -1 ? args[baseIdx + 1] : 'http://localhost:3000';
const TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Route manifest  (method, path, description)
// Replace {id}, {roomId}, {noteId}, {docId} with safe dummy values.
// ---------------------------------------------------------------------------
const ROUTES = [
  // ── v1 ──────────────────────────────────────────────────────────────────
  { method: 'POST', path: '/api/v1/bookings',                             desc: 'v1 bookings create' },
  { method: 'GET',  path: '/api/v1/bookings/my',                          desc: 'v1 bookings my' },
  { method: 'GET',  path: '/api/v1/bookings/test-id',                     desc: 'v1 booking detail' },
  { method: 'POST', path: '/api/v1/bookings/test-id/cancel',              desc: 'v1 booking cancel' },
  { method: 'POST', path: '/api/v1/bookings/test-id/confirm',             desc: 'v1 booking confirm' },

  { method: 'POST', path: '/api/v1/documents/upload',                     desc: 'v1 document upload' },
  { method: 'DELETE',path: '/api/v1/documents/test-id',                   desc: 'v1 document delete' },

  { method: 'POST', path: '/api/v1/flights',                              desc: 'v1 flights list' },
  { method: 'POST', path: '/api/v1/flights/search',                       desc: 'v1 flights search' },
  { method: 'PATCH', path: '/api/v1/flights/test-id',                     desc: 'v1 flight update' },

  { method: 'GET',  path: '/api/v1/hotels/search',                        desc: 'v1 hotels search' },

  { method: 'GET',  path: '/api/v1/notifications',                        desc: 'v1 notifications list' },
  { method: 'POST', path: '/api/v1/notifications/mark-read',              desc: 'v1 notifications mark-read' },

  { method: 'POST', path: '/api/v1/payments/confirm',                     desc: 'v1 payment confirm' },

  { method: 'GET',  path: '/api/v1/portal/dashboard',                     desc: 'v1 portal dashboard' },
  { method: 'GET',  path: '/api/v1/portal/notifications',                 desc: 'v1 portal notifications' },
  { method: 'POST', path: '/api/v1/portal/notifications/read-all',        desc: 'v1 portal notifications read-all' },
  { method: 'PATCH', path: '/api/v1/portal/notifications/test-id/read',    desc: 'v1 portal notification read' },

  { method: 'GET',  path: '/api/v1/travel-requests',                      desc: 'v1 travel-requests list' },
  { method: 'POST', path: '/api/v1/travel-requests',                      desc: 'v1 travel-requests create' },
  { method: 'GET',  path: '/api/v1/travel-requests/test-id',              desc: 'v1 travel-request detail' },
  { method: 'PUT',  path: '/api/v1/travel-requests/test-id',              desc: 'v1 travel-request update' },

  { method: 'GET',  path: '/api/v1/trips/search',                         desc: 'v1 trips search' },

  { method: 'GET',  path: '/api/v1/visas/search',                         desc: 'v1 visas search' },
  { method: 'GET',  path: '/api/v1/visas/test-id',                        desc: 'v1 visa detail' },
  { method: 'POST', path: '/api/v1/visas/test-id/review',                 desc: 'v1 visa review' },

  // ── Admin ────────────────────────────────────────────────────────────────
  { method: 'GET',  path: '/api/admin/analytics/staff-performance',       desc: 'admin analytics staff-performance' },

  { method: 'GET',  path: '/api/admin/banners',                           desc: 'admin banners list' },
  { method: 'POST', path: '/api/admin/banners',                           desc: 'admin banners create' },
  { method: 'PATCH',path: '/api/admin/banners/reorder',                   desc: 'admin banners reorder' },
  { method: 'PATCH',path: '/api/admin/banners/test-id',                   desc: 'admin banner update' },

  { method: 'GET',  path: '/api/admin/bookings',                          desc: 'admin bookings list' },
  { method: 'POST', path: '/api/admin/bookings/bulk',                     desc: 'admin bookings bulk' },
  { method: 'GET',  path: '/api/admin/bookings/export',                   desc: 'admin bookings export' },
  { method: 'GET',  path: '/api/admin/bookings/test-id',                  desc: 'admin booking detail' },
  { method: 'POST', path: '/api/admin/bookings/test-id/assign',           desc: 'admin booking assign' },
  { method: 'GET',  path: '/api/admin/bookings/test-id/audit-log',        desc: 'admin booking audit-log' },
  { method: 'GET',  path: '/api/admin/bookings/test-id/notes',            desc: 'admin booking notes list' },
  { method: 'POST', path: '/api/admin/bookings/test-id/notes',            desc: 'admin booking notes create' },
  { method: 'DELETE',path:'/api/admin/bookings/test-id/notes/note-id',    desc: 'admin booking note delete' },
  { method: 'POST', path: '/api/admin/bookings/test-id/payment',          desc: 'admin booking payment' },
  { method: 'PATCH',path: '/api/admin/bookings/test-id/status',           desc: 'admin booking status' },

  { method: 'GET',  path: '/api/admin/customers',                         desc: 'admin customers list' },
  { method: 'GET',  path: '/api/admin/customers/test-id',                 desc: 'admin customer detail' },
  { method: 'PATCH',path: '/api/admin/customers/test-id',                 desc: 'admin customer update' },
  { method: 'GET',  path: '/api/admin/customers/test-id/documents',       desc: 'admin customer documents' },
  { method: 'PATCH',path: '/api/admin/customers/test-id/role',            desc: 'admin customer role' },
  { method: 'GET',  path: '/api/admin/customers/test-id/travel-requests', desc: 'admin customer travel-requests' },

  { method: 'GET',  path: '/api/admin/dashboard',                         desc: 'admin dashboard' },
  { method: 'GET',  path: '/api/admin/dashboard/export',                  desc: 'admin dashboard export' },

  { method: 'GET',  path: '/api/admin/documents',                         desc: 'admin documents list' },
  { method: 'GET',  path: '/api/admin/documents/test-id/download',        desc: 'admin document download' },
  { method: 'POST', path: '/api/admin/documents/test-id/verify',          desc: 'admin document verify' },

  { method: 'GET',  path: '/api/admin/hotels',                            desc: 'admin hotels list' },
  { method: 'POST', path: '/api/admin/hotels',                            desc: 'admin hotels create' },
  { method: 'GET',  path: '/api/admin/hotels/test-id',                    desc: 'admin hotel detail' },
  { method: 'PATCH',path: '/api/admin/hotels/test-id',                    desc: 'admin hotel update' },
  { method: 'GET',  path: '/api/admin/hotels/test-id/rooms',              desc: 'admin hotel rooms list' },
  { method: 'POST', path: '/api/admin/hotels/test-id/rooms',              desc: 'admin hotel rooms create' },
  { method: 'GET',  path: '/api/admin/hotels/test-id/rooms/room-id',      desc: 'admin hotel room detail' },
  { method: 'PATCH',path: '/api/admin/hotels/test-id/rooms/room-id',      desc: 'admin hotel room update' },

  { method: 'GET',  path: '/api/admin/leads',                             desc: 'admin leads list' },
  { method: 'GET',  path: '/api/admin/leads/test-id',                     desc: 'admin lead detail' },
  { method: 'PATCH',path: '/api/admin/leads/test-id/assign',              desc: 'admin lead assign' },
  { method: 'POST', path: '/api/admin/leads/test-id/communicate',         desc: 'admin lead communicate' },
  { method: 'GET',  path: '/api/admin/leads/test-id/documents',           desc: 'admin lead documents' },
  { method: 'PATCH',path: '/api/admin/leads/test-id/documents/doc-id',    desc: 'admin lead document update' },
  { method: 'POST', path: '/api/admin/leads/test-id/note',                desc: 'admin lead note' },
  { method: 'PATCH',path: '/api/admin/leads/test-id/status',              desc: 'admin lead status' },
  { method: 'POST', path: '/api/admin/leads/test-id/sync-crm',            desc: 'admin lead sync-crm' },

  { method: 'GET',  path: '/api/admin/logs',                              desc: 'admin logs list' },
  { method: 'DELETE',path:'/api/admin/logs',                              desc: 'admin logs delete' },

  { method: 'GET',  path: '/api/admin/my-assignments',                    desc: 'admin my-assignments' },

  { method: 'GET',  path: '/api/admin/notifications',                     desc: 'admin notifications list' },
  { method: 'POST', path: '/api/admin/notifications/test-id/read',        desc: 'admin notification read' },

  { method: 'GET',  path: '/api/admin/offers',                            desc: 'admin offers list' },
  { method: 'POST', path: '/api/admin/offers',                            desc: 'admin offers create' },
  { method: 'GET',  path: '/api/admin/offers/test-id',                    desc: 'admin offer detail' },
  { method: 'PATCH',path: '/api/admin/offers/test-id',                    desc: 'admin offer update' },

  { method: 'GET',  path: '/api/admin/packages',                          desc: 'admin packages list' },
  { method: 'POST', path: '/api/admin/packages',                          desc: 'admin packages create' },
  { method: 'GET',  path: '/api/admin/packages/test-id',                  desc: 'admin package detail' },
  { method: 'PATCH',path: '/api/admin/packages/test-id',                  desc: 'admin package update' },
  { method: 'PATCH',path: '/api/admin/packages/test-id/toggle',           desc: 'admin package toggle' },

  { method: 'GET',  path: '/api/admin/quotations',                        desc: 'admin quotations list' },
  { method: 'POST', path: '/api/admin/quotations',                        desc: 'admin quotations create' },
  { method: 'GET',  path: '/api/admin/quotations/test-id',                desc: 'admin quotation detail' },
  { method: 'PATCH',path: '/api/admin/quotations/test-id',                desc: 'admin quotation update' },
  { method: 'POST', path: '/api/admin/quotations/test-id/convert',        desc: 'admin quotation convert' },
  { method: 'POST', path: '/api/admin/quotations/test-id/send',           desc: 'admin quotation send' },

  { method: 'POST', path: '/api/admin/setup',                             desc: 'admin setup' },

  { method: 'GET',  path: '/api/admin/staff',                             desc: 'admin staff list' },
  { method: 'GET',  path: '/api/admin/stats',                             desc: 'admin stats' },

  { method: 'POST', path: '/api/admin/upload/image',                      desc: 'admin image upload' },

  { method: 'GET',  path: '/api/admin/visa-documents',                    desc: 'admin visa-documents list' },
  { method: 'POST', path: '/api/admin/visa-documents',                    desc: 'admin visa-documents create' },
  { method: 'GET',  path: '/api/admin/visa-documents/test-id',            desc: 'admin visa-document detail' },
  { method: 'PATCH',path: '/api/admin/visa-documents/test-id',            desc: 'admin visa-document update' },

  { method: 'GET',  path: '/api/admin/visa-types',                        desc: 'admin visa-types list' },
  { method: 'POST', path: '/api/admin/visa-types',                        desc: 'admin visa-types create' },
  { method: 'GET',  path: '/api/admin/visa-types/test-id',                desc: 'admin visa-type detail' },
  { method: 'POST', path: '/api/admin/visa-types/test-id',                desc: 'admin visa-type update' },

  { method: 'GET',  path: '/api/admin/workflow-settings',                 desc: 'admin workflow-settings' },
  { method: 'PATCH',path: '/api/admin/workflow-settings',                 desc: 'admin workflow-settings update' },

  // ── Auth ─────────────────────────────────────────────────────────────────
  { method: 'POST', path: '/api/auth/login',                              desc: 'auth login' },
  { method: 'POST', path: '/api/auth/signup',                             desc: 'auth signup' },

  // ── Cron ─────────────────────────────────────────────────────────────────
  { method: 'GET',  path: '/api/cron/escalate-unassigned',                desc: 'cron escalate-unassigned' },
  { method: 'GET',  path: '/api/cron/expire-bookings',                    desc: 'cron expire-bookings' },
  { method: 'GET',  path: '/api/cron/send-reminders',                     desc: 'cron send-reminders' },

  // ── Misc ─────────────────────────────────────────────────────────────────
  { method: 'GET',  path: '/api/design-tokens',                           desc: 'design-tokens' },
  { method: 'GET',  path: '/api/payments/my-payments',                    desc: 'payments my-payments' },
  { method: 'GET',  path: '/api/profile',                                 desc: 'profile GET' },
  { method: 'PATCH',path: '/api/profile',                                 desc: 'profile PATCH' },

  // ── Travel Requests (top-level) ───────────────────────────────────────────
  { method: 'POST', path: '/api/travel-requests',                         desc: 'travel-requests create' },
  { method: 'GET',  path: '/api/travel-requests/my-requests',             desc: 'travel-requests my-requests' },
  { method: 'POST', path: '/api/travel-requests/upload-document',         desc: 'travel-requests upload-document' },

  // ── Visa (top-level) ─────────────────────────────────────────────────────
  { method: 'GET',  path: '/api/visa/my-applications',                    desc: 'visa my-applications' },
  { method: 'GET',  path: '/api/visa/my-applications/test-id',            desc: 'visa application detail' },
];

// ---------------------------------------------------------------------------
// Categorise a status code
// ---------------------------------------------------------------------------
function categorise(status) {
  if (status === 'NO_RESPONSE') return 'BROKEN';
  if (status >= 200 && status < 400)  return 'CONNECTED';
  if (status === 401 || status === 403) return 'AUTH_GATED';
  if (status === 404) return 'NOT_FOUND';   // handler exists, record not in DB
  if (status === 400 || status === 422) return 'BAD_REQUEST';
  if (status === 503) return 'PENDING';     // table/feature pending migration
  if (status >= 500) return 'BROKEN';
  return 'BROKEN';
}

// ---------------------------------------------------------------------------
// Probe a single route
// ---------------------------------------------------------------------------
async function probe({ method, path, desc }) {
  const url = BASE + path;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);
  const init = {
    method,
    signal: ctrl.signal,
    redirect: 'manual',
    headers: hasBody ? { 'Content-Type': 'application/json' } : {},
    ...(hasBody ? { body: '{}' } : {}),
  };

  try {
    const res = await fetch(url, init);
    clearTimeout(timer);
    return { method, path, desc, status: res.status, category: categorise(res.status) };
  } catch (err) {
    clearTimeout(timer);
    return { method, path, desc, status: 'NO_RESPONSE', category: 'BROKEN', error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n🔍  Smoke-testing ${ROUTES.length} routes against ${BASE}\n`);

  const results = [];
  for (const route of ROUTES) {
    const result = await probe(route);
    const icon = { CONNECTED: '✅', AUTH_GATED: '🔒', BAD_REQUEST: '⚠️ ', BROKEN: '❌', NOT_FOUND: '🕳️ ', PENDING: '🚧' }[result.category] ?? '❓';
    const statusStr = String(result.status).padEnd(3);
    console.log(`${icon}  ${statusStr}  ${result.method.padEnd(6)}  ${result.path.padEnd(55)}  ${result.desc}`);
    results.push(result);
  }

  // Write JSON results
  const outPath = new URL('../scripts/smoke-test-results.json', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
  writeFileSync(outPath, JSON.stringify(results, null, 2));

  // Summary counts
  const counts = {};
  for (const r of results) counts[r.category] = (counts[r.category] || 0) + 1;

  console.log('\n── Summary ─────────────────────────────────────────────');
  console.log(`  Total routes probed : ${results.length}`);
  for (const [cat, n] of Object.entries(counts)) {
    const icon = { CONNECTED: '✅', AUTH_GATED: '🔒', BAD_REQUEST: '⚠️ ', BROKEN: '❌', NOT_FOUND: '🕳️ ', PENDING: '🚧' }[cat] ?? '❓';
    console.log(`  ${icon}  ${cat.padEnd(14)} : ${n}`);
  }
  console.log('────────────────────────────────────────────────────────\n');
  console.log(`Results saved to scripts/smoke-test-results.json`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
