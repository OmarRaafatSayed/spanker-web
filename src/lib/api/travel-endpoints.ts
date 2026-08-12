import { supabase } from "../supabase";
import type {
  TravelRequest,
  TravelRequestForm,
  DocumentRequirement,
  CustomerDocument,
  DocumentUploadForm,
  ApiResponse,
  CRMStatusUpdate,
} from "@/types";

export const travelRequestsApi = {
  async create(data: TravelRequestForm): Promise<ApiResponse<TravelRequest>> {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) throw new Error("Not authenticated");

      const { data: reqs } = await supabase
        .rpc("get_document_requirements", {
          dest_country: data.destination_country,
          trip_type: data.travel_type,
        })
        .single();

      const mkItems = (arr: unknown) =>
        ((arr as string[]) ?? []).map((type) => ({
          type,
          name: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          status: "pending" as const,
        }));

      const documentChecklist = {
        required: mkItems((reqs as { required_docs?: unknown } | null)?.required_docs),
        optional: mkItems((reqs as { optional_docs?: unknown } | null)?.optional_docs),
      };

      const { data: request, error } = await supabase
        .from("travel_requests")
        .insert([
          {
            client_user_id: authData.user.id,
            destination_country: data.destination_country,
            travel_type: data.travel_type,
            departure_date: data.departure_date ?? null,
            return_date: data.return_date ?? null,
            traveler_count: data.traveler_count,
            customer_notes: data.customer_notes ?? null,
            document_checklist: documentChecklist,
            next_action_required:
              "Upload required documents to complete your application",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: request };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async getMyRequests(): Promise<ApiResponse<TravelRequest[]>> {
    try {
      const { data, error } = await supabase.rpc("get_my_travel_requests");
      if (error) throw error;
      return { success: true, data: (data as TravelRequest[]) ?? [] };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async getById(id: string): Promise<ApiResponse<TravelRequest>> {
    try {
      const { data, error } = await supabase
        .from("travel_requests")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return { success: true, data: data as TravelRequest };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async update(id: string, updates: Partial<TravelRequest>): Promise<ApiResponse<TravelRequest>> {
    try {
      const { data, error } = await supabase
        .from("travel_requests")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: data as TravelRequest };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async cancel(id: string, reason?: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from("travel_requests")
        .update({
          status: "cancelled",
          staff_notes: reason ? `Cancelled: ${reason}` : "Cancelled by customer",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
};

export const documentRequirementsApi = {
  async getRequirements(
    country: string,
    travelType: string
  ): Promise<ApiResponse<DocumentRequirement>> {
    try {
      const { data, error } = await supabase
        .from("document_requirements")
        .select("*")
        .eq("destination_country", country)
        .eq("travel_type", travelType)
        .single();
      if (error) throw error;
      return { success: true, data: data as DocumentRequirement };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async getDestinations(): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from("document_requirements")
        .select("destination_country")
        .order("destination_country");
      if (error) throw error;
      const destinations = [
        ...new Set((data ?? []).map((d: { destination_country: string }) => d.destination_country)),
      ] as string[];
      return { success: true, data: destinations };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
};

export const documentsApi = {
  async upload(
    requestId: string,
    data: DocumentUploadForm
  ): Promise<ApiResponse<CustomerDocument>> {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) throw new Error("Not authenticated");

      const fileExt = data.file.name.split(".").pop();
      const fileName = `${Date.now()}_${data.document_type}.${fileExt}`;
      const filePath = `documents/${authData.user.id}/${requestId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("customer-documents")
        .upload(filePath, data.file);
      if (uploadError) throw uploadError;

      const { data: doc, error } = await supabase
        .from("customer_documents")
        .insert([
          {
            travel_request_id: requestId,
            client_user_id: authData.user.id,
            document_type: data.document_type,
            file_path: filePath,
            file_name: data.file.name,
            file_size: data.file.size,
            mime_type: data.file.type,
            status: "uploaded",
          },
        ])
        .select()
        .single();
      if (error) throw error;

      await supabase.rpc("update_document_completion", { request_id: requestId });
      return { success: true, data: doc as CustomerDocument };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async getForRequest(requestId: string): Promise<ApiResponse<CustomerDocument[]>> {
    try {
      const { data, error } = await supabase
        .from("customer_documents")
        .select("*")
        .eq("travel_request_id", requestId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { success: true, data: (data as CustomerDocument[]) ?? [] };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async delete(documentId: string): Promise<ApiResponse<void>> {
    try {
      const { data: doc, error: fetchError } = await supabase
        .from("customer_documents")
        .select("file_path, travel_request_id")
        .eq("id", documentId)
        .single();
      if (fetchError) throw fetchError;

      if ((doc as { file_path?: string }).file_path) {
        await supabase.storage
          .from("customer-documents")
          .remove([(doc as { file_path: string }).file_path]);
      }

      const { error } = await supabase
        .from("customer_documents")
        .delete()
        .eq("id", documentId);
      if (error) throw error;

      const rid = (doc as { travel_request_id?: string }).travel_request_id;
      if (rid) {
        await supabase.rpc("update_document_completion", { request_id: rid });
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },

  async getDownloadUrl(filePath: string): Promise<ApiResponse<string>> {
    try {
      const { data, error } = await supabase.storage
        .from("customer-documents")
        .createSignedUrl(filePath, 3600);
      if (error) throw error;
      return { success: true, data: data.signedUrl };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
};

export const realtimeApi = {
  subscribeToTravelRequest(
    requestId: string,
    callback: (request: TravelRequest) => void
  ) {
    return supabase
      .channel(`travel_request_${requestId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "travel_requests", filter: `id=eq.${requestId}` },
        (payload) => callback(payload.new as TravelRequest)
      )
      .subscribe();
  },

  subscribeToDocuments(
    requestId: string,
    callback: (documents: CustomerDocument[]) => void
  ) {
    return supabase
      .channel(`documents_${requestId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customer_documents", filter: `travel_request_id=eq.${requestId}` },
        async () => {
          const { data } = await documentsApi.getForRequest(requestId);
          if (data) callback(data);
        }
      )
      .subscribe();
  },
};

export const crmApi = {
  async processStatusUpdate(update: CRMStatusUpdate): Promise<ApiResponse<void>> {
    try {
      const { data: req, error: fetchError } = await supabase
        .from("travel_requests")
        .select("client_user_id")
        .eq("id", update.tracking_id)
        .single();
      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from("travel_requests")
        .update({
          status: update.status,
          staff_notes: update.message,
          assigned_staff_id: update.staff_id ?? null,
          updated_at: update.timestamp,
        })
        .eq("id", update.tracking_id);
      if (updateError) throw updateError;

      if (update.document_updates) {
        for (const du of update.document_updates) {
          await supabase
            .from("customer_documents")
            .update({ status: du.status, updated_at: update.timestamp })
            .eq("travel_request_id", update.tracking_id)
            .eq("document_type", du.type);
        }
        await supabase.rpc("update_document_completion", {
          request_id: update.tracking_id,
        });
      }

      await supabase.from("customer_communications").insert([
        {
          travel_request_id: update.tracking_id,
          client_user_id: (req as { client_user_id: string }).client_user_id,
          staff_user_id: update.staff_id ?? null,
          communication_type: "system_notification",
          message: update.message,
          sent_at: update.timestamp,
        },
      ]);

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
};
