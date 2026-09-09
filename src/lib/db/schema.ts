/**
 * Database schema table name mappings
 * Maps logical camelCase names to actual snake_case table names
 */

export const TABLES = {
  // Core tables
  profiles: 'profiles',
  organizations: 'organizations',
  
  // Booking system
  travelRequests: 'travel_requests',
  customerRequests: 'customer_requests',
  
  // Inventory
  flights: 'flights',
  trips: 'trips',
  hotelOffers: 'hotel_offers',
  flightSearchCache: 'flight_search_cache',
  
  // Booking details (1:1 with travel_requests)
  flightBookingDetails: 'flight_booking_details',
  hotelBookingDetails: 'hotel_booking_details',
  visaBookingDetails: 'visa_booking_details',
  tripBookingDetails: 'trip_booking_details',
  
  // Financial
  paymentRecords: 'payment_records',
  
  // Visa
  visaApplications: 'visa_applications',
  documentRequirements: 'document_requirements',
  
  // Documents & communications
  customerDocuments: 'customer_documents',
  portalDocuments: 'portal_documents',
  customerCommunications: 'customer_communications',
  
  // Portal system
  portalNotifications: 'portal_notifications',
  portalStatusLog: 'portal_status_log',
  
  // Config
  bookingPolicies: 'booking_policies',
  visaStatusMapping: 'visa_status_mapping',
  
  // Internal
  syncQueue: 'sync_queue',
  systemLogs: 'system_logs',
  webhookProcessingLog: 'webhook_processing_log',
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];
