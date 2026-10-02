import { createServerClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/schema';
import {
  AppError,
  NotFoundError,
  ValidationError,
} from '@/lib/api/errors';
import type {
  DashboardResponse,
  RequestResponse,
  RequestDetailResponse,
  CreateRequestBody,
  NotificationResponse,
} from '@/modules/portal/types/portal.types';

/**
 * Portal Service Layer
 * Server-side data access for portal operations
 * All methods use createServerClient() internally and enforce user scoping
 */

export const portalService = {
  /**
   * Get dashboard statistics and recent requests for a user
   * @param userId - auth.users.id (UUID)
   * @returns DashboardResponse with counts and latest 5 requests
   */
  async getDashboard(userId: string): Promise<DashboardResponse> {
    const supabase = await createServerClient();

    // First, get the profile.id for this user (needed for documents/notifications)
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.profiles)
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      throw new AppError(
        `Failed to fetch profile: ${profileError.message}`,
        500
      );
    }

    if (!profile) {
      throw new NotFoundError('Profile');
    }

    const profileId = profile.id;

    // Run parallel queries for dashboard stats
    const [
      totalRequestsResult,
      activeRequestsResult,
      completedRequestsResult,
      totalDocumentsResult,
      pendingDocumentsResult,
      approvedDocumentsResult,
      rejectedDocumentsResult,
      unreadNotificationsResult,
      latestRequestsResult,
    ] = await Promise.all([
      // Total requests
      supabase
        .from(TABLES.travelRequests)
        .select('id', { count: 'exact', head: true })
        .eq('client_user_id', userId),

      // Active requests (pending or confirmed)
      supabase
        .from(TABLES.travelRequests)
        .select('id', { count: 'exact', head: true })
        .eq('client_user_id', userId)
        .in('booking_status', ['pending', 'confirmed']),

      // Completed requests
      supabase
        .from(TABLES.travelRequests)
        .select('id', { count: 'exact', head: true })
        .eq('client_user_id', userId)
        .eq('booking_status', 'confirmed'),

      // Total documents
      supabase
        .from(TABLES.customerDocuments)
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', profileId),

      // Pending documents (uploaded status)
      supabase
        .from(TABLES.customerDocuments)
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', profileId)
        .eq('status', 'uploaded'),

      // Approved documents
      supabase
        .from(TABLES.customerDocuments)
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', profileId)
        .eq('status', 'approved'),

      // Rejected documents
      supabase
        .from(TABLES.customerDocuments)
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', profileId)
        .eq('status', 'rejected'),

      // Unread notifications
      supabase
        .from(TABLES.portalNotifications)
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', profileId)
        .eq('is_read', false),

      // Latest 5 requests
      supabase
        .from(TABLES.travelRequests)
        .select('*')
        .eq('client_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // Check for errors in any query
    if (totalRequestsResult.error) {
      throw new AppError(
        `Failed to fetch total requests: ${totalRequestsResult.error.message}`,
        500
      );
    }
    if (activeRequestsResult.error) {
      throw new AppError(
        `Failed to fetch active requests: ${activeRequestsResult.error.message}`,
        500
      );
    }
    if (completedRequestsResult.error) {
      throw new AppError(
        `Failed to fetch completed requests: ${completedRequestsResult.error.message}`,
        500
      );
    }
    if (totalDocumentsResult.error) {
      throw new AppError(
        `Failed to fetch total documents: ${totalDocumentsResult.error.message}`,
        500
      );
    }
    if (pendingDocumentsResult.error) {
      throw new AppError(
        `Failed to fetch pending documents: ${pendingDocumentsResult.error.message}`,
        500
      );
    }
    if (approvedDocumentsResult.error) {
      throw new AppError(
        `Failed to fetch approved documents: ${approvedDocumentsResult.error.message}`,
        500
      );
    }
    if (rejectedDocumentsResult.error) {
      throw new AppError(
        `Failed to fetch rejected documents: ${rejectedDocumentsResult.error.message}`,
        500
      );
    }
    if (unreadNotificationsResult.error) {
      throw new AppError(
        `Failed to fetch unread notifications: ${unreadNotificationsResult.error.message}`,
        500
      );
    }
    if (latestRequestsResult.error) {
      throw new AppError(
        `Failed to fetch latest requests: ${latestRequestsResult.error.message}`,
        500
      );
    }

    return {
      total_requests: totalRequestsResult.count ?? 0,
      active_requests: activeRequestsResult.count ?? 0,
      completed_requests: completedRequestsResult.count ?? 0,
      total_documents: totalDocumentsResult.count ?? 0,
      pending_documents: pendingDocumentsResult.count ?? 0,
      approved_documents: approvedDocumentsResult.count ?? 0,
      rejected_documents: rejectedDocumentsResult.count ?? 0,
      unread_notifications: unreadNotificationsResult.count ?? 0,
      latest_requests: latestRequestsResult.data ?? [],
    };
  },

  /**
   * Get paginated list of travel requests for a user
   * @param userId - auth.users.id
   * @param opts - { status?, page, limit }
   * @returns { data: RequestResponse[], total: number }
   */
  async getRequests(
    userId: string,
    opts: { status?: string; page: number; limit: number }
  ): Promise<{ data: RequestResponse[]; total: number }> {
    const supabase = await createServerClient();

    // Build base query
    let countQuery = supabase
      .from(TABLES.travelRequests)
      .select('id', { count: 'exact', head: true })
      .eq('client_user_id', userId);

    let dataQuery = supabase
      .from(TABLES.travelRequests)
      .select('*')
      .eq('client_user_id', userId);

    // Apply status filter if provided
    if (opts.status) {
      countQuery = countQuery.eq('status', opts.status);
      dataQuery = dataQuery.eq('status', opts.status);
    }

    // Apply pagination
    const from = (opts.page - 1) * opts.limit;
    const to = opts.page * opts.limit - 1;

    dataQuery = dataQuery
      .order('created_at', { ascending: false })
      .range(from, to);

    // Execute queries in parallel
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (countResult.error) {
      throw new AppError(
        `Failed to count requests: ${countResult.error.message}`,
        500
      );
    }

    if (dataResult.error) {
      throw new AppError(
        `Failed to fetch requests: ${dataResult.error.message}`,
        500
      );
    }

    return {
      data: (dataResult.data ?? []) as RequestResponse[],
      total: countResult.count ?? 0,
    };
  },

  /**
   * Get single travel request by ID with related data
   * @param requestId - travel_requests.id
   * @param userId - auth.users.id (for ownership verification)
   * @returns RequestDetailResponse or null if not found
   */
  async getRequestById(
    requestId: string,
    userId: string
  ): Promise<RequestDetailResponse | null> {
    const supabase = await createServerClient();

    // Fetch the request - scoped by both ID and user ownership
    const { data: request, error: requestError } = await supabase
      .from(TABLES.travelRequests)
      .select('*')
      .eq('id', requestId)
      .eq('client_user_id', userId)
      .single();

    // If not found or error, return null (never leaks existence to wrong user)
    if (requestError || !request) {
      return null;
    }

    // Fetch related data in parallel
    const [statusLogResult, documentsResult] = await Promise.all([
      supabase
        .from(TABLES.portalStatusLog)
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false }),

      supabase
        .from(TABLES.customerDocuments)
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false }),
    ]);

    if (statusLogResult.error) {
      throw new AppError(
        `Failed to fetch status log: ${statusLogResult.error.message}`,
        500
      );
    }

    if (documentsResult.error) {
      throw new AppError(
        `Failed to fetch documents: ${documentsResult.error.message}`,
        500
      );
    }

    return {
      ...(request as RequestResponse),
      status_log: statusLogResult.data ?? [],
      documents: documentsResult.data ?? [],
    };
  },

  /**
   * Create a new travel request
   * @param userId - auth.users.id
   * @param body - CreateRequestBody
   * @returns Created RequestResponse
   */
  async createRequest(
    userId: string,
    body: CreateRequestBody
  ): Promise<RequestResponse> {
    const supabase = await createServerClient();

    // Validate required fields
    if (!body.full_name || !body.request_type || !body.destination) {
      throw new ValidationError(
        'Missing required fields: full_name, request_type, destination'
      );
    }

    // Insert into travel_requests
    const { data, error } = await supabase
      .from(TABLES.travelRequests)
      .insert({
        client_user_id: userId,
        user_id: userId, // compatibility alias (migration 115)
        vertical: body.request_type,
        booking_status: 'pending',
        full_name: body.full_name,
        phone: body.phone,
        request_type: body.request_type,
        destination: body.destination,
        travel_date: body.travel_date,
        return_date: body.return_date,
        num_travelers: body.num_travelers ?? 1,
        notes: body.notes,
        status: 'new', // initial document/review status
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        `Failed to create request: ${error.message}`,
        500
      );
    }

    if (!data) {
      throw new AppError('Failed to create request: No data returned', 500);
    }

    return data as RequestResponse;
  },

  /**
   * Get notifications for a user
   * @param profileId - profiles.id (internal PK)
   * @param unreadOnly - if true, only return unread notifications
   * @returns NotificationResponse[]
   */
  async getNotifications(
    profileId: string,
    unreadOnly: boolean
  ): Promise<NotificationResponse[]> {
    const supabase = await createServerClient();

    let query = supabase
      .from(TABLES.portalNotifications)
      .select('*')
      .eq('customer_id', profileId)
      .order('created_at', { ascending: false });

    // Apply unread filter if requested
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError(
        `Failed to fetch notifications: ${error.message}`,
        500
      );
    }

    return (data ?? []) as NotificationResponse[];
  },

  /**
   * Mark a single notification as read
   * @param notifId - portal_notifications.id
   * @param profileId - profiles.id (for ownership verification)
   * @throws NotFoundError if notification doesn't exist or doesn't belong to user
   */
  async markNotificationRead(
    notifId: string,
    profileId: string
  ): Promise<void> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from(TABLES.portalNotifications)
      .update({ is_read: true })
      .eq('id', notifId)
      .eq('customer_id', profileId) // ownership check
      .select();

    if (error) {
      throw new AppError(
        `Failed to mark notification as read: ${error.message}`,
        500
      );
    }

    // If no rows affected, notification doesn't exist or doesn't belong to user
    if (!data || data.length === 0) {
      throw new NotFoundError('Notification');
    }
  },

  /**
   * Mark all notifications as read for a user
   * @param profileId - profiles.id
   */
  async markAllNotificationsRead(profileId: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from(TABLES.portalNotifications)
      .update({ is_read: true })
      .eq('customer_id', profileId)
      .eq('is_read', false); // only update unread ones

    if (error) {
      throw new AppError(
        `Failed to mark all notifications as read: ${error.message}`,
        500
      );
    }
  },
};
