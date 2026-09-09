/**
 * Portal API Client
 * Temporary wrapper - migrate to direct Supabase calls
 */

import { supabase } from "@/lib/supabase/client";

export const portalApi = {
  async getRequests() {
    const { data, error } = await supabase
      .from('travel_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data: data || [] };
  },

  async getRequestById(id: string) {
    const { data, error } = await supabase
      .from('travel_requests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return { success: true, data };
  },

  async getNotifications() {
    const { data, error } = await supabase
      .from('portal_notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data: data || [] };
  },

  async markNotificationRead(id: string) {
    const { error } = await supabase
      .from('portal_notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },

  async getDocuments() {
    const { data, error } = await supabase
      .from('customer_documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data: data || [] };
  },

  async getDashboard() {
    // Fetch summary data
    const [requests, notifications, documents] = await Promise.all([
      supabase.from('travel_requests').select('*', { count: 'exact', head: true }),
      supabase.from('portal_notifications').select('*').eq('is_read', false),
      supabase.from('customer_documents').select('*', { count: 'exact', head: true }),
    ]);

    return {
      success: true,
      data: {
        requestsCount: requests.count || 0,
        unreadNotifications: notifications.data?.length || 0,
        documentsCount: documents.count || 0,
      }
    };
  },

  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    return { success: true, data };
  },

  async updateProfile(updates: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  },
};
