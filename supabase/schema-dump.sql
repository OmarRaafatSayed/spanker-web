


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."create_organization_with_admin"("org_name" "text", "org_description" "text", "org_slug" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_org_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Must be logged in to create an organization';
    END IF;

    INSERT INTO public.organizations (name, description, slug)
    VALUES (org_name, org_description, public.generate_unique_slug(org_slug))
    RETURNING id INTO new_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (new_org_id, v_user_id, 'admin', 'active');

    UPDATE public.profiles
    SET organization_id = new_org_id
    WHERE user_id = v_user_id;

    RETURN new_org_id;
END;
$$;


ALTER FUNCTION "public"."create_organization_with_admin"("org_name" "text", "org_description" "text", "org_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_portal_notification"("p_customer_id" "uuid", "p_title" "text", "p_body" "text" DEFAULT NULL::"text", "p_type" "text" DEFAULT 'info'::"text", "p_data" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.portal_notifications
    (customer_id, title, body, type, data)
  VALUES
    (p_customer_id, p_title, p_body, p_type, p_data)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."create_portal_notification"("p_customer_id" "uuid", "p_title" "text", "p_body" "text", "p_type" "text", "p_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_unique_slug"("base_slug" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_slug TEXT := base_slug;
  counter INTEGER := 1;
BEGIN
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = new_slug) LOOP
    new_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  RETURN new_slug;
END;
$$;


ALTER FUNCTION "public"."generate_unique_slug"("base_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_document_requirements"("dest_country" "text", "trip_type" "text") RETURNS TABLE("required_docs" "jsonb", "optional_docs" "jsonb", "instructions" "text", "processing_days" integer)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT 
    required_documents,
    optional_documents,
    special_instructions,
    processing_time_days
  FROM public.document_requirements
  WHERE destination_country = dest_country AND travel_type = trip_type
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_document_requirements"("dest_country" "text", "trip_type" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."payment_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_name" "text" NOT NULL,
    "booking_reference" "text",
    "amount" numeric(12,2) NOT NULL,
    "payment_method" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payment_date" "date",
    "notes" "text",
    "organization_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_user_id" "uuid",
    CONSTRAINT "payment_records_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "payment_records_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'bank'::"text", 'pos'::"text", 'cheque'::"text"]))),
    CONSTRAINT "payment_records_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'partial'::"text", 'full'::"text", 'refunded'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."payment_records" OWNER TO "postgres";


COMMENT ON COLUMN "public"."payment_records"."client_user_id" IS 'The portal customer who owns this payment record. NULL = manual staff entry.';



CREATE OR REPLACE FUNCTION "public"."get_my_payments"() RETURNS SETOF "public"."payment_records"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT * FROM public.payment_records
  WHERE client_user_id = auth.uid()
  ORDER BY created_at DESC;
$$;


ALTER FUNCTION "public"."get_my_payments"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."travel_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_user_id" "uuid",
    "destination_country" "text" NOT NULL,
    "travel_type" "text" NOT NULL,
    "departure_date" "date",
    "return_date" "date",
    "traveler_count" integer DEFAULT 1,
    "status" "text" DEFAULT 'pending_documents'::"text" NOT NULL,
    "document_checklist" "jsonb" DEFAULT '{}'::"jsonb",
    "documents_completion_percent" integer DEFAULT 0,
    "customer_notes" "text",
    "staff_notes" "text",
    "next_action_required" "text",
    "next_follow_up_date" "date",
    "linked_visa_application_id" "uuid",
    "linked_payment_id" "uuid",
    "assigned_staff_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "travel_requests_status_check" CHECK (("status" = ANY (ARRAY['pending_documents'::"text", 'documents_review'::"text", 'docs_approved'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "travel_requests_travel_type_check" CHECK (("travel_type" = ANY (ARRAY['visa_only'::"text", 'visa_flight'::"text", 'visa_hotel'::"text", 'full_package'::"text"])))
);


ALTER TABLE "public"."travel_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."travel_requests" IS 'Preliminary travel booking requests - customers can submit immediately without complete docs';



CREATE OR REPLACE FUNCTION "public"."get_my_travel_requests"() RETURNS SETOF "public"."travel_requests"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT * FROM public.travel_requests
  WHERE client_user_id = auth.uid()
  ORDER BY created_at DESC;
$$;


ALTER FUNCTION "public"."get_my_travel_requests"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visa_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_name" "text" NOT NULL,
    "passport_number" "text" NOT NULL,
    "destination_country" "text" NOT NULL,
    "status" integer DEFAULT 1 NOT NULL,
    "appointment_date" "date",
    "appointment_notes" "text",
    "email" "text",
    "phone" "text",
    "visa_type" "text",
    "application_notes" "text",
    "organization_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_user_id" "uuid",
    CONSTRAINT "visa_applications_status_check" CHECK ((("status" >= 1) AND ("status" <= 7)))
);


ALTER TABLE "public"."visa_applications" OWNER TO "postgres";


COMMENT ON COLUMN "public"."visa_applications"."client_user_id" IS 'The portal customer who owns this application. NULL = manual staff entry.';



CREATE OR REPLACE FUNCTION "public"."get_my_visa_applications"() RETURNS SETOF "public"."visa_applications"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT * FROM public.visa_applications
  WHERE client_user_id = auth.uid()
  ORDER BY created_at DESC;
$$;


ALTER FUNCTION "public"."get_my_visa_applications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_syncs"() RETURNS TABLE("queue_id" "uuid", "entity_type" "text", "entity_id" "text", "direction" "text", "payload" "jsonb", "retry_count" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    sq.id,
    sq.entity_type,
    sq.entity_id,
    sq.direction,
    sq.payload,
    sq.retry_count
  FROM sync_queue sq
  WHERE sq.status = 'pending'
    AND (sq.next_retry_at IS NULL OR sq.next_retry_at <= NOW())
  ORDER BY sq.created_at ASC
  LIMIT 100;
END;
$$;


ALTER FUNCTION "public"."get_pending_syncs"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_pending_syncs"() IS 'Fetch pending sync items for background processor';



CREATE OR REPLACE FUNCTION "public"."get_unread_notification_count"("p_customer_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.portal_notifications
  WHERE customer_id = p_customer_id
    AND is_read = FALSE;
$$;


ALTER FUNCTION "public"."get_unread_notification_count"("p_customer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    first_name,
    last_name,
    full_name,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      TRIM(
        COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' ||
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      )
    ),
    'user'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_customer_on_document_review"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_title TEXT;
  v_body  TEXT;
  v_type  TEXT;
BEGIN
  -- Only fire when status changes to approved or rejected
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    v_type  := 'document_approved';
    v_title := 'تمت الموافقة على المستند';
    v_body  := 'تمت مراجعة "' || NEW.file_name || '" والموافقة عليه.';
  ELSIF NEW.status = 'rejected' THEN
    v_type  := 'document_rejected';
    v_title := 'تم رفض المستند';
    v_body  := 'تم رفض "' || NEW.file_name || '".' ||
               CASE WHEN NEW.staff_notes IS NOT NULL
                    THEN ' السبب: ' || NEW.staff_notes
                    ELSE ''
               END;
  ELSE
    -- under_review / expired — no notification needed
    RETURN NEW;
  END IF;

  PERFORM public.create_portal_notification(
    p_customer_id := NEW.customer_id,
    p_title       := v_title,
    p_body        := v_body,
    p_type        := v_type,
    p_data        := jsonb_build_object(
      'document_id',        NEW.id,
      'request_id',         NEW.request_id,
      'travel_request_id',  NEW.request_id,   -- alias for compatibility
      'file_name',          NEW.file_name,
      'new_status',         NEW.status,
      'staff_notes',        NEW.staff_notes
    )
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_customer_on_document_review"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_customer_on_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_title TEXT;
  v_body  TEXT;
  v_type  TEXT := 'status_update';
BEGIN
  -- Only fire on status change
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Build human-readable message
  v_title := 'تحديث حالة طلبك';
  v_body  := 'تم تحديث حالة طلبك من "' || COALESCE(OLD.status, 'جديد') ||
             '" إلى "' || NEW.status || '"';

  -- Insert notification
  PERFORM public.create_portal_notification(
    p_customer_id := NEW.customer_id,
    p_title       := v_title,
    p_body        := v_body,
    p_type        := v_type,
    p_data        := jsonb_build_object(
      'request_id',  NEW.id,
      'old_status',  OLD.status,
      'new_status',  NEW.status,
      'destination', NEW.destination
    )
  );

  -- Also insert into portal_status_log (audit trail)
  INSERT INTO public.portal_status_log
    (request_id, customer_id, from_status, to_status)
  VALUES
    (NEW.id, NEW.customer_id, OLD.status, NEW.status);

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_customer_on_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."queue_document_for_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Insert a new sync_queue entry for the document
  INSERT INTO sync_queue (
    entity_type,
    entity_id,
    direction,
    payload,
    status
  ) VALUES (
    'document',
    NEW.id::TEXT,
    'portal_to_crm',
    jsonb_build_object(
      'travel_request_id', NEW.travel_request_id,
      'client_user_id', NEW.client_user_id,
      'document_type', NEW.document_type,
      'file_name', NEW.file_name,
      'status', NEW.status
    ),
    'pending'
  );

  RAISE LOG 'Document % queued for CRM sync', NEW.id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."queue_document_for_sync"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."queue_document_for_sync"() IS 'Automatically queue new documents for CRM sync';



CREATE OR REPLACE FUNCTION "public"."queue_profile_for_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  BEGIN
    INSERT INTO public.sync_queue (
      entity_type, entity_id, direction, payload, status
    ) VALUES (
      'profile',
      NEW.id::TEXT,
      'portal_to_crm',
      jsonb_build_object(
        'full_name',  NEW.full_name,
        'phone',      NEW.phone,
        'user_id',    NEW.user_id,
        'role',       NEW.role
      ),
      'pending'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Don't fail signup if sync_queue insert fails
    RAISE LOG 'sync_queue insert failed for profile %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."queue_profile_for_sync"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."queue_profile_for_sync"() IS 'Automatically queue new profiles for CRM sync';



CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_portal_status_log_request_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If travel_request_id provided but not request_id → sync
  IF NEW.travel_request_id IS NOT NULL AND NEW.request_id IS NULL THEN
    NEW.request_id = NEW.travel_request_id;
  END IF;
  -- If request_id provided but not travel_request_id → sync
  IF NEW.request_id IS NOT NULL AND NEW.travel_request_id IS NULL THEN
    NEW.travel_request_id = NEW.request_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_portal_status_log_request_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_travel_request_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If request_id was set/changed, mirror to travel_request_id
  IF NEW.request_id IS DISTINCT FROM OLD.request_id THEN
    NEW.travel_request_id := NEW.request_id;
  END IF;

  -- If travel_request_id was set/changed, mirror to request_id
  IF NEW.travel_request_id IS DISTINCT FROM OLD.travel_request_id THEN
    NEW.request_id := NEW.travel_request_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_travel_request_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_document_completion"("request_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_required INTEGER;
  uploaded_approved INTEGER;
  completion_percent INTEGER;
BEGIN
  -- Get required document count from checklist
  SELECT jsonb_array_length(document_checklist->'required')
  INTO total_required
  FROM travel_requests
  WHERE id = request_id;
  
  -- Count uploaded + approved documents
  SELECT COUNT(*)::INTEGER
  INTO uploaded_approved
  FROM customer_documents cd
  WHERE cd.travel_request_id = request_id
    AND cd.status IN ('approved', 'uploaded');
  
  -- Calculate percentage
  completion_percent := CASE 
    WHEN total_required = 0 THEN 100
    ELSE (uploaded_approved * 100 / total_required)
  END;
  
  -- Update the travel request
  UPDATE travel_requests
  SET 
    documents_completion_percent = completion_percent,
    updated_at = now()
  WHERE id = request_id;
  
  RETURN completion_percent;
END;
$$;


ALTER FUNCTION "public"."update_document_completion"("request_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_communications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "travel_request_id" "uuid" NOT NULL,
    "client_user_id" "uuid" NOT NULL,
    "staff_user_id" "uuid",
    "communication_type" "text" NOT NULL,
    "subject" "text",
    "message" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "whatsapp_message_id" "text",
    "email_message_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "customer_communications_communication_type_check" CHECK (("communication_type" = ANY (ARRAY['email'::"text", 'whatsapp'::"text", 'sms'::"text", 'phone_call'::"text", 'system_notification'::"text"])))
);


ALTER TABLE "public"."customer_communications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "travel_request_id" "uuid" NOT NULL,
    "client_user_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "file_path" "text",
    "file_name" "text",
    "file_size" integer,
    "mime_type" "text",
    "status" "text" DEFAULT 'uploaded'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "customer_documents_status_check" CHECK (("status" = ANY (ARRAY['uploaded'::"text", 'under_review'::"text", 'approved'::"text", 'rejected'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."customer_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "request_type" "text" DEFAULT 'visa'::"text" NOT NULL,
    "destination" "text" NOT NULL,
    "travel_date" "date",
    "return_date" "date",
    "num_travelers" integer DEFAULT 1 NOT NULL,
    "notes" "text",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "assigned_to" "uuid",
    "visa_application_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "customer_requests_num_travelers_check" CHECK (("num_travelers" >= 1)),
    CONSTRAINT "customer_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['visa'::"text", 'flight'::"text", 'hotel'::"text", 'package'::"text"]))),
    CONSTRAINT "customer_requests_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'in_review'::"text", 'quoted'::"text", 'booked'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."customer_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_requirements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "destination_country" "text" NOT NULL,
    "travel_type" "text" NOT NULL,
    "required_documents" "jsonb" NOT NULL,
    "optional_documents" "jsonb" DEFAULT '[]'::"jsonb",
    "special_instructions" "text",
    "processing_time_days" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_requirements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flight_search_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cache_key" "text" NOT NULL,
    "origin" "text" NOT NULL,
    "destination" "text" NOT NULL,
    "departure_date" "date" NOT NULL,
    "return_date" "date",
    "response_data" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."flight_search_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hotel_offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hotel_name" "text" NOT NULL,
    "hotel_location" "text" NOT NULL,
    "hotel_city" "text" NOT NULL,
    "hotel_country" "text" NOT NULL,
    "hotel_rating" numeric(3,1),
    "hotel_category" "text",
    "room_type" "text" NOT NULL,
    "board_basis" "text",
    "price_per_night" numeric(12,2) NOT NULL,
    "price_currency" "text" DEFAULT 'EGP'::"text" NOT NULL,
    "special_offer_price" numeric(12,2),
    "available_from" "date" NOT NULL,
    "available_to" "date" NOT NULL,
    "booking_deadline" "date",
    "max_occupancy" integer,
    "available_rooms" integer,
    "description" "text",
    "terms_conditions" "text",
    "cancellation_policy" "text",
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "amenities" "jsonb" DEFAULT '[]'::"jsonb",
    "uploaded_file_reference" "text"
);


ALTER TABLE "public"."hotel_offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portal_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "request_id" "uuid",
    "doc_type" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" integer,
    "mime_type" "text",
    "status" "text" DEFAULT 'uploaded'::"text" NOT NULL,
    "staff_notes" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "travel_request_id" "uuid",
    CONSTRAINT "portal_documents_doc_type_check" CHECK (("doc_type" = ANY (ARRAY['PASSPORT'::"text", 'NATIONAL_ID'::"text", 'PHOTO'::"text", 'BANK_STATEMENT'::"text", 'SALARY_SLIP'::"text", 'HOTEL_BOOKING'::"text", 'FLIGHT_BOOKING'::"text", 'TRAVEL_INSURANCE'::"text", 'OTHER'::"text"]))),
    CONSTRAINT "portal_documents_status_check" CHECK (("status" = ANY (ARRAY['uploaded'::"text", 'under_review'::"text", 'approved'::"text", 'rejected'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."portal_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portal_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "type" "text" DEFAULT 'info'::"text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "travel_request_id" "uuid",
    CONSTRAINT "portal_notifications_type_check" CHECK (("type" = ANY (ARRAY['status_update'::"text", 'document_approved'::"text", 'document_rejected'::"text", 'payment_due'::"text", 'payment_confirmed'::"text", 'message'::"text", 'info'::"text"])))
);


ALTER TABLE "public"."portal_notifications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."portal_customer_summary" AS
 SELECT "id" AS "request_id",
    "customer_id",
    "full_name",
    "request_type",
    "destination",
    "travel_date",
    "status" AS "request_status",
    "created_at" AS "request_created_at",
    ( SELECT "count"(*) AS "count"
           FROM "public"."portal_documents" "pd"
          WHERE ("pd"."request_id" = "cr"."id")) AS "total_documents",
    ( SELECT "count"(*) AS "count"
           FROM "public"."portal_documents" "pd"
          WHERE (("pd"."request_id" = "cr"."id") AND ("pd"."status" = 'approved'::"text"))) AS "approved_documents",
    ( SELECT "count"(*) AS "count"
           FROM "public"."portal_documents" "pd"
          WHERE (("pd"."request_id" = "cr"."id") AND ("pd"."status" = 'rejected'::"text"))) AS "rejected_documents",
    ( SELECT "count"(*) AS "count"
           FROM "public"."portal_notifications" "pn"
          WHERE (("pn"."customer_id" = "cr"."customer_id") AND ("pn"."is_read" = false) AND (("pn"."data" ->> 'request_id'::"text") = ("cr"."id")::"text"))) AS "unread_notifications"
   FROM "public"."customer_requests" "cr";


ALTER VIEW "public"."portal_customer_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portal_status_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "from_status" "text",
    "to_status" "text" NOT NULL,
    "changed_by" "uuid",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "travel_request_id" "uuid",
    "changed_by_label" "text"
);


ALTER TABLE "public"."portal_status_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid",
    "sync_status" "text" DEFAULT 'pending'::"text",
    "last_sync_at" timestamp with time zone,
    "sync_error" "text",
    "full_name" "text",
    "phone" "text",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['customer'::"text", 'user'::"text", 'staff'::"text", 'admin'::"text", 'super_admin'::"text"]))),
    CONSTRAINT "profiles_sync_status_check" CHECK (("sync_status" = ANY (ARRAY['pending'::"text", 'synced'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sync_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "direction" "text" DEFAULT 'portal_to_crm'::"text" NOT NULL,
    "payload" "jsonb",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "retry_count" integer DEFAULT 0,
    "next_retry_at" timestamp with time zone,
    "error_message" "text",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sync_queue_direction_check" CHECK (("direction" = ANY (ARRAY['portal_to_crm'::"text", 'crm_to_portal'::"text"]))),
    CONSTRAINT "sync_queue_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['profile'::"text", 'travel_request'::"text", 'visa_application'::"text", 'payment'::"text", 'document'::"text"]))),
    CONSTRAINT "sync_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."sync_queue" OWNER TO "postgres";


COMMENT ON TABLE "public"."sync_queue" IS 'Queue for syncing entities between Portal and CRM. Auto-populated by triggers on profile and document insertions.';



CREATE TABLE IF NOT EXISTS "public"."system_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "level" "text" NOT NULL,
    "event" "text" NOT NULL,
    "details" "text",
    "source" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "system_logs_level_check" CHECK (("level" = ANY (ARRAY['info'::"text", 'success'::"text", 'warning'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."system_logs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."travel_request_portal_summary" AS
 SELECT "id" AS "request_id",
    "client_user_id" AS "customer_id",
    "destination_country",
    "travel_type",
    "status",
    "departure_date",
    "traveler_count",
    "staff_notes",
    "next_action_required",
    "created_at",
    "updated_at",
    ( SELECT "count"(*) AS "count"
           FROM "public"."portal_notifications" "pn"
          WHERE (("pn"."travel_request_id" = "tr"."id") AND ("pn"."customer_id" = "tr"."client_user_id") AND ("pn"."is_read" = false))) AS "unread_notifications",
    ( SELECT "psl"."note"
           FROM "public"."portal_status_log" "psl"
          WHERE ("psl"."travel_request_id" = "tr"."id")
          ORDER BY "psl"."created_at" DESC
         LIMIT 1) AS "latest_note"
   FROM "public"."travel_requests" "tr";


ALTER VIEW "public"."travel_request_portal_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_processing_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "webhook_processing_log_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."webhook_processing_log" OWNER TO "postgres";


ALTER TABLE ONLY "public"."customer_communications"
    ADD CONSTRAINT "customer_communications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_documents"
    ADD CONSTRAINT "customer_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_requests"
    ADD CONSTRAINT "customer_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_requirements"
    ADD CONSTRAINT "document_requirements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flight_search_cache"
    ADD CONSTRAINT "flight_search_cache_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."flight_search_cache"
    ADD CONSTRAINT "flight_search_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hotel_offers"
    ADD CONSTRAINT "hotel_offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."payment_records"
    ADD CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portal_documents"
    ADD CONSTRAINT "portal_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portal_notifications"
    ADD CONSTRAINT "portal_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portal_status_log"
    ADD CONSTRAINT "portal_status_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."sync_queue"
    ADD CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_logs"
    ADD CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."travel_requests"
    ADD CONSTRAINT "travel_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visa_applications"
    ADD CONSTRAINT "visa_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_processing_log"
    ADD CONSTRAINT "webhook_processing_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_processing_log"
    ADD CONSTRAINT "webhook_processing_log_request_id_key" UNIQUE ("request_id");



CREATE INDEX "idx_communications_client" ON "public"."customer_communications" USING "btree" ("client_user_id");



CREATE INDEX "idx_communications_request" ON "public"."customer_communications" USING "btree" ("travel_request_id");



CREATE INDEX "idx_creq_assigned_to" ON "public"."customer_requests" USING "btree" ("assigned_to");



CREATE INDEX "idx_creq_created_at" ON "public"."customer_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_creq_customer_id" ON "public"."customer_requests" USING "btree" ("customer_id");



CREATE INDEX "idx_creq_status" ON "public"."customer_requests" USING "btree" ("status");



CREATE INDEX "idx_customer_docs_client" ON "public"."customer_documents" USING "btree" ("client_user_id");



CREATE INDEX "idx_customer_docs_request" ON "public"."customer_documents" USING "btree" ("travel_request_id");



CREATE INDEX "idx_customer_docs_status" ON "public"."customer_documents" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_doc_requirements_unique" ON "public"."document_requirements" USING "btree" ("destination_country", "travel_type");



CREATE INDEX "idx_flight_cache_expires" ON "public"."flight_search_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_flight_cache_key" ON "public"."flight_search_cache" USING "btree" ("cache_key");



CREATE INDEX "idx_payment_client_user" ON "public"."payment_records" USING "btree" ("client_user_id");



CREATE INDEX "idx_payment_created_by" ON "public"."payment_records" USING "btree" ("created_by");



CREATE INDEX "idx_payment_status" ON "public"."payment_records" USING "btree" ("status");



CREATE INDEX "idx_pdoc_customer_id" ON "public"."portal_documents" USING "btree" ("customer_id");



CREATE INDEX "idx_pdoc_request_id" ON "public"."portal_documents" USING "btree" ("request_id");



CREATE INDEX "idx_pdoc_status" ON "public"."portal_documents" USING "btree" ("status");



CREATE INDEX "idx_pdoc_travel_request_id" ON "public"."portal_documents" USING "btree" ("travel_request_id");



CREATE INDEX "idx_plog_created_at" ON "public"."portal_status_log" USING "btree" ("created_at");



CREATE INDEX "idx_plog_customer_id" ON "public"."portal_status_log" USING "btree" ("customer_id");



CREATE INDEX "idx_plog_request_id" ON "public"."portal_status_log" USING "btree" ("request_id");



CREATE INDEX "idx_plog_travel_request" ON "public"."portal_status_log" USING "btree" ("travel_request_id");



CREATE INDEX "idx_pnotif_created_at" ON "public"."portal_notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_pnotif_customer_id" ON "public"."portal_notifications" USING "btree" ("customer_id");



CREATE INDEX "idx_pnotif_is_read" ON "public"."portal_notifications" USING "btree" ("customer_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_pnotif_travel_request" ON "public"."portal_notifications" USING "btree" ("travel_request_id");



CREATE INDEX "idx_pnotif_type" ON "public"."portal_notifications" USING "btree" ("type");



CREATE INDEX "idx_pnotif_unread" ON "public"."portal_notifications" USING "btree" ("customer_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_profiles_sync_status" ON "public"."profiles" USING "btree" ("sync_status");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "idx_sync_queue_entity" ON "public"."sync_queue" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_sync_queue_next_retry" ON "public"."sync_queue" USING "btree" ("next_retry_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_sync_queue_status" ON "public"."sync_queue" USING "btree" ("status");



CREATE INDEX "idx_system_logs_created_at" ON "public"."system_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_system_logs_event" ON "public"."system_logs" USING "btree" ("event");



CREATE INDEX "idx_travel_requests_assigned_staff" ON "public"."travel_requests" USING "btree" ("assigned_staff_id");



CREATE INDEX "idx_travel_requests_client" ON "public"."travel_requests" USING "btree" ("client_user_id");



CREATE INDEX "idx_travel_requests_status" ON "public"."travel_requests" USING "btree" ("status");



CREATE INDEX "idx_visa_client_user" ON "public"."visa_applications" USING "btree" ("client_user_id");



CREATE INDEX "idx_visa_created_by" ON "public"."visa_applications" USING "btree" ("created_by");



CREATE INDEX "idx_visa_status" ON "public"."visa_applications" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "document_sync_trigger" AFTER INSERT ON "public"."customer_documents" FOR EACH ROW EXECUTE FUNCTION "public"."queue_document_for_sync"();



CREATE OR REPLACE TRIGGER "profile_sync_trigger" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."queue_profile_for_sync"();



CREATE OR REPLACE TRIGGER "trg_creq_updated_at" BEFORE UPDATE ON "public"."customer_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_hotel_updated_at" BEFORE UPDATE ON "public"."hotel_offers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_notify_document_review" AFTER UPDATE ON "public"."portal_documents" FOR EACH ROW EXECUTE FUNCTION "public"."notify_customer_on_document_review"();



CREATE OR REPLACE TRIGGER "trg_notify_status_change" AFTER UPDATE ON "public"."customer_requests" FOR EACH ROW EXECUTE FUNCTION "public"."notify_customer_on_status_change"();



CREATE OR REPLACE TRIGGER "trg_payment_updated_at" BEFORE UPDATE ON "public"."payment_records" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_pdoc_updated_at" BEFORE UPDATE ON "public"."portal_documents" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sync_portal_status_log" BEFORE INSERT OR UPDATE ON "public"."portal_status_log" FOR EACH ROW EXECUTE FUNCTION "public"."sync_portal_status_log_request_id"();



CREATE OR REPLACE TRIGGER "trg_sync_travel_request_id" BEFORE INSERT OR UPDATE ON "public"."portal_documents" FOR EACH ROW EXECUTE FUNCTION "public"."sync_travel_request_id"();



CREATE OR REPLACE TRIGGER "trg_visa_updated_at" BEFORE UPDATE ON "public"."visa_applications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."customer_communications"
    ADD CONSTRAINT "customer_communications_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_communications"
    ADD CONSTRAINT "customer_communications_staff_user_id_fkey" FOREIGN KEY ("staff_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."customer_communications"
    ADD CONSTRAINT "customer_communications_travel_request_id_fkey" FOREIGN KEY ("travel_request_id") REFERENCES "public"."travel_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_documents"
    ADD CONSTRAINT "customer_documents_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_documents"
    ADD CONSTRAINT "customer_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."customer_documents"
    ADD CONSTRAINT "customer_documents_travel_request_id_fkey" FOREIGN KEY ("travel_request_id") REFERENCES "public"."travel_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_requests"
    ADD CONSTRAINT "customer_requests_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customer_requests"
    ADD CONSTRAINT "customer_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hotel_offers"
    ADD CONSTRAINT "hotel_offers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payment_records"
    ADD CONSTRAINT "payment_records_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_records"
    ADD CONSTRAINT "payment_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."portal_documents"
    ADD CONSTRAINT "portal_documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."portal_documents"
    ADD CONSTRAINT "portal_documents_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."customer_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."portal_documents"
    ADD CONSTRAINT "portal_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."portal_documents"
    ADD CONSTRAINT "portal_documents_travel_request_id_fkey" FOREIGN KEY ("travel_request_id") REFERENCES "public"."customer_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."portal_notifications"
    ADD CONSTRAINT "portal_notifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."portal_notifications"
    ADD CONSTRAINT "portal_notifications_travel_request_id_fkey" FOREIGN KEY ("travel_request_id") REFERENCES "public"."travel_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."portal_status_log"
    ADD CONSTRAINT "portal_status_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."portal_status_log"
    ADD CONSTRAINT "portal_status_log_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."portal_status_log"
    ADD CONSTRAINT "portal_status_log_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."customer_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."portal_status_log"
    ADD CONSTRAINT "portal_status_log_travel_request_id_fkey" FOREIGN KEY ("travel_request_id") REFERENCES "public"."travel_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."travel_requests"
    ADD CONSTRAINT "travel_requests_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."travel_requests"
    ADD CONSTRAINT "travel_requests_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."travel_requests"
    ADD CONSTRAINT "travel_requests_linked_payment_id_fkey" FOREIGN KEY ("linked_payment_id") REFERENCES "public"."payment_records"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."travel_requests"
    ADD CONSTRAINT "travel_requests_linked_visa_application_id_fkey" FOREIGN KEY ("linked_visa_application_id") REFERENCES "public"."visa_applications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."visa_applications"
    ADD CONSTRAINT "visa_applications_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."visa_applications"
    ADD CONSTRAINT "visa_applications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



CREATE POLICY "Users can create organizations" ON "public"."organizations" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view organizations they created" ON "public"."organizations" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "cache_service_all" ON "public"."flight_search_cache" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "creq_customer_insert" ON "public"."customer_requests" FOR INSERT TO "authenticated" WITH CHECK (("customer_id" = "auth"."uid"()));



CREATE POLICY "creq_customer_select" ON "public"."customer_requests" FOR SELECT TO "authenticated" USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "creq_customer_update" ON "public"."customer_requests" FOR UPDATE TO "authenticated" USING ((("customer_id" = "auth"."uid"()) AND ("status" = 'new'::"text")));



CREATE POLICY "creq_service_all" ON "public"."customer_requests" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."customer_communications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customers_create_own_requests" ON "public"."travel_requests" FOR INSERT TO "authenticated" WITH CHECK (("client_user_id" = "auth"."uid"()));



CREATE POLICY "customers_manage_own_documents" ON "public"."customer_documents" TO "authenticated" USING ((("client_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."travel_requests" "tr"
  WHERE (("tr"."id" = "customer_documents"."travel_request_id") AND ("tr"."assigned_staff_id" = "auth"."uid"()))))));



CREATE POLICY "customers_read_own_communications" ON "public"."customer_communications" FOR SELECT TO "authenticated" USING ((("client_user_id" = "auth"."uid"()) OR ("staff_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."travel_requests" "tr"
  WHERE (("tr"."id" = "customer_communications"."travel_request_id") AND ("tr"."assigned_staff_id" = "auth"."uid"()))))));



CREATE POLICY "customers_read_own_payments" ON "public"."payment_records" FOR SELECT TO "authenticated" USING (("client_user_id" = "auth"."uid"()));



CREATE POLICY "customers_read_own_requests" ON "public"."travel_requests" FOR SELECT TO "authenticated" USING ((("client_user_id" = "auth"."uid"()) OR ("assigned_staff_id" = "auth"."uid"())));



CREATE POLICY "customers_read_own_visa" ON "public"."visa_applications" FOR SELECT TO "authenticated" USING (("client_user_id" = "auth"."uid"()));



CREATE POLICY "customers_update_own_requests" ON "public"."travel_requests" FOR UPDATE TO "authenticated" USING ((("client_user_id" = "auth"."uid"()) OR ("assigned_staff_id" = "auth"."uid"())));



ALTER TABLE "public"."document_requirements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flight_search_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hotel_auth_select" ON "public"."hotel_offers" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."hotel_offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hotel_offers_auth_select" ON "public"."hotel_offers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "hotel_offers_service_all" ON "public"."hotel_offers" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "hotel_service_all" ON "public"."hotel_offers" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_service_all" ON "public"."payment_records" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "pdoc_customer_delete" ON "public"."portal_documents" FOR DELETE TO "authenticated" USING ((("customer_id" = "auth"."uid"()) AND ("status" = 'uploaded'::"text")));



CREATE POLICY "pdoc_customer_insert" ON "public"."portal_documents" FOR INSERT TO "authenticated" WITH CHECK (("customer_id" = "auth"."uid"()));



CREATE POLICY "pdoc_customer_select" ON "public"."portal_documents" FOR SELECT TO "authenticated" USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "pdoc_service_all" ON "public"."portal_documents" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "plog_customer_select" ON "public"."portal_status_log" FOR SELECT TO "authenticated" USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "plog_service_all" ON "public"."portal_status_log" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "plog_staff_select" ON "public"."portal_status_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "pnotif_customer_select" ON "public"."portal_notifications" FOR SELECT TO "authenticated" USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "pnotif_customer_update" ON "public"."portal_notifications" FOR UPDATE TO "authenticated" USING (("customer_id" = "auth"."uid"()));



CREATE POLICY "pnotif_service_all" ON "public"."portal_notifications" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "pnotif_staff_select" ON "public"."portal_notifications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'staff'::"text"]))))));



ALTER TABLE "public"."portal_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portal_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portal_status_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_all" ON "public"."profiles" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."sync_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."travel_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."visa_applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "visa_service_all" ON "public"."visa_applications" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."webhook_processing_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wpl_service_all" ON "public"."webhook_processing_log" TO "service_role" USING (true) WITH CHECK (true);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_organization_with_admin"("org_name" "text", "org_description" "text", "org_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_organization_with_admin"("org_name" "text", "org_description" "text", "org_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_organization_with_admin"("org_name" "text", "org_description" "text", "org_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_portal_notification"("p_customer_id" "uuid", "p_title" "text", "p_body" "text", "p_type" "text", "p_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_portal_notification"("p_customer_id" "uuid", "p_title" "text", "p_body" "text", "p_type" "text", "p_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_portal_notification"("p_customer_id" "uuid", "p_title" "text", "p_body" "text", "p_type" "text", "p_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_unique_slug"("base_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_unique_slug"("base_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_unique_slug"("base_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_document_requirements"("dest_country" "text", "trip_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_document_requirements"("dest_country" "text", "trip_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_document_requirements"("dest_country" "text", "trip_type" "text") TO "service_role";



GRANT ALL ON TABLE "public"."payment_records" TO "anon";
GRANT ALL ON TABLE "public"."payment_records" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_records" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_payments"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_payments"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_payments"() TO "service_role";



GRANT ALL ON TABLE "public"."travel_requests" TO "anon";
GRANT ALL ON TABLE "public"."travel_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."travel_requests" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_travel_requests"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_travel_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_travel_requests"() TO "service_role";



GRANT ALL ON TABLE "public"."visa_applications" TO "anon";
GRANT ALL ON TABLE "public"."visa_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."visa_applications" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_visa_applications"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_visa_applications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_visa_applications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_syncs"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_syncs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_syncs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_customer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_customer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_customer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_customer_on_document_review"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_customer_on_document_review"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_customer_on_document_review"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_customer_on_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_customer_on_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_customer_on_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."queue_document_for_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."queue_document_for_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."queue_document_for_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."queue_profile_for_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."queue_profile_for_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."queue_profile_for_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_portal_status_log_request_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_portal_status_log_request_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_portal_status_log_request_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_travel_request_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_travel_request_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_travel_request_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_document_completion"("request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_document_completion"("request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_document_completion"("request_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."customer_communications" TO "anon";
GRANT ALL ON TABLE "public"."customer_communications" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_communications" TO "service_role";



GRANT ALL ON TABLE "public"."customer_documents" TO "anon";
GRANT ALL ON TABLE "public"."customer_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_documents" TO "service_role";



GRANT ALL ON TABLE "public"."customer_requests" TO "anon";
GRANT ALL ON TABLE "public"."customer_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_requests" TO "service_role";



GRANT ALL ON TABLE "public"."document_requirements" TO "anon";
GRANT ALL ON TABLE "public"."document_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."document_requirements" TO "service_role";



GRANT ALL ON TABLE "public"."flight_search_cache" TO "anon";
GRANT ALL ON TABLE "public"."flight_search_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."flight_search_cache" TO "service_role";



GRANT ALL ON TABLE "public"."hotel_offers" TO "anon";
GRANT ALL ON TABLE "public"."hotel_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."hotel_offers" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."portal_documents" TO "anon";
GRANT ALL ON TABLE "public"."portal_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."portal_documents" TO "service_role";



GRANT ALL ON TABLE "public"."portal_notifications" TO "anon";
GRANT ALL ON TABLE "public"."portal_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."portal_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."portal_customer_summary" TO "anon";
GRANT ALL ON TABLE "public"."portal_customer_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."portal_customer_summary" TO "service_role";



GRANT ALL ON TABLE "public"."portal_status_log" TO "anon";
GRANT ALL ON TABLE "public"."portal_status_log" TO "authenticated";
GRANT ALL ON TABLE "public"."portal_status_log" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."sync_queue" TO "anon";
GRANT ALL ON TABLE "public"."sync_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_queue" TO "service_role";



GRANT ALL ON TABLE "public"."system_logs" TO "anon";
GRANT ALL ON TABLE "public"."system_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."system_logs" TO "service_role";



GRANT ALL ON TABLE "public"."travel_request_portal_summary" TO "anon";
GRANT ALL ON TABLE "public"."travel_request_portal_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."travel_request_portal_summary" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_processing_log" TO "anon";
GRANT ALL ON TABLE "public"."webhook_processing_log" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_processing_log" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







